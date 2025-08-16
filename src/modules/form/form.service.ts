import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FormRepository } from './form.repository';
import { CreateFormDtoInput } from './dto/create-form.dto.input';
import { Form } from './form.schema';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { SectionRepository } from '../section/section.repository';
import { AddSectionDtoInput } from './dto/add-section.dto.input';

@Injectable()
export class FormSevice {
  constructor(
    private readonly repository: FormRepository,
    private readonly sectionRepository: SectionRepository,
  ) {}

  async create(dto: CreateFormDtoInput): Promise<Form> {
    const form = new Form();
    form.name = dto.name;

    return await this.repository.create(form);
  }

  async findById(id: string): Promise<Form | null> {
    return await this.repository.findById(id);
  }

  async find(data: GetAllInput): Promise<GetAllOutput<Form>> {
    return await this.repository.find(data);
  }

  async addSection({ formId, sectionId }: AddSectionDtoInput) {
    const form = await this.repository.findById(formId);
    if (!form) {
      throw new HttpException('form id not exist', HttpStatus.NOT_FOUND);
    }
    const section = await this.sectionRepository.findById(sectionId);
    if (!section) {
      throw new HttpException('section id not exist', HttpStatus.NOT_FOUND);
    }
    form.sections.push(section);
    await this.repository.updateOne(form);
    return form;
  }
}
