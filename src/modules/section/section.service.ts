import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { QuestionRepository } from '../question/question.repository';
import { CreateSectionDtoInput } from './dto/create-section.dto.input';
import { SectionRepository } from './section.repository';
import { Section } from './section.schema';
import { FormRepository } from '../form/form.repository';

@Injectable()
export class SectionSevice {
  constructor(
    private readonly repository: SectionRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly formRepository: FormRepository,
  ) {}

  async create(dto: CreateSectionDtoInput): Promise<Section> {
    const form = await this.formRepository.findOne({});
    if (!form) {
      throw new HttpException('form id not exist', HttpStatus.NOT_FOUND);
    }
    const section = new Section();
    section.name = dto.name;

    form.sections.push(section);

    const session = await this.repository.startSession();
    session.startTransaction();

    await this.formRepository.updateOne(form, { session });
    const sectionCreated = await this.repository.create(section, { session });

    await session.commitTransaction();
    await session.endSession();

    return sectionCreated;
  }

  async findById(id: string): Promise<Section | null> {
    return await this.repository.findById(id);
  }

  async find(data: GetAllInput): Promise<GetAllOutput<Section>> {
    return await this.repository.find(data);
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
}
