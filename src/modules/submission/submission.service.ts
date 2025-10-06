import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { CreateSubmissionDtoInput } from './dto/create-submission.dto.input';
import { SubmissionRepository } from './submission.repository';
import { Submission } from './submission.schema';
import { validateAndNormalizeValue } from './utils/validate-and-normalize';
import { FormFullRepository } from '../form-full/form-full.repository';

@Injectable()
export class SubmissionSevice {
  constructor(
    private readonly repository: SubmissionRepository,
    private readonly formFullRepository: FormFullRepository,
  ) {}

  async create(dto: CreateSubmissionDtoInput): Promise<Submission> {
    const form = await this.formFullRepository.findById(dto.formId);
    if (!form) {
      throw new BadRequestException('Form not found');
    }
    const questionLenght = form?.sections.reduce((acc, section) => {
      return acc + (section.questions?.length ?? 0);
    }, 0);
    if (questionLenght === 0) throw new BadRequestException('Form is empty');

    if (dto.answers.length === 0) throw new BadRequestException('Answers is empty');

    const qById = new Map(
      form.sections.flatMap((s) => s.questions.map((q) => q)).map((q) => [q._id, q]),
    );
    qById.forEach((q) => {
      const answer = dto.answers.find((a) => a.questionId === q._id?.toString());
      if (!answer) {
        throw new BadRequestException(`Question ${q._id.toString()} not found`);
      }
      validateAndNormalizeValue(answer, q);
    });

    const entity = plainToInstance(Submission, dto);
    entity.form = form;

    const submission = await this.repository.create(entity);
    await this.formFullRepository.updateOne(form);
    return submission;
  }

  async findById(id: string): Promise<Submission | null> {
    return await this.repository.findById(id);
  }

  async find(data: GetAllInput): Promise<GetAllOutput<Submission>> {
    return await this.repository.find(data);
  }
}
