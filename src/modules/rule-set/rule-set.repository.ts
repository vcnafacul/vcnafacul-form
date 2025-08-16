import { Types } from 'mongoose';
import { createRepository } from 'src/common/base/base.repository';
import { Injectable } from '@nestjs/common';
import { RuleSet } from './rule-set.schema';

@Injectable()
export class RuleSetRepository extends createRepository(RuleSet) {
  async findById(id: string): Promise<RuleSet | null> {
    if (!Types.ObjectId.isValid(id)) {
      // ID inválido → trata como "não encontrado"
      return null;
    }
    return await this.model
      .findById(id)
      .populate('form')
      .populate({ path: 'scoringRules' })
      .populate({ path: 'tieBreakerRules' })
      .exec();
  }
}
