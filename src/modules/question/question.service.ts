import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Types } from 'mongoose';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { SectionSevice } from '../section/section.service';
import { CreateQuestionDtoInput } from './dto/create-question.dto.input';
import { QuestionRepository } from './question.repository';
import { Question } from './question.schema';

@Injectable()
export class QuestionSevice {
  constructor(
    private readonly repository: QuestionRepository,
    private readonly sectionService: SectionSevice,
  ) {}

  async create(dto: CreateQuestionDtoInput): Promise<Question> {
    // Guard clause: sectionId inválido → 400
    if (dto.sectionId && !Types.ObjectId.isValid(dto.sectionId)) {
      throw new HttpException('sectionId inválido', HttpStatus.BAD_REQUEST);
    }

    // Se veio sectionId, garanta que a seção existe (rápido e barato)
    if (dto.sectionId) {
      const exists = await this.sectionService.findById(dto.sectionId);
      if (!exists) {
        throw new HttpException('sectionId não existe', HttpStatus.NOT_FOUND);
      }
    }

    let question!: Question;
    try {
      const entity = plainToInstance(Question, dto);
      question = await this.repository.create(entity);
      if (dto.sectionId && question._id) {
        await this.sectionService.addQuestion({
          sectionId: dto.sectionId,
          questionId: question._id.toString(),
        });
      }
      return question;
    } catch {
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
}
