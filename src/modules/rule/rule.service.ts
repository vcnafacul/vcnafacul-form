import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { Rule } from './rule.schema';
import { RuleRepository } from './rule.repository';
import { CreateRuleDtoInput } from './dto/create-rule.dto.input';
import { UpdateRuleDtoInput } from './dto/update-rule.dto.input';
import { plainToInstance } from 'class-transformer';
import { QuestionRepository } from '../question/question.repository';
import { AnswerType } from '../question/enum/answer-type';
import { Strategy } from './enum/strategy';
import { assertPerOptionKeysExist } from './validate/assert-per-option-keys-exist';

@Injectable()
export class RuleService {
  constructor(
    private readonly repository: RuleRepository,
    private readonly questionRepository: QuestionRepository,
  ) {}

  async create(dto: CreateRuleDtoInput): Promise<Rule> {
    if (dto.strategy === Strategy.ComputedInverseProportional) {
      return this.createComputedInverseProportional(dto);
    }

    if (!dto.questionId) {
      throw new NotFoundException('Question ID is required');
    }
    const question = await this.questionRepository.findById(dto.questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const strategy =
      dto.strategy ??
      (question.answerType === AnswerType.Number
        ? Strategy.NumericRange
        : Strategy.PerOption);

    if (strategy === Strategy.PerOption) {
      assertPerOptionKeysExist(question, dto.config);
    }

    const rule = plainToInstance(Rule, dto);
    rule.strategy = strategy;
    rule.question = question;
    return await this.repository.create(rule);
  }

  private async createComputedInverseProportional(
    dto: CreateRuleDtoInput,
  ): Promise<Rule> {
    const questionIds = dto.config?.questionIds as string[];
    if (!questionIds || questionIds.length < 2) {
      throw new BadRequestException(
        'ComputedInverseProportional requer pelo menos 2 questionIds',
      );
    }

    for (const qId of questionIds) {
      const question = await this.questionRepository.findById(qId);
      if (!question) {
        throw new NotFoundException(`Question não encontrada: ${qId}`);
      }
      if (question.answerType !== AnswerType.Number) {
        throw new BadRequestException(
          `Question '${question.text}' não é do tipo Number`,
        );
      }
    }

    const rule = plainToInstance(Rule, dto);
    rule.strategy = Strategy.ComputedInverseProportional;
    return await this.repository.create(rule);
  }

  async findById(id: string): Promise<Rule | null> {
    return await this.repository.findById(id);
  }

  async find(data: GetAllInput): Promise<GetAllOutput<Rule>> {
    return await this.repository.find(data);
  }

  async update(id: string, dto: UpdateRuleDtoInput): Promise<Rule> {
    const rule = await this.repository.findById(id);
    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    if (dto.questionId) {
      const question = await this.questionRepository.findById(dto.questionId);
      if (!question) {
        throw new NotFoundException('Question not found');
      }
      rule.question = question;
    }

    const strategy = dto.strategy ?? rule.strategy;
    const config = dto.config ?? rule.config;

    if (strategy === Strategy.PerOption && dto.config) {
      assertPerOptionKeysExist(rule.question, config);
    }

    if (dto.name !== undefined) rule.name = dto.name;
    if (dto.description !== undefined) rule.description = dto.description;
    if (dto.type !== undefined) rule.type = dto.type;
    if (dto.strategy !== undefined) rule.strategy = dto.strategy;
    if (dto.config !== undefined) rule.config = dto.config;
    if (dto.weight !== undefined) rule.weight = dto.weight;

    await this.repository.updateOne(rule);
    return rule;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
