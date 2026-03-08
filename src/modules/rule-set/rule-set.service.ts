import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { GetAllInput } from 'src/common/base/interfaces/get-all.input';
import { GetAllOutput } from 'src/common/base/interfaces/get-all.output';
import { RuleType } from '../rule/enum/rule-type';
import { RuleRepository } from '../rule/rule.repository';
import { FormFullRepository } from '../form-full/form-full.repository';
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
export class RuleSetService {
  constructor(
    private readonly repository: RuleSetRepository,
    private readonly ruleRepository: RuleRepository,
    private readonly formFullRepository: FormFullRepository,
    private readonly submissionRepository: SubmissionRepository,
  ) {}

  async create(dto: CreateRuleSetDtoInput): Promise<RuleSet> {
    const formFull = await this.formFullRepository.findOneBy({
      where: { inscriptionId: dto.inscriptionId },
    });
    if (!formFull) {
      throw new NotFoundException('FormFull not found for this inscriptionId');
    }
    const ruleSet = new RuleSet();
    ruleSet.name = dto.name;
    ruleSet.form = formFull;
    return await this.repository.create(ruleSet);
  }

  async findById(id: string): Promise<RuleSet | null> {
    return await this.repository.findById(id);
  }

  async findOrCreateByInscriptionId(inscriptionId: string): Promise<RuleSet> {
    const formFull = await this.formFullRepository.findOneBy({
      where: { inscriptionId },
    });
    if (!formFull) {
      throw new NotFoundException('FormFull not found for this inscriptionId');
    }
    const existing = await this.repository.findByFormId(formFull._id);
    if (existing) {
      return existing;
    }
    const ruleSet = new RuleSet();
    ruleSet.name = `RuleSet - ${inscriptionId}`;
    ruleSet.form = formFull;
    const created = await this.repository.create(ruleSet);
    return (await this.repository.findById(String(created._id)))!;
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
      throw new NotFoundException('RuleSet not found');
    }
    const rule = await this.ruleRepository.findById(ruleId);
    if (!rule) {
      throw new NotFoundException('Rule not found');
    }
    if (action === Action.Add) {
      const rules = rule.type === RuleType.Score ? ruleSet.scoringRules : ruleSet.tieBreakerRules;
      const alreadyExists = rules.some((r) => String(r._id) === String(rule._id));
      if (alreadyExists) {
        throw new BadRequestException('Rule already exists in this RuleSet');
      }
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

  async update(id: string, name: string): Promise<RuleSet> {
    const ruleSet = await this.repository.findById(id);
    if (!ruleSet) {
      throw new NotFoundException('RuleSet not found');
    }
    ruleSet.name = name;
    await this.repository.updateOne(ruleSet);
    return ruleSet;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  public async rankFormUsers({ ruleSetId, users }: RankingDtoInput): Promise<RankingDtoOutput> {
    const ruleSet = await this.getRuleSet(ruleSetId);
    if (ruleSet.scoringRules.length === 0) {
      throw new BadRequestException('RuleSet has no scoring rules');
    }
    const subs = await this.getSubmissions(users, ruleSet.form._id);
    const subByUser = new Map<string, Submission>(subs.map((s) => [s.userId, s]));

    const rank = getRankingByPoint(subByUser, ruleSet, users);
    const ties = getGroupRankingTie(rank);
    let finalRank: RankingDto[];
    if (ruleSet.tieBreakerRules.length === 0) {
      finalRank = plainToInstance(RankingDto, rank);
    } else {
      finalRank = plainToInstance(RankingDto, resolveAllTies(ties, rank, ruleSet, subByUser));
    }

    ruleSet.lastRanking = finalRank.map((r) => ({
      rank: r.rank,
      userId: r.userId,
      totalScore: r.totalScore,
    }));
    ruleSet.lastRankingAt = new Date();
    await this.repository.updateOne(ruleSet);

    return new RankingDtoOutput(finalRank);
  }

  async getLastRanking(ruleSetId: string): Promise<RankingDtoOutput | null> {
    const ruleSet = await this.repository.findById(ruleSetId);
    if (!ruleSet || !ruleSet.lastRanking) {
      return null;
    }
    return new RankingDtoOutput(plainToInstance(RankingDto, ruleSet.lastRanking));
  }

  private async getRuleSet(id: string): Promise<RuleSet> {
    const ruleSet = await this.repository.findById(id);
    if (!ruleSet) {
      throw new NotFoundException('RuleSet not found');
    }
    if (!ruleSet.form) {
      throw new BadRequestException('RuleSet has no form linked');
    }
    return ruleSet;
  }

  private async getSubmissions(users: string[], formId: Types.ObjectId): Promise<Submission[]> {
    return await this.submissionRepository.findByUsersId(users, formId);
  }
}
