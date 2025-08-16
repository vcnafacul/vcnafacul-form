import { Injectable } from '@nestjs/common';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { Rule } from './rule.schema';
import { RuleRepository } from './rule.repository';
import { CreateRuleDtoInput } from './dto/create-rule.dto.input';
import { plainToInstance } from 'class-transformer';
import { QuestionRepository } from '../question/question.repository';
import { Strategy } from './enum/strategy';
import { assertPerOptionKeysExist } from './validate/assert-per-option-keys-exist';

@Injectable()
export class RuleSevice {
  constructor(
    private readonly repository: RuleRepository,
    private readonly questionRepository: QuestionRepository,
  ) {}

  async create(dto: CreateRuleDtoInput): Promise<Rule> {
    const question = await this.questionRepository.findById(dto.questionId);
    if (!question) {
      throw new Error('questionId can not be null');
    }

    if (dto.strategy === Strategy.PerOption) {
      assertPerOptionKeysExist(question, dto.config);
    }

    const rule = plainToInstance(Rule, dto);
    return await this.repository.create(rule);
  }

  async findById(id: string): Promise<Rule | null> {
    return await this.repository.findById(id);
  }

  async find(data: GetAllInput): Promise<GetAllOutput<Rule>> {
    return await this.repository.find(data);
  }
}
