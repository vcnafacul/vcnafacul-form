import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { CreateQuestionDtoInput } from './dto/create-question.dto.input';
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
    let question!: Question;
    const entity = plainToInstance(Question, dto);
    section.questions.push(entity);

    try {
      const session = await this.repository.startSession();
      session.startTransaction();

      question = await this.repository.create(entity);
      await this.sectionRepository.updateOne(section, { session });

      await session.commitTransaction();
      await session.endSession();

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
