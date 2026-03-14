import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { QuestionRepository } from '../question/question.repository';
import { OwnerType } from '../form/enum/owner-type.enum';
import { CreateSectionDtoInput } from './dto/create-section.dto.input';
import { SectionRepository } from './section.repository';
import { Section } from './section.schema';
import { FormRepository } from '../form/form.repository';
import { UpdateSectionDtoInput } from './dto/update-section.dto.input';
import { ReorderQuestionsDtoInput } from './dto/reorder-questions.dto.input';
import { Question } from '../question/question.schema';

@Injectable()
export class SectionSevice {
  constructor(
    private readonly repository: SectionRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly formRepository: FormRepository,
  ) {}

  async create(dto: CreateSectionDtoInput, formId?: string): Promise<Section> {
    try {
      // Se formId foi passado, usa ele; senão fallback para form ativo (transição)
      const form = formId
        ? await this.formRepository.findById(formId)
        : await this.formRepository.findActiveForm();

      if (!form || form.deleted) {
        throw new HttpException('Form not found', HttpStatus.NOT_FOUND);
      }
      const section = new Section();
      section.name = dto.name;
      section.description = dto.description ?? '';

      const session = await this.repository.startSession();
      session.startTransaction();

      // Primeiro cria a seção no banco para obter o _id
      const sectionCreated = await this.repository.create(section, { session });

      // Depois adiciona apenas o _id da seção criada ao form
      form.sections.push(sectionCreated._id as any);
      await this.formRepository.updateOne(form, { session });

      await session.commitTransaction();
      await session.endSession();

      return sectionCreated;
    } catch (error) {
      throw new HttpException(`Erro ao criar a seção: ${error}`, HttpStatus.BAD_REQUEST);
    }
  }

  async findById(id: string): Promise<Section | null> {
    return await this.repository.findById(id);
  }

  async find(data: GetAllInput): Promise<GetAllOutput<Section>> {
    return await this.repository.find(data);
  }

  async findByOwner(
    ownerType: OwnerType,
    ownerId: string | undefined,
    data: GetAllInput,
  ): Promise<GetAllOutput<Section>> {
    const form =
      ownerType === OwnerType.GLOBAL
        ? await this.formRepository.findActiveGlobalForm()
        : await this.formRepository.findActivePartnerForm(ownerId!);

    if (!form) {
      // Nenhum form existe para esse owner — retorna lista vazia
      return { data: [], page: data.page, limit: data.limit, totalItems: 0 };
    }

    // Busca apenas as seções que pertencem a esse form
    const sectionIds = form.sections.map((s) => s.toString());
    return await this.repository.findByIds(sectionIds, data);
  }

  async setActive(sectionId: string) {
    const section = await this.repository.findById(sectionId);
    if (!section) {
      throw new HttpException('section id not exist', HttpStatus.NOT_FOUND);
    }
    section.active = !section.active;
    await this.repository.updateOne(section);
  }

  async delete(id: string): Promise<void> {
    // Verifica se a seção existe
    const section = await this.repository.findById(id);
    if (!section) {
      throw new HttpException('Seção não encontrada', HttpStatus.NOT_FOUND);
    }

    // Verifica se existem questões associadas à seção
    if (section.questions && section.questions.length > 0) {
      throw new HttpException(
        'Não é possível excluir a seção pois existem questões associadas a ela',
        HttpStatus.CONFLICT,
      );
    }

    try {
      await this.repository.delete(id);
    } catch {
      throw new HttpException('Erro ao excluir a seção', HttpStatus.BAD_REQUEST);
    }
  }

  //função update de section que altera o nome da seção
  async update(id: string, dto: UpdateSectionDtoInput): Promise<void> {
    const section = await this.repository.findById(id);
    if (!section) {
      throw new HttpException('Seção não encontrada', HttpStatus.NOT_FOUND);
    }
    section.name = dto.name;
    if (dto.description !== undefined) {
      section.description = dto.description;
    }
    await this.repository.updateOne(section);
  }

  async reorderQuestions(sectionId: string, dto: ReorderQuestionsDtoInput): Promise<void> {
    // Busca a seção
    const section = await this.repository.findById(sectionId);
    if (!section) {
      throw new HttpException('Seção não encontrada', HttpStatus.NOT_FOUND);
    }

    // Converte os IDs da seção para strings para comparação
    const sectionQuestionIds = section.questions.map((q) => q._id.toString());
    const receivedQuestionIds = dto.questionIds;

    // Validação 1: Verifica se todos os IDs recebidos existem na seção
    const missingInSection = receivedQuestionIds.filter((id) => !sectionQuestionIds.includes(id));
    if (missingInSection.length > 0) {
      throw new HttpException(
        `As seguintes questões não pertencem à seção: ${missingInSection.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validação 2: Verifica se todos os IDs da seção estão no array recebido
    const missingInReceived = sectionQuestionIds.filter((id) => !receivedQuestionIds.includes(id));
    if (missingInReceived.length > 0) {
      throw new HttpException(
        `As seguintes questões da seção estão faltando no array recebido: ${missingInReceived.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validação 3: Verifica se a quantidade de IDs é igual
    if (sectionQuestionIds.length !== receivedQuestionIds.length) {
      throw new HttpException('A quantidade de questões não corresponde', HttpStatus.BAD_REQUEST);
    }

    // Reordena as questões na seção baseado no novo array
    // Cria um mapa para manter os objetos completos das questões
    const questionsMap = new Map(section.questions.map((q) => [q._id.toString(), q]));

    // Reordena baseado no array recebido
    section.questions = receivedQuestionIds
      .map((id) => questionsMap.get(id))
      .filter((q) => q !== undefined);

    try {
      await this.repository.updateOne(section);
    } catch {
      throw new HttpException('Erro ao reordenar as questões', HttpStatus.BAD_REQUEST);
    }
  }

  async duplicate(sectionId: string): Promise<void> {
    try {
      // Busca a seção original com suas questões
      const originalSection = await this.repository.findById(sectionId);
      if (!originalSection) {
        throw new HttpException('Seção não encontrada', HttpStatus.NOT_FOUND);
      }

      // Busca o formulário dono da seção
      const form = await this.formRepository.findFormBySectionId(sectionId);
      if (!form) {
        throw new HttpException('Formulário não encontrado', HttpStatus.NOT_FOUND);
      }

      const newSection = Section.createCopy(originalSection);

      // Inicia a sessão e transação
      const session = await this.repository.startSession();
      session.startTransaction();

      try {
        // Cria a nova seção
        const sectionCreated = await this.repository.create(newSection, { session });

        // Duplica todas as questões da seção original
        const newQuestionIds: any[] = [];
        for (const originalQuestion of originalSection.questions) {
          const newQuestion = Question.createCopy(originalQuestion);
          const questionCreated = await this.questionRepository.create(newQuestion, { session });
          newQuestionIds.push(questionCreated._id);
        }

        // Atualiza a seção com os IDs das novas questões
        sectionCreated.questions = newQuestionIds as Question[];
        await this.repository.updateOne(sectionCreated, { session });

        // Adiciona apenas o _id da nova seção ao formulário
        form.sections.push(sectionCreated._id as any);
        await this.formRepository.updateOne(form, { session });

        // Commit da transação
        await session.commitTransaction();
        await session.endSession();
      } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        throw error;
      }
    } catch (error) {
      throw new HttpException(
        `Erro ao duplicar a seção: ${error.message || error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
