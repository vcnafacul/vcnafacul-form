// resolve-all-ties.ts
import { Types } from 'mongoose';
import { Submission } from 'src/modules/submission/submission.schema';
import { RuleSet } from '../rule-set.schema';
import { Rank } from '../value-object/rank';
import { applyScoreRule } from './apply-score-rule';

/**
 * Resolve todos os empates do ranking aplicando as tieBreakerRules (lexicográfico).
 * - Preserva totalScore original (não soma pontos de desempate).
 * - Para cada grupo com o mesmo rank, reordena pelos critérios e
 *   reatribui ranks sequenciais a partir do rank-base do grupo.
 */
export function resolveTie(
  ranking: Rank[],
  ruleSet: RuleSet,
  subs: Map<string, Submission>,
): Rank[] {
  if (!Array.isArray(ranking) || ranking.length === 0) return [];
  const tieRules = ruleSet?.tieBreakerRules ?? [];
  if (tieRules.length === 0) {
    // Sem regras de desempate: só retorna ordenado por rank asc (e score desc p/ estabilidade)
    return [...ranking].sort(
      (a, b) => a.rank - b.rank || b.totalScore - a.totalScore || a.userId.localeCompare(b.userId),
    );
  }

  // 1) Ordena por rank asc (entre ranks diferentes a ordem não muda),
  //    e por totalScore desc / userId asc como fallback determinístico.
  const byRank = [...ranking].sort(
    (a, b) => a.rank - b.rank || b.totalScore - a.totalScore || a.userId.localeCompare(b.userId),
  );

  const out: Rank[] = [];
  let i = 0;

  while (i < byRank.length) {
    const baseRank = byRank[i].rank;
    const group: Rank[] = [];

    // 2) Coleta o grupo com o mesmo rank base (empate atual)
    while (i < byRank.length && byRank[i].rank === baseRank) {
      group.push(byRank[i]);
      i++;
    }

    if (group.length <= 1) {
      // Sem empate neste grupo
      out.push(group[0]);
      continue;
    }

    // 3) Calcula a "chave de desempate" (vetor de pontos por regra) por usuário
    const tieKeys = new Map<string, number[]>();
    for (const item of group) {
      const sub = subs.get(item.userId)!;
      const answersByQ = new Map<string, any>(
        sub.answers.map((a: { questionId: Types.ObjectId; value: any }) => [
          a.questionId.toString(),
          a.value,
        ]),
      );

      const key: number[] = tieRules.map((rule: any) => {
        // Suporta rule.question._id (ou rule.question direto, se for ObjectId)
        const qId = String(rule.question._id); // vazio -> applyScoreRule lida como quiser
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const value = answersByQ.get(qId);
        // maior pontuação = melhor no critério
        return applyScoreRule(rule, value);
      });

      tieKeys.set(item.userId, key);
    }

    // 4) Ordena o grupo por chave lexicográfica desc; fallback determinístico por userId
    const sortedGroup = [...group].sort((a, b) => {
      const ka = tieKeys.get(a.userId) ?? [];
      const kb = tieKeys.get(b.userId) ?? [];
      const len = Math.max(ka.length, kb.length);
      for (let j = 0; j < len; j++) {
        const va = ka[j] ?? 0;
        const vb = kb[j] ?? 0;
        if (vb !== va) return vb - va; // desc
      }
      return a.userId.localeCompare(b.userId);
    });

    // 5) Reatribui ranks sequenciais (baseRank, baseRank+1, ...) mantendo totalScore original
    for (let j = 0; j < sortedGroup.length; j++) {
      const { userId, totalScore } = sortedGroup[j];
      out.push({ rank: baseRank + j, userId, totalScore });
    }
  }

  return out;
}

export function resolveAllTies(
  tieroups: Rank[][],
  rank: Rank[],
  ruleSet: RuleSet,
  subs: Map<string, Submission>,
): Rank[] {
  let updated = structuredClone(rank);
  for (const group of tieroups) {
    const tieBraekerRank = resolveTie(group, ruleSet, subs);
    updated = updated.map((r) => {
      const rankUser = tieBraekerRank.find((t) => t.userId === r.userId)!;
      if (rankUser !== undefined && r.userId === rankUser.userId) {
        return rankUser;
      }
      return r;
    });
  }
  return updated.sort((a, b) => a.rank - b.rank);
}
