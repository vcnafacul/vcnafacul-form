import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { CreateQuestionDtoInput } from './dto/create-question.dto.input';
import { UpdateQuestionDtoInput } from './dto/update-question.dto.input';
import { ComplexConditionDtoInput } from './dto/complex-condition.dto.input';
import { AnswerType } from './enum/answer-type';
import { QuestionRepository } from './question.repository';
import { Question } from './question.schema';
import { SectionRepository } from '../section/section.repository';
import { condicoesIguais } from './utils/condicoes-iguais';

@Injectable()
export class QuestionSevice {
  constructor(
    private readonly repository: QuestionRepository,
    private readonly sectionRepository: SectionRepository,
  ) {}

  async create(dto: CreateQuestionDtoInput): Promise<Question> {
    const section = await this.sectionRepository.findById(dto.sectionId);
    if (!section) {
      throw new HttpException('section não existe', HttpStatus.NOT_FOUND);
    }

    if (dto.conditions) {
      await this.validateConditions(dto.conditions);
    }

    let question!: Question;
    const entity = plainToInstance(Question, dto);

    try {
      const session = await this.repository.startSession();
      session.startTransaction();

      question = await this.repository.create(entity, { session });

      section.questions.push(question);
      await this.sectionRepository.updateOne(section, { session });

      await session.commitTransaction();
      await session.endSession();

      return question;
    } catch {
      throw new HttpException('Erro ao criar a questão', HttpStatus.BAD_REQUEST);
    }
  }

  async findById(id: string): Promise<Question | null> {
    return await this.repository.findById(id);
  }

  async find(data: GetAllInput): Promise<GetAllOutput<Question>> {
    return await this.repository.find(data);
  }

