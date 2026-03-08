import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

// Mock schemas para evitar decorators do Mongoose
jest.mock('./rule.schema', () => ({
  Rule: class Rule {},
}));
jest.mock('../question/question.schema', () => ({
  Question: class Question {},
}));

import { RuleService } from './rule.service';

describe('RuleService', () => {
  let service: RuleService;
  let ruleRepo: any;
  let questionRepo: any;

  const mockQuestion = {
    _id: new Types.ObjectId(),
    text: 'Qual sua renda?',
    options: ['Até 1 SM', '1-3 SM', '3-5 SM'],
  };

  const mockRule = {
    _id: new Types.ObjectId(),
    name: 'Regra Renda',
    description: 'Pontuação por renda',
    type: 'Score',
    strategy: 'PerOption',
    question: mockQuestion,
    config: { points: { 'Até 1 SM': 10, '1-3 SM': 7, '3-5 SM': 3 } },
    weight: 1,
    active: true,
  };

  beforeEach(() => {
    ruleRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn(),
      delete: jest.fn(),
    };
    questionRepo = {
      findById: jest.fn(),
    };
    service = new RuleService(ruleRepo, questionRepo);
  });

  describe('create', () => {
    it('deve criar uma regra com sucesso', async () => {
      questionRepo.findById.mockResolvedValue(mockQuestion);
      ruleRepo.create.mockResolvedValue(mockRule);

      const result = await service.create({
        name: 'Regra Renda',
        description: 'Pontuação por renda',
        type: 'Score' as any,
        strategy: 'PerOption' as any,
        questionId: mockQuestion._id.toString(),
        config: { points: { 'Até 1 SM': 10, '1-3 SM': 7, '3-5 SM': 3 } },
        weight: 1,
      });

      expect(result).toBe(mockRule);
      expect(questionRepo.findById).toHaveBeenCalledWith(mockQuestion._id.toString());
      expect(ruleRepo.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando question não existe', async () => {
      questionRepo.findById.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Test',
          description: 'Test',
          type: 'Score' as any,
          strategy: 'PerOption' as any,
          questionId: new Types.ObjectId().toString(),
          config: { points: {} },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('deve retornar uma regra existente', async () => {
      ruleRepo.findById.mockResolvedValue(mockRule);
      const result = await service.findById(mockRule._id.toString());
      expect(result).toBe(mockRule);
    });

    it('deve retornar null para regra inexistente', async () => {
      ruleRepo.findById.mockResolvedValue(null);
      const result = await service.findById(new Types.ObjectId().toString());
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar campos da regra', async () => {
      const existingRule = { ...mockRule };
      ruleRepo.findById.mockResolvedValue(existingRule);
      ruleRepo.updateOne.mockResolvedValue(undefined);

      const result = await service.update(existingRule._id.toString(), {
        name: 'Novo Nome',
        description: 'Nova descrição',
      } as any);

      expect(result.name).toBe('Novo Nome');
      expect(result.description).toBe('Nova descrição');
      expect(ruleRepo.updateOne).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando regra não existe', async () => {
      ruleRepo.findById.mockResolvedValue(null);

      await expect(
        service.update(new Types.ObjectId().toString(), { name: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve atualizar question quando questionId é informado', async () => {
      const newQuestion = { _id: new Types.ObjectId(), text: 'Nova pergunta', options: ['A'] };
      const existingRule = { ...mockRule, question: mockQuestion };
      ruleRepo.findById.mockResolvedValue(existingRule);
      questionRepo.findById.mockResolvedValue(newQuestion);
      ruleRepo.updateOne.mockResolvedValue(undefined);

      const result = await service.update(existingRule._id.toString(), {
        questionId: newQuestion._id.toString(),
      } as any);

      expect(result.question).toBe(newQuestion);
    });
  });

  describe('delete', () => {
    it('deve deletar uma regra', async () => {
      ruleRepo.delete.mockResolvedValue(undefined);
      await service.delete(mockRule._id.toString());
      expect(ruleRepo.delete).toHaveBeenCalledWith(mockRule._id.toString());
    });
  });
});
