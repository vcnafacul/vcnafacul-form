import { Injectable } from '@nestjs/common';
import { createRepository } from 'src/common/base/base.repository';
import { Form } from './form.schema';

@Injectable()
export class FormRepository extends createRepository(Form) {
  async findBy(where: object): Promise<Form | null> {
    return await this.model
      .findById({ ...where })
      .populate('sections')
      .populate({
        path: 'sections',
        populate: ['questions'],
      })
      .exec();
  }

  async findActive(): Promise<Form | null> {
    return await this.model.findOne({ active: true }).exec();
  }
}
