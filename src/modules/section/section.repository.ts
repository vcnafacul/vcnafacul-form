import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { createRepository } from 'src/common/base/base.repository';
import { Section } from './section.schema';

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
