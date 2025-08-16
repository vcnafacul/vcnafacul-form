import { Types } from 'mongoose';
import { Question } from './question.schema';
import { createRepository } from 'src/common/base/base.repository';
import { Injectable } from '@nestjs/common';

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