  async update(id: string, dto: UpdateQuestionDtoInput): Promise<Question> {
    const existingQuestion = await this.repository.findById(id);
    if (!existingQuestion) {
      throw new HttpException('Questão não encontrada', HttpStatus.NOT_FOUND);
    }

    // Uma questão condicionada a ela mesma nunca aparece (card 27).
    if (dto.conditions?.conditions?.some((c) => String(c.questionId) === id)) {
      throw new HttpException(
        'Uma questão não pode ter condição sobre ela mesma',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Só valida condições que mudaram (card 23): reenviar as mesmas, com uma
    // referência que ficou inativa depois, não pode travar a edição do texto.
    if (dto.conditions && !condicoesIguais(existingQuestion.conditions, dto.conditions)) {
      await this.validateConditions(dto.conditions);
    }

    if (dto.answerType === AnswerType.Options && (!dto.options || dto.options.length === 0)) {
      throw new HttpException(
        'Options é obrigatório quando AnswerType for Options',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.answerType && dto.answerType !== AnswerType.Options) {
      dto.options = [];
    }

    // Opção removida ou renomeada que outra questão usa em condição: a
    // condição nunca mais seria atendida (card 20).
    if (dto.options && existingQuestion.options?.length) {
      const removidas = existingQuestion.options.filter((o) => !dto.options!.includes(o));
      if (removidas.length > 0) {
        const dependentes = await this.dependentesDe(id, { valores: removidas });
        if (dependentes.length > 0) {
          throw new HttpException(
            `A opção ${removidas.map((o) => `"${o}"`).join(', ')} é usada nas condições de: ${dependentes.map((d) => `"${d.text}"`).join(', ')}. Atualize essas condições antes.`,
            HttpStatus.CONFLICT,
          );
        }
      }
    }

    try {
      await this.repository.updateFields(existingQuestion._id, dto);
      const updatedQuestion = await this.repository.findById(id);
      return updatedQuestion!;
    } catch {
      throw new HttpException('Erro ao atualizar a questão', HttpStatus.BAD_REQUEST);
    }
  }

  async setActive(questionId: string) {
    const question = await this.repository.findById(questionId);
    if (!question) {
      throw new HttpException('question id not exist', HttpStatus.NOT_FOUND);
    }

    // Desativar uma referência de condição faria as dependentes sumirem para
    // sempre (card 20). Reativar é livre.
    if (question.active) {
      await this.recusarSeReferencia(questionId, { soAtivas: true });
    }
    question.active = !question.active;
    await this.repository.updateOne(question);
  }

  /**
   * Questões (não excluídas) cujas condições apontam para `questionId` —
   * opcionalmente só as que comparam com um dos `valores` (tickets-
   * documentacao, card 20).
   */
  private async dependentesDe(
    questionId: string,
    { soAtivas = false, valores }: { soAtivas?: boolean; valores?: string[] } = {},
  ): Promise<{ text: string }[]> {
    const filtro: Record<string, unknown> = {
      _id: { $ne: questionId },
      deleted: { $ne: true },
      'conditions.conditions': {
        $elemMatch: {
          questionId,
          ...(valores ? { expectedValue: { $in: valores } } : {}),
        },
      },
    };
    if (soAtivas) filtro.active = true;
    return await this.repository.model.find(filtro, { text: 1 });
  }

  /**
   * Excluir ou desativar uma questão usada em condição deixava a condição
   * apontando para o nada: a dependente nunca mais aparecia, e ninguém via
   * (card 20). Recusa listando as perguntas — o caminho é remover essas
   * condições antes (botão "Remover condições", card 22).
   */
  private async recusarSeReferencia(
    questionId: string,
    opcoes: { soAtivas?: boolean } = {},
  ): Promise<void> {
    const dependentes = await this.dependentesDe(questionId, opcoes);
    if (dependentes.length > 0) {
      throw new HttpException(
        `Esta questão é usada nas condições de: ${dependentes.map((d) => `"${d.text}"`).join(', ')}. Remova essas condições antes.`,
        HttpStatus.CONFLICT,
      );
    }
  }

  async delete(id: string): Promise<void> {
    const question = await this.repository.findById(id);
    if (!question) {
      throw new HttpException('Questão não encontrada', HttpStatus.NOT_FOUND);
    }
    await this.recusarSeReferencia(id);

    try {
      const session = await this.repository.startSession();
      session.startTransaction();

      await this.repository.delete(id);

      const sections = await this.sectionRepository.model.find({
        questions: question._id,
      });

      for (const section of sections) {
        section.questions = section.questions.filter(
          (q) => q._id?.toString() !== question._id.toString(),
        );
        await this.sectionRepository.updateOne(section, { session });
      }

      await session.commitTransaction();
      await session.endSession();
    } catch {
      throw new HttpException('Erro ao excluir a questão', HttpStatus.BAD_REQUEST);
    }
  }

  private async validateConditions(conditions: ComplexConditionDtoInput): Promise<void> {
    if (!conditions.conditions || conditions.conditions.length === 0) {
      throw new HttpException(
        'Conditions deve conter pelo menos uma condição',
        HttpStatus.BAD_REQUEST,
      );
    }

    const questionIds = conditions.conditions.map((c) => c.questionId);
    const uniqueQuestionIds = [...new Set(questionIds)];

    const existingQuestions = await this.repository.model.find({
      _id: { $in: uniqueQuestionIds },
      active: true,
    });

    if (existingQuestions.length !== uniqueQuestionIds.length) {
      const existingIds = existingQuestions.map((q) => q._id.toString());
      const missingIds = uniqueQuestionIds.filter((id) => !existingIds.includes(id));
      // O texto das perguntas, não os ids: quem lê o toast precisa saber qual
      // questão está atrapalhando (card 23).
      const inativas = await this.repository.model.find({ _id: { $in: missingIds } });
      const descricao = missingIds.map((id) => {
        const q = inativas.find((i) => i._id.toString() === id);
        return q ? `"${q.text}" (inativa)` : 'uma questão excluída';
      });

      throw new HttpException(
        `As condições apontam para questões inativas ou excluídas: ${descricao.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
