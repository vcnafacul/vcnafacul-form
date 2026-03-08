/**
 * Teste de integração do fluxo completo de ranking:
 * 1. Cria perguntas (mockadas)
 * 2. Cria regras de pontuação e desempate
 * 3. Cria respostas de estudantes (submissions)
 * 4. Aplica o ranqueamento
 * 5. Valida se o resultado ficou como esperado
 */
import { Types } from 'mongoose';
import { getRankingByPoint } from './get-ranking-by-point';
import { getGroupRankingTie } from './get-group-ranking-tie';
import { resolveAllTies } from './tie-breaker';

// Usamos objetos simples para evitar decorators do Mongoose
function makeQuestion(id?: Types.ObjectId) {
  return { _id: id ?? new Types.ObjectId() };
}

function makeRule(
  question: any,
  type: string,
  strategy: string,
  config: Record<string, any>,
) {
  return {
    _id: new Types.ObjectId(),
    name: `rule-${type}-${strategy}`,
    description: 'test rule',
    type,
    strategy,
    config,
    question,
    active: true,
    weight: 1,
  } as any;
}

function makeSubmission(
  userId: string,
  answers: { questionId: Types.ObjectId; answer: any }[],
) {
  return {
    _id: new Types.ObjectId(),
    userId,
    studentId: userId,
    answers: answers.map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
      question: 'pergunta',
    })),
  } as any;
}

function makeRuleSet(scoringRules: any[], tieBreakerRules: any[] = []) {
  return {
    _id: new Types.ObjectId(),
    name: 'test-ruleset',
    scoringRules,
    tieBreakerRules,
  } as any;
}

