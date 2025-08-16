import { Types } from 'mongoose';
import { createRepository } from 'src/common/base/base.repository';
import { Injectable } from '@nestjs/common';
import { Rule } from './rule.schema';

@Injectable()
export class RuleRepository extends createRepository(Rule) {
  async findById(id: string): Promise<Rule | null> {
    if (!Types.ObjectId.isValid(id)) {
      // ID inválido → trata como "não encontrado"
      return null;
    }
    return await this.model.findById(id).exec();
  }
}
