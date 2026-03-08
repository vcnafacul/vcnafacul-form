import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

// Mock schemas para evitar decorators do Mongoose
jest.mock('../rule/rule.schema', () => ({ Rule: class Rule {} }));
jest.mock('../question/question.schema', () => ({ Question: class Question {} }));
jest.mock('./rule-set.schema', () => ({
  RuleSet: class RuleSet {},
  RankingEntry: class RankingEntry {},
}));
jest.mock('../form-full/schema/form-full.schema', () => ({ FormFull: class FormFull {} }));
jest.mock('../submission/submission.schema', () => ({ Submission: class Submission {} }));

import { RuleSetService } from './rule-set.service';
import { Action } from './dto/update-rule-set.dto.input';

function makeRule(type: string, questionId?: Types.ObjectId) {
  return {
    _id: new Types.ObjectId(),
    name: 'test-rule',
    type,
    strategy: 'PerOption',
    config: { points: { A: 10 } },
    question: { _id: questionId ?? new Types.ObjectId() },
    active: true,
  };
}

function makeRuleSet(overrides: any = {}) {
  return {
    _id: new Types.ObjectId(),
    name: 'test-ruleset',
    scoringRules: [],
    tieBreakerRules: [],
    lastRanking: null,
    lastRankingAt: null,
    ...overrides,
  };
}

