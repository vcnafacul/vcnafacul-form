import { createRepository } from 'src/common/base/base.repository';
import { Injectable } from '@nestjs/common';
import { Section } from './section.schema';
import { Types } from 'mongoose';

@Injectable()
export class SectionRepository extends createRepository(Section) {
  async findById(id: string): Promise<Section | null> {
    if (!Types.ObjectId.isValid(id)) {
      // ID inválido → trata como "não encontrado"
      return null;
    }
    return await this.model.findById(id).populate('questions').exec();
  }
}
