import { Injectable } from '@nestjs/common';
import { createRepository } from 'src/common/base/base.repository';
import { Section } from './section.schema';

@Injectable()
export class SectionRepository extends createRepository(Section) {
  async findById(id: string): Promise<Section | null> {
    return await this.model.findOne({ _id: id }).populate('questions').exec();
  }
}
