import { RankingDto } from '../dto/ranking.dto.output';
import { Rank } from '../value-object/rank';

export function convertRankToDto(ranks: Rank[]): RankingDto[] {
  // 1. Ordena por score decrescente
  const sorted = [...ranks].sort((a, b) => b.totalScore - a.totalScore);

  const result: RankingDto[] = [];
  let lastScore: number | null = null;
  let lastRank = 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    // Se for o primeiro ou se a pontuação mudou, atualiza o rank para posição real
    if (lastScore === null || current.totalScore !== lastScore) {
      lastRank = i + 1;
      lastScore = current.totalScore;
    }

    result.push({
      rank: lastRank,
      userId: current.userId,
      totalScore: current.totalScore,
    });
  }

  return result;
}