describe('Fluxo completo de ranking', () => {
  /**
   * Cenário 1: Ranking simples com PerOption
   *
   * Pergunta: "Qual sua renda familiar?"
   * Opções: "Até 1 SM" (10pts), "1-3 SM" (7pts), "3-5 SM" (3pts), "Acima de 5 SM" (0pts)
   */
  it('deve ranquear corretamente com uma regra PerOption', () => {
    const qRenda = makeQuestion();
    const ruleRenda = makeRule(qRenda, 'Score', 'PerOption', {
      points: { 'Até 1 SM': 10, '1-3 SM': 7, '3-5 SM': 3, 'Acima de 5 SM': 0 },
    });
    const ruleSet = makeRuleSet([ruleRenda]);

    const subs = new Map();
    subs.set('A', makeSubmission('A', [{ questionId: qRenda._id, answer: 'Até 1 SM' }]));
    subs.set('B', makeSubmission('B', [{ questionId: qRenda._id, answer: '3-5 SM' }]));
    subs.set('C', makeSubmission('C', [{ questionId: qRenda._id, answer: '1-3 SM' }]));

    const ranking = getRankingByPoint(subs, ruleSet, ['A', 'B', 'C']);

    expect(ranking).toEqual([
      { rank: 1, userId: 'A', totalScore: 10 },
      { rank: 2, userId: 'C', totalScore: 7 },
      { rank: 3, userId: 'B', totalScore: 3 },
    ]);
  });

  /**
   * Cenário 2: Ranking com NumericRange
   */
  it('deve ranquear corretamente com uma regra NumericRange', () => {
    const qDistancia = makeQuestion();
    const ruleDistancia = makeRule(qDistancia, 'Score', 'NumericRange', {
      ranges: [
        { min: 0, max: 5, points: 0 },
        { min: 5, max: 15, points: 5 },
        { min: 15, max: 30, points: 8 },
        { min: 30, max: null, points: 10 },
      ],
    });
    const ruleSet = makeRuleSet([ruleDistancia]);

    const subs = new Map();
    subs.set('A', makeSubmission('A', [{ questionId: qDistancia._id, answer: 3 }]));
    subs.set('B', makeSubmission('B', [{ questionId: qDistancia._id, answer: 25 }]));
    subs.set('C', makeSubmission('C', [{ questionId: qDistancia._id, answer: 50 }]));

    const ranking = getRankingByPoint(subs, ruleSet, ['A', 'B', 'C']);

    expect(ranking).toEqual([
      { rank: 1, userId: 'C', totalScore: 10 },
      { rank: 2, userId: 'B', totalScore: 8 },
      { rank: 3, userId: 'A', totalScore: 0 },
    ]);
  });

  /**
   * Cenário 3: Múltiplas regras de pontuação combinadas
   */
  it('deve somar pontos de múltiplas regras de pontuação', () => {
    const qRenda = makeQuestion();
    const qEscola = makeQuestion();

    const ruleRenda = makeRule(qRenda, 'Score', 'PerOption', {
      points: { 'Até 1 SM': 10, '1-3 SM': 7, '3-5 SM': 3 },
    });
    const ruleEscola = makeRule(qEscola, 'Score', 'PerOption', {
      points: { Pública: 10, Privada: 0 },
    });
    const ruleSet = makeRuleSet([ruleRenda, ruleEscola]);

    const subs = new Map();
    subs.set('A', makeSubmission('A', [
      { questionId: qRenda._id, answer: 'Até 1 SM' },
      { questionId: qEscola._id, answer: 'Pública' },
    ]));
    subs.set('B', makeSubmission('B', [
      { questionId: qRenda._id, answer: '1-3 SM' },
      { questionId: qEscola._id, answer: 'Pública' },
    ]));
    subs.set('C', makeSubmission('C', [
      { questionId: qRenda._id, answer: 'Até 1 SM' },
      { questionId: qEscola._id, answer: 'Privada' },
    ]));

    const ranking = getRankingByPoint(subs, ruleSet, ['A', 'B', 'C']);

    expect(ranking).toEqual([
      { rank: 1, userId: 'A', totalScore: 20 },
      { rank: 2, userId: 'B', totalScore: 17 },
      { rank: 3, userId: 'C', totalScore: 10 },
    ]);
  });

  /**
   * Cenário 4: Empate com desempate via TieBreaker
   */
  it('deve desempatar corretamente usando tieBreakerRules', () => {
    const qRenda = makeQuestion();
    const qEscola = makeQuestion();

    const ruleRenda = makeRule(qRenda, 'Score', 'PerOption', {
      points: { 'Até 1 SM': 10, '1-3 SM': 7 },
    });
    const tbEscola = makeRule(qEscola, 'TieBreaker', 'PerOption', {
      points: { Pública: 10, Privada: 0 },
    });
    const ruleSet = makeRuleSet([ruleRenda], [tbEscola]);

    const subs = new Map();
    subs.set('A', makeSubmission('A', [
      { questionId: qRenda._id, answer: 'Até 1 SM' },
      { questionId: qEscola._id, answer: 'Privada' },
    ]));
    subs.set('B', makeSubmission('B', [
      { questionId: qRenda._id, answer: 'Até 1 SM' },
      { questionId: qEscola._id, answer: 'Pública' },
    ]));
    subs.set('C', makeSubmission('C', [
      { questionId: qRenda._id, answer: '1-3 SM' },
      { questionId: qEscola._id, answer: 'Pública' },
    ]));

    // Passo 1: Ranking por pontos
    const ranking = getRankingByPoint(subs, ruleSet, ['A', 'B', 'C']);
    expect(ranking[0].totalScore).toBe(10);
    expect(ranking[1].totalScore).toBe(10);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[1].rank).toBe(1);
    expect(ranking[2].rank).toBe(3);

    // Passo 2: Identificar empates
    const ties = getGroupRankingTie(ranking);
    expect(ties).toHaveLength(1);
    expect(ties[0]).toHaveLength(2);

    // Passo 3: Resolver empates
    const finalRanking = resolveAllTies(ties, ranking, ruleSet, subs);

    expect(finalRanking).toEqual([
      { rank: 1, userId: 'B', totalScore: 10 },
      { rank: 2, userId: 'A', totalScore: 10 },
      { rank: 3, userId: 'C', totalScore: 7 },
    ]);
  });

  /**
   * Cenário 5: Combinação PerOption + NumericRange + TieBreaker
   */
  it('deve funcionar com cenário complexo combinando PerOption + NumericRange + TieBreaker', () => {
    const qRenda = makeQuestion();
    const qDistancia = makeQuestion();
    const qEscola = makeQuestion();

    const ruleRenda = makeRule(qRenda, 'Score', 'PerOption', {
      points: { 'Até 1 SM': 10, '1-3 SM': 7 },
    });
    const ruleDistancia = makeRule(qDistancia, 'Score', 'NumericRange', {
      ranges: [
        { min: 0, max: 10, points: 0 },
        { min: 10, max: 30, points: 5 },
        { min: 30, max: null, points: 10 },
      ],
    });
    const tbEscola = makeRule(qEscola, 'TieBreaker', 'PerOption', {
      points: { Pública: 10, Privada: 0 },
    });

    const ruleSet = makeRuleSet([ruleRenda, ruleDistancia], [tbEscola]);
    const users = ['A', 'B', 'C', 'D'];

    const subs = new Map();
    subs.set('A', makeSubmission('A', [
      { questionId: qRenda._id, answer: 'Até 1 SM' },
      { questionId: qDistancia._id, answer: 15 },
      { questionId: qEscola._id, answer: 'Pública' },
    ]));
    subs.set('B', makeSubmission('B', [
      { questionId: qRenda._id, answer: '1-3 SM' },
      { questionId: qDistancia._id, answer: 35 },
      { questionId: qEscola._id, answer: 'Privada' },
    ]));
    subs.set('C', makeSubmission('C', [
      { questionId: qRenda._id, answer: 'Até 1 SM' },
      { questionId: qDistancia._id, answer: 20 },
      { questionId: qEscola._id, answer: 'Privada' },
    ]));
    subs.set('D', makeSubmission('D', [
      { questionId: qRenda._id, answer: '1-3 SM' },
      { questionId: qDistancia._id, answer: 5 },
      { questionId: qEscola._id, answer: 'Pública' },
    ]));

    // Ranking por pontos
    const ranking = getRankingByPoint(subs, ruleSet, users);

    const byUser = new Map(ranking.map((r) => [r.userId, r]));
    expect(byUser.get('A')!.totalScore).toBe(15);
    expect(byUser.get('B')!.totalScore).toBe(17);
    expect(byUser.get('C')!.totalScore).toBe(15);
    expect(byUser.get('D')!.totalScore).toBe(7);

    expect(byUser.get('B')!.rank).toBe(1);
    expect(byUser.get('A')!.rank).toBe(2);
    expect(byUser.get('C')!.rank).toBe(2);
    expect(byUser.get('D')!.rank).toBe(4);

    // Desempatar
    const ties = getGroupRankingTie(ranking);
    expect(ties).toHaveLength(1);

    const finalRanking = resolveAllTies(ties, ranking, ruleSet, subs);

    expect(finalRanking).toEqual([
      { rank: 1, userId: 'B', totalScore: 17 },
      { rank: 2, userId: 'A', totalScore: 15 },
      { rank: 3, userId: 'C', totalScore: 15 },
      { rank: 4, userId: 'D', totalScore: 7 },
    ]);
  });

  /**
   * Cenário 6: Usuário sem submissão deve receber 0 pontos
   */
  it('deve atribuir 0 pontos para usuário sem submissão', () => {
    const qRenda = makeQuestion();
    const ruleRenda = makeRule(qRenda, 'Score', 'PerOption', {
      points: { 'Até 1 SM': 10 },
    });
    const ruleSet = makeRuleSet([ruleRenda]);

    const subs = new Map();
    subs.set('A', makeSubmission('A', [{ questionId: qRenda._id, answer: 'Até 1 SM' }]));

    const ranking = getRankingByPoint(subs, ruleSet, ['A', 'B']);

    expect(ranking).toEqual([
      { rank: 1, userId: 'A', totalScore: 10 },
      { rank: 2, userId: 'B', totalScore: 0 },
    ]);
  });
});