describe('RuleSetService', () => {
  let service: RuleSetService;
  let ruleSetRepo: any;
  let ruleRepo: any;
  let formFullRepo: any;
  let submissionRepo: any;

  beforeEach(() => {
    ruleSetRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn(),
      delete: jest.fn(),
    };
    ruleRepo = { findById: jest.fn() };
    formFullRepo = { findOneBy: jest.fn() };
    submissionRepo = { findByUsersId: jest.fn() };
    service = new RuleSetService(ruleSetRepo, ruleRepo, formFullRepo, submissionRepo);
  });

  describe('create', () => {
    it('deve criar um RuleSet vinculado ao FormFull', async () => {
      const formFull = { _id: new Types.ObjectId(), inscriptionId: 'insc-1' };
      formFullRepo.findOneBy.mockResolvedValue(formFull);
      ruleSetRepo.create.mockImplementation(async (rs: any) => rs);

      const result = await service.create({ name: 'Meu RuleSet', inscriptionId: 'insc-1' } as any);

      expect(result.name).toBe('Meu RuleSet');
      expect(result.form).toBe(formFull);
    });

    it('deve lançar NotFoundException quando FormFull não existe', async () => {
      formFullRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Test', inscriptionId: 'non-existent' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addOrRemoveRule', () => {
    it('deve adicionar uma regra de pontuação ao conjunto', async () => {
      const rule = makeRule('Score');
      const ruleSet = makeRuleSet();
      ruleSetRepo.findById.mockResolvedValue(ruleSet);
      ruleRepo.findById.mockResolvedValue(rule);
      ruleSetRepo.updateOne.mockResolvedValue(undefined);

      const result = await service.addOrRemoveRule({
        ruleSetId: ruleSet._id.toString(),
        ruleId: rule._id.toString(),
        action: Action.Add,
      });

      expect(result.scoringRules).toHaveLength(1);
    });

    it('deve adicionar uma regra de desempate ao conjunto', async () => {
      const rule = makeRule('TieBreaker');
      const ruleSet = makeRuleSet();
      ruleSetRepo.findById.mockResolvedValue(ruleSet);
      ruleRepo.findById.mockResolvedValue(rule);
      ruleSetRepo.updateOne.mockResolvedValue(undefined);

      const result = await service.addOrRemoveRule({
        ruleSetId: ruleSet._id.toString(),
        ruleId: rule._id.toString(),
        action: Action.Add,
      });

      expect(result.tieBreakerRules).toHaveLength(1);
    });

    it('deve lançar BadRequestException quando regra já existe no conjunto', async () => {
      const rule = makeRule('Score');
      const ruleSet = makeRuleSet({ scoringRules: [rule] });
      ruleSetRepo.findById.mockResolvedValue(ruleSet);
      ruleRepo.findById.mockResolvedValue(rule);

      await expect(
        service.addOrRemoveRule({
          ruleSetId: ruleSet._id.toString(),
          ruleId: rule._id.toString(),
          action: Action.Add,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve remover uma regra do conjunto', async () => {
      const rule = makeRule('Score');
      const ruleSet = makeRuleSet({ scoringRules: [rule] });
      ruleSetRepo.findById.mockResolvedValue(ruleSet);
      ruleRepo.findById.mockResolvedValue(rule);
      ruleSetRepo.updateOne.mockResolvedValue(undefined);

      const result = await service.addOrRemoveRule({
        ruleSetId: ruleSet._id.toString(),
        ruleId: rule._id.toString(),
        action: Action.Remove,
      });

      expect(result.scoringRules).toHaveLength(0);
    });

    it('deve lançar NotFoundException quando RuleSet não existe', async () => {
      ruleSetRepo.findById.mockResolvedValue(null);

      await expect(
        service.addOrRemoveRule({
          ruleSetId: new Types.ObjectId().toString(),
          ruleId: new Types.ObjectId().toString(),
          action: Action.Add,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException quando Rule não existe', async () => {
      ruleSetRepo.findById.mockResolvedValue(makeRuleSet());
      ruleRepo.findById.mockResolvedValue(null);

      await expect(
        service.addOrRemoveRule({
          ruleSetId: new Types.ObjectId().toString(),
          ruleId: new Types.ObjectId().toString(),
          action: Action.Add,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('rankFormUsers', () => {
    it('deve calcular ranking e salvar lastRanking', async () => {
      const qId = new Types.ObjectId();
      const rule = makeRule('Score', qId);
      rule.config = { points: { A: 10, B: 5 } };
      const formId = new Types.ObjectId();
      const ruleSet = makeRuleSet({
        scoringRules: [rule],
        form: { _id: formId },
      });

      ruleSetRepo.findById.mockResolvedValue(ruleSet);
      submissionRepo.findByUsersId.mockResolvedValue([
        { userId: 'user1', answers: [{ questionId: qId, answer: 'A', question: 'test' }] },
        { userId: 'user2', answers: [{ questionId: qId, answer: 'B', question: 'test' }] },
      ]);
      ruleSetRepo.updateOne.mockResolvedValue(undefined);

      const result = await service.rankFormUsers({
        ruleSetId: ruleSet._id.toString(),
        users: ['user1', 'user2'],
      });

      expect(result.rankings).toHaveLength(2);
      expect(result.rankings[0].userId).toBe('user1');
      expect(result.rankings[0].totalScore).toBe(10);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].userId).toBe('user2');
      expect(result.rankings[1].totalScore).toBe(5);

      // Verificar que lastRanking foi salvo
      expect(ruleSet.lastRanking).not.toBeNull();
      expect(ruleSet.lastRankingAt).toBeInstanceOf(Date);
      expect(ruleSetRepo.updateOne).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando não há scoring rules', async () => {
      const ruleSet = makeRuleSet({ form: { _id: new Types.ObjectId() } });
      ruleSetRepo.findById.mockResolvedValue(ruleSet);

      await expect(
        service.rankFormUsers({ ruleSetId: ruleSet._id.toString(), users: ['user1'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException quando submissions não encontradas', async () => {
      const rule = makeRule('Score');
      const ruleSet = makeRuleSet({
        scoringRules: [rule],
        form: { _id: new Types.ObjectId() },
      });
      ruleSetRepo.findById.mockResolvedValue(ruleSet);
      submissionRepo.findByUsersId.mockResolvedValue([]);

      await expect(
        service.rankFormUsers({ ruleSetId: ruleSet._id.toString(), users: ['user1'] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLastRanking', () => {
    it('deve retornar último ranking salvo', async () => {
      const ruleSet = makeRuleSet({
        lastRanking: [
          { rank: 1, userId: 'user1', totalScore: 10 },
          { rank: 2, userId: 'user2', totalScore: 5 },
        ],
      });
      ruleSetRepo.findById.mockResolvedValue(ruleSet);

      const result = await service.getLastRanking(ruleSet._id.toString());
      expect(result).not.toBeNull();
      expect(result!.rankings).toHaveLength(2);
    });

    it('deve retornar null quando não há ranking salvo', async () => {
      ruleSetRepo.findById.mockResolvedValue(makeRuleSet());
      const result = await service.getLastRanking(new Types.ObjectId().toString());
      expect(result).toBeNull();
    });

    it('deve retornar null quando RuleSet não existe', async () => {
      ruleSetRepo.findById.mockResolvedValue(null);
      const result = await service.getLastRanking(new Types.ObjectId().toString());
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar o nome do RuleSet', async () => {
      const ruleSet = makeRuleSet();
      ruleSetRepo.findById.mockResolvedValue(ruleSet);
      ruleSetRepo.updateOne.mockResolvedValue(undefined);

      const result = await service.update(ruleSet._id.toString(), 'Novo Nome');
      expect(result.name).toBe('Novo Nome');
    });

    it('deve lançar NotFoundException quando RuleSet não existe', async () => {
      ruleSetRepo.findById.mockResolvedValue(null);
      await expect(
        service.update(new Types.ObjectId().toString(), 'Test'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deve deletar o RuleSet', async () => {
      ruleSetRepo.delete.mockResolvedValue(undefined);
      await service.delete(new Types.ObjectId().toString());
      expect(ruleSetRepo.delete).toHaveBeenCalled();
    });
  });
});
