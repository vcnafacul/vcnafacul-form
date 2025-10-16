import { Injectable } from '@nestjs/common';
import { createRepository } from 'src/common/base/base.repository';
import { Form } from './form.schema';

@Injectable()
export class FormRepository extends createRepository(Form) {
  async findBy(where: object): Promise<Form | null> {
    return await this.model
      .findOne({ ...where, deleted: false })
      .populate('sections')
      .populate({
        path: 'sections',
        populate: ['questions'],
      })
      .exec();
  }

  async findOneWithSections(): Promise<Form | null> {
    return await this.model.findOne({}).populate('sections').exec();
  }

  async findActiveFormFull(): Promise<Form | null> {
    return await this.model
      .findOne({ active: true, deleted: false })
      .populate({
        path: 'sections',
        match: { active: true, deleted: false },
        populate: {
          path: 'questions',
          match: { active: true, deleted: false },
        },
      })
      .lean()
      .exec();
  }
}
