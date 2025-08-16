import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { CreateSectionDtoInput } from './dto/create-section.dto.input';
import { SectionRepository } from './section.repository';
import { Section } from './section.schema';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AddQuestionDtoInput } from './dto/add-question.dto.input';
import { QuestionRepository } from '../question/question.repository';

@Injectable()
export class SectionSevice {
  constructor(
    private readonly repository: SectionRepository,
    private readonly questionRepository: QuestionRepository,
  ) {}

  async create(dto: CreateSectionDtoInput): Promise<Section> {
    const section = new Section();
    section.name = dto.name;

    return await this.repository.create(section);
  }

  async findById(id: string): Promise<Section | null> {
    return await this.repository.findById(id);
  }

  async find(data: GetAllInput): Promise<GetAllOutput<Section>> {
    return await this.repository.find(data);
  }

  async addQuestion({ sectionId, questionId }: AddQuestionDtoInput) {
    const section = await this.repository.findById(sectionId);
    if (!section) {
      throw new HttpException('section id not exist', HttpStatus.NOT_FOUND);
    }
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new HttpException('section id not exist', HttpStatus.NOT_FOUND);
    }
    section.questions.push(question);
    await this.repository.updateOne(section);
    return section;
  }
}
