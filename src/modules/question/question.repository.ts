import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { createRepository } from 'src/common/base/base.repository';
import { Question } from './question.schema';

@Injectable()
export class QuestionRepository extends createRepository(Question) {
  async findById(id: string): Promise<Question | null> {
    if (!Types.ObjectId.isValid(id)) {
      // ID inválido → trata como "não encontrado"
      return null;
    }
    return await this.model.findById(id).exec();
  }
}
