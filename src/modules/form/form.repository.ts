import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { createRepository } from 'src/common/base/base.repository';
import { Form } from './form.schema';

@Injectable()
export class FormRepository extends createRepository(Form) {
  async findById(id: string): Promise<Form | null> {
    if (!Types.ObjectId.isValid(id)) {
      // ID inválido → trata como "não encontrado"
      return null;
    }
    return await this.model
      .findById(id)
      .populate('sections')
      .populate({
        path: 'sections',
        populate: ['questions'],
      })
      .exec();
  }
}
