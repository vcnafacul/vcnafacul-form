import { Injectable } from '@nestjs/common';
import { FormFull } from './schema/form-full.schema';
import { createRepository } from 'src/common/base/base.repository';

@Injectable()
export class FormFullRepository extends createRepository(FormFull) {
  async findOneBy({ where }: { where: object }): Promise<FormFull | null> {
    return await this.model.findOne({ ...where }).exec();
  }
}
