import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { OwnerContext } from 'src/common/interfaces/owner-context.interface';
import { QuestionRepository } from '../question/question.repository';
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

  async create(dto: CreateSectionDtoInput, ownerContext: OwnerContext): Promise<Section> {
    try {
      const form = await this.formRepository.findActiveForm(
        ownerContext.ownerType,
        ownerContext.ownerId,
      );
      if (!form) {
        throw new HttpException(
          'Nenhum formulário ativo encontrado para este proprietário',
          HttpStatus.NOT_FOUND,
        );
      }
      const section = new Section();
      section.name = dto.name;

      const session = await this.repository.startSession();
      session.startTransaction();

      const sectionCreated = await this.repository.create(section, { session });
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

  async find(data: GetAllInput, ownerContext: OwnerContext): Promise<GetAllOutput<Section>> {
    const form = await this.formRepository.findActiveForm(
      ownerContext.ownerType,
      ownerContext.ownerId,
    );
    if (!form) {
      return { data: [], page: 1, limit: 10, totalItems: 0 };
    }
    const sectionIds = form.sections.map((s: any) => s.toString());
    return await this.repository.find({
      ...data,
      where: { _id: { $in: sectionIds } },
    });
  }

  async setActive(sectionId: string, ownerContext: OwnerContext) {
    await this.formRepository.validateSectionOwnership(sectionId, ownerContext);
    const section = await this.repository.findById(sectionId);
    if (!section) {
      throw new HttpException('section id not exist', HttpStatus.NOT_FOUND);
    }
    section.active = !section.active;
    await this.repository.updateOne(section);
  }

  async delete(id: string, ownerContext: OwnerContext): Promise<void> {
    await this.formRepository.validateSectionOwnership(id, ownerContext);
    const section = await this.repository.findById(id);
    if (!section) {
      throw new HttpException('Seção não encontrada', HttpStatus.NOT_FOUND);
    }
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

  async update(id: string, dto: UpdateSectionDtoInput, ownerContext: OwnerContext): Promise<void> {
    await this.formRepository.validateSectionOwnership(id, ownerContext);
    const section = await this.repository.findById(id);
    if (!section) {
      throw new HttpException('Seção não encontrada', HttpStatus.NOT_FOUND);
    }
    section.name = dto.name;
    await this.repository.updateOne(section);
  }

  async reorderQuestions(
    sectionId: string,
    dto: ReorderQuestionsDtoInput,
    ownerContext: OwnerContext,
  ): Promise<void> {
    await this.formRepository.validateSectionOwnership(sectionId, ownerContext);
    const section = await this.repository.findById(sectionId);
    if (!section) {
      throw new HttpException('Seção não encontrada', HttpStatus.NOT_FOUND);
    }

    const sectionQuestionIds = section.questions.map((q) => q._id.toString());
    const receivedQuestionIds = dto.questionIds;

    const missingInSection = receivedQuestionIds.filter((id) => !sectionQuestionIds.includes(id));
    if (missingInSection.length > 0) {
      throw new HttpException(
        `As seguintes questões não pertencem à seção: ${missingInSection.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const missingInReceived = sectionQuestionIds.filter((id) => !receivedQuestionIds.includes(id));
    if (missingInReceived.length > 0) {
      throw new HttpException(
        `As seguintes questões da seção estão faltando no array recebido: ${missingInReceived.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (sectionQuestionIds.length !== receivedQuestionIds.length) {
      throw new HttpException('A quantidade de questões não corresponde', HttpStatus.BAD_REQUEST);
    }

    const questionsMap = new Map(section.questions.map((q) => [q._id.toString(), q]));
    section.questions = receivedQuestionIds
      .map((id) => questionsMap.get(id))
      .filter((q) => q !== undefined);

    try {
      await this.repository.updateOne(section);
    } catch {
      throw new HttpException('Erro ao reordenar as questões', HttpStatus.BAD_REQUEST);
    }
  }

  async duplicate(sectionId: string, ownerContext: OwnerContext): Promise<void> {
    try {
      await this.formRepository.validateSectionOwnership(sectionId, ownerContext);

      const originalSection = await this.repository.findById(sectionId);
      if (!originalSection) {
        throw new HttpException('Seção não encontrada', HttpStatus.NOT_FOUND);
      }

      const form = await this.formRepository.findActiveForm(
        ownerContext.ownerType,
        ownerContext.ownerId,
      );
      if (!form) {
        throw new HttpException('Formulário não encontrado', HttpStatus.NOT_FOUND);
      }

      const newSection = Section.createCopy(originalSection);

      const session = await this.repository.startSession();
      session.startTransaction();

      try {
        const sectionCreated = await this.repository.create(newSection, { session });

        const newQuestionIds: any[] = [];
        for (const originalQuestion of originalSection.questions) {
          const newQuestion = Question.createCopy(originalQuestion);
          const questionCreated = await this.questionRepository.create(newQuestion, { session });
          newQuestionIds.push(questionCreated._id);
        }

        sectionCreated.questions = newQuestionIds as Question[];
        await this.repository.updateOne(sectionCreated, { session });

        form.sections.push(sectionCreated._id as any);
        await this.formRepository.updateOne(form, { session });

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

  async findGlobalActiveSections(): Promise<Section[]> {
    const form = await this.formRepository.findActiveFormFull('GLOBAL', null);
    if (!form) {
      return [];
    }
    return form.sections as Section[];
  }
}
