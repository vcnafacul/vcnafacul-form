import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { RuleType } from '../rule/enum/rule-type';
import { RuleRepository } from '../rule/rule.repository';
import { SubmissionRepository } from '../submission/submission.repository';
import { Submission } from '../submission/submission.schema';
import { CreateRuleSetDtoInput } from './dto/create-rule-set.dto.input';
import { RankingDtoInput } from './dto/ranking.dto.input';
import { RankingDto, RankingDtoOutput } from './dto/ranking.dto.output';
import { Action, UpdateRuleSetWithActionDtoInput } from './dto/update-rule-set.dto.input';
import { RuleSetRepository } from './rule-set.repository';
import { RuleSet } from './rule-set.schema';
import { plainToInstance } from 'class-transformer';
import { getGroupRankingTie } from './utils/get-group-ranking-tie';
import { getRankingByPoint } from './utils/get-ranking-by-point';
import { resolveAllTies } from './utils/tie-breaker';

@Injectable()
export class RuleSetSevice {
  constructor(
    private readonly repository: RuleSetRepository,
    private readonly ruleRepository: RuleRepository,
    private readonly submissionRepository: SubmissionRepository,
  ) {}

  async create(dto: CreateRuleSetDtoInput): Promise<RuleSet> {
    const ruleSet = new RuleSet();
    ruleSet.name = dto.name;
    return await this.repository.create(ruleSet);
  }

  async findById(id: string): Promise<RuleSet | null> {
    return await this.repository.findById(id);
  }

  async find(data: GetAllInput): Promise<GetAllOutput<RuleSet>> {
    return await this.repository.find(data);
  }

  async addOrRemoveRule({
    ruleSetId,
    ruleId,
    action,
  }: UpdateRuleSetWithActionDtoInput): Promise<RuleSet> {
    const ruleSet = await this.repository.findById(ruleSetId);
    if (!ruleSet) {
      throw new Error('RuleSet not found');
    }
    const rule = await this.ruleRepository.findById(ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }
    if (action === Action.Add) {
      if (rule.type === RuleType.Score) {
        ruleSet.scoringRules.push(rule);
      } else {
        ruleSet.tieBreakerRules.push(rule);
      }
    } else {
      if (rule.type === RuleType.Score) {
        ruleSet.scoringRules = ruleSet.scoringRules.filter((r) => r._id !== rule._id);
      } else {
        ruleSet.tieBreakerRules = ruleSet.tieBreakerRules.filter((r) => r._id !== rule._id);
      }
    }

    await this.repository.updateOne(ruleSet);

    return ruleSet;
  }

  public async rankFormUsers({ ruleSetId, users }: RankingDtoInput): Promise<RankingDtoOutput> {
    const ruleSet = await this.getRuleSet(ruleSetId);
    const subs = await this.getSubmissions(users, ruleSet.form._id!);
    const subByUser = new Map<string, Submission>(subs.map((s) => [s.userId, s]));

    const rank = getRankingByPoint(subByUser, ruleSet, users);
    const ties = getGroupRankingTie(rank);
    if (ruleSet.tieBreakerRules.length === 0) {
      return new RankingDtoOutput(plainToInstance(RankingDto, rank));
    }
    const tieB = resolveAllTies(ties, rank, ruleSet, subByUser);
    return new RankingDtoOutput(plainToInstance(RankingDto, tieB));
  }

  private async getRuleSet(id: string): Promise<RuleSet> {
    const ruleSet = await this.repository.findById(id);
    if (!ruleSet) {
      throw new HttpException('RuleSet not found', HttpStatus.NOT_FOUND);
    }
    if (!ruleSet.form) {
      throw new HttpException('RuleSet not has form', HttpStatus.BAD_REQUEST);
    }
    return ruleSet;
  }

  private async getSubmissions(users: string[], formId: Types.ObjectId): Promise<Submission[]> {
    const submissions = await this.submissionRepository.findByUsersId(users, formId);
    if (submissions.length === 0) {
      throw new HttpException('User Submissions not found', HttpStatus.NOT_FOUND);
    }
    if (submissions.length !== users.length) {
      throw new HttpException('Not found all user submissions', HttpStatus.NOT_FOUND);
    }
    return submissions;
  }
}
