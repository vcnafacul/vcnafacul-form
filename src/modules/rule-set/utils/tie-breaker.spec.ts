import { Types } from 'mongoose';
import { Rank } from '../value-object/rank';
import { resolveTie, resolveAllTies } from './tie-breaker';

function makeQuestion(id?: Types.ObjectId) {
  return { _id: id ?? new Types.ObjectId() };
}

function makeRule(questionId: Types.ObjectId, config: Record<string, any>) {
  return {
    _id: new Types.ObjectId(),
    strategy: 'PerOption',
    config,
    question: makeQuestion(questionId),
  } as any;
}

function makeSubmission(userId: string, answers: { questionId: Types.ObjectId; answer: any }[]) {
  return {
    userId,
    answers: answers.map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
      question: 'test',
    })),
  } as any;
}

function makeRuleSet(tieBreakerRules: any[]) {
  return { scoringRules: [], tieBreakerRules } as any;
}

describe('resolveTie', () => {
  it('deve retornar array vazio para ranking vazio', () => {
    const ruleSet = makeRuleSet([]);
    expect(resolveTie([], ruleSet, new Map())).toEqual([]);
  });

  it('deve retornar ordenado por rank quando não há tieBreakerRules', () => {
    const ruleSet = makeRuleSet([]);
    const ranking: Rank[] = [
      { rank: 1, userId: 'B', totalScore: 100 },
      { rank: 1, userId: 'A', totalScore: 100 },
    ];
    const result = resolveTie(ranking, ruleSet, new Map());
    expect(result[0].userId).toBe('A');
    expect(result[1].userId).toBe('B');
  });

  it('deve desempatar usando tieBreakerRules', () => {
    const qId = new Types.ObjectId();
    const tbRule = makeRule(qId, { points: { Sim: 10, Não: 0 } });
    const ruleSet = makeRuleSet([tbRule]);

    const subs = new Map();
    subs.set('A', makeSubmission('A', [{ questionId: qId, answer: 'Não' }]));
    subs.set('B', makeSubmission('B', [{ questionId: qId, answer: 'Sim' }]));

    const ranking: Rank[] = [
      { rank: 1, userId: 'A', totalScore: 80 },
      { rank: 1, userId: 'B', totalScore: 80 },
    ];

    const result = resolveTie(ranking, ruleSet, subs);
    expect(result[0]).toEqual({ rank: 1, userId: 'B', totalScore: 80 });
    expect(result[1]).toEqual({ rank: 2, userId: 'A', totalScore: 80 });
  });

  it('não deve alterar grupo sem empate', () => {
    const qId = new Types.ObjectId();
    const tbRule = makeRule(qId, { points: { A: 5 } });
    const ruleSet = makeRuleSet([tbRule]);
    const subs = new Map();
    subs.set('A', makeSubmission('A', [{ questionId: qId, answer: 'A' }]));

    const ranking: Rank[] = [{ rank: 1, userId: 'A', totalScore: 100 }];
    const result = resolveTie(ranking, ruleSet, subs);
    expect(result).toEqual([{ rank: 1, userId: 'A', totalScore: 100 }]);
  });
});

describe('resolveAllTies', () => {
  it('deve resolver múltiplos grupos de empate', () => {
    const qId = new Types.ObjectId();
    const tbRule = makeRule(qId, { points: { Alto: 10, Médio: 5, Baixo: 0 } });
    const ruleSet = makeRuleSet([tbRule]);

    const subs = new Map();
    subs.set('A', makeSubmission('A', [{ questionId: qId, answer: 'Baixo' }]));
    subs.set('B', makeSubmission('B', [{ questionId: qId, answer: 'Alto' }]));
    subs.set('C', makeSubmission('C', [{ questionId: qId, answer: 'Médio' }]));
    subs.set('D', makeSubmission('D', [{ questionId: qId, answer: 'Alto' }]));

    const rank: Rank[] = [
      { rank: 1, userId: 'A', totalScore: 90 },
      { rank: 1, userId: 'B', totalScore: 90 },
      { rank: 3, userId: 'C', totalScore: 50 },
      { rank: 3, userId: 'D', totalScore: 50 },
    ];

    const tieGroups = [
      [rank[0], rank[1]],
      [rank[2], rank[3]],
    ];

    const result = resolveAllTies(tieGroups, rank, ruleSet, subs);

    expect(result[0].userId).toBe('B');
    expect(result[0].rank).toBe(1);
    expect(result[1].userId).toBe('A');
    expect(result[1].rank).toBe(2);
    expect(result[2].userId).toBe('D');
    expect(result[2].rank).toBe(3);
    expect(result[3].userId).toBe('C');
    expect(result[3].rank).toBe(4);
  });

  it('deve preservar totalScore original após desempate', () => {
    const qId = new Types.ObjectId();
    const tbRule = makeRule(qId, { points: { X: 100 } });
    const ruleSet = makeRuleSet([tbRule]);

    const subs = new Map();
    subs.set('A', makeSubmission('A', [{ questionId: qId, answer: 'X' }]));
    subs.set('B', makeSubmission('B', [{ questionId: qId, answer: 'Y' }]));

    const rank: Rank[] = [
      { rank: 1, userId: 'A', totalScore: 75 },
      { rank: 1, userId: 'B', totalScore: 75 },
    ];

    const result = resolveAllTies([[rank[0], rank[1]]], rank, ruleSet, subs);
    expect(result[0].totalScore).toBe(75);
    expect(result[1].totalScore).toBe(75);
  });
});
