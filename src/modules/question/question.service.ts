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

    // Valida condições se fornecidas
    if (dto.conditions) {
      await this.validateConditions(dto.conditions);
    }

    let question!: Question;
    const entity = plainToInstance(Question, dto);

    try {
      const session = await this.repository.startSession();
      session.startTransaction();

      // Primeiro cria a questão no banco para gerar o _id
      question = await this.repository.create(entity, { session });

      // Depois adiciona a questão (com _id) ao array da seção
      section.questions.push(question);
      await this.sectionRepository.updateOne(section, { session });

      await session.commitTransaction();
      await session.endSession();

      return question;
    } catch (e) {
      console.log(e);
      // Você pode mapear aqui erros conhecidos (11000 etc.) para 409/400 se quiser
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
    // Verifica se a questão existe
    const existingQuestion = await this.repository.findById(id);
    if (!existingQuestion) {
      throw new HttpException('Questão não encontrada', HttpStatus.NOT_FOUND);
    }

    // Valida condições se fornecidas
    if (dto.conditions) {
      await this.validateConditions(dto.conditions);
    }

    // Aplica as validações do schema antes de atualizar
    // Se answerType está sendo alterado para Options, options deve ser fornecido
    if (dto.answerType === AnswerType.Options && (!dto.options || dto.options.length === 0)) {
      throw new HttpException(
        'Options é obrigatório quando AnswerType for Options',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Se answerType está sendo alterado para algo diferente de Options, limpa options
    if (dto.answerType && dto.answerType !== AnswerType.Options) {
      dto.options = [];
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
    question.active = !question.active;
    await this.repository.updateOne(question);
  }

  async delete(id: string): Promise<void> {
    // Verifica se a questão existe
    const question = await this.repository.findById(id);
    if (!question) {
      throw new HttpException('Questão não encontrada', HttpStatus.NOT_FOUND);
    }

    try {
      const session = await this.repository.startSession();
      session.startTransaction();

      // Remove a questão (soft delete)
      await this.repository.delete(id);

      // Remove a referência da questão na section
      // Busca todas as sections que contêm esta questão
      const sections = await this.sectionRepository.model.find({
        questions: question._id,
      });

      // Remove a referência da questão em cada section
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

  /**
   * Valida as condições fornecidas verificando se as questões referenciadas existem
   */
  private async validateConditions(conditions: ComplexConditionDtoInput): Promise<void> {
    if (!conditions.conditions || conditions.conditions.length === 0) {
      throw new HttpException(
        'Conditions deve conter pelo menos uma condição',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verifica se todas as questões referenciadas nas condições existem
    const questionIds = conditions.conditions.map((c) => c.questionId);
    const existingQuestions = await this.repository.model.find({
      _id: { $in: questionIds },
      active: true,
    });

    if (existingQuestions.length !== questionIds.length) {
      const existingIds = existingQuestions.map((q) => q._id.toString());
      const missingIds = questionIds.filter((id) => !existingIds.includes(id));

      throw new HttpException(
        `As seguintes questões referenciadas nas condições não existem ou estão inativas: ${missingIds.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
