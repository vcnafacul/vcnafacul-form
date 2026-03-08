import { getGroupRankingTie } from './get-group-ranking-tie';

describe('getGroupRankingTie', () => {
  it('deve retornar array vazio quando não há empates', () => {
    const rank = [
      { rank: 1, userId: 'A', totalScore: 100 },
      { rank: 2, userId: 'B', totalScore: 80 },
      { rank: 3, userId: 'C', totalScore: 60 },
    ];
    expect(getGroupRankingTie(rank)).toEqual([]);
  });

  it('deve agrupar empates por totalScore', () => {
    const rank = [
      { rank: 1, userId: 'A', totalScore: 100 },
      { rank: 1, userId: 'B', totalScore: 100 },
      { rank: 3, userId: 'C', totalScore: 60 },
    ];
    const result = getGroupRankingTie(rank);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
    expect(result[0].map((r) => r.userId)).toEqual(['A', 'B']);
  });

  it('deve retornar múltiplos grupos de empate', () => {
    const rank = [
      { rank: 1, userId: 'A', totalScore: 100 },
      { rank: 1, userId: 'B', totalScore: 100 },
      { rank: 3, userId: 'C', totalScore: 80 },
      { rank: 3, userId: 'D', totalScore: 80 },
    ];
    const result = getGroupRankingTie(rank);
    expect(result).toHaveLength(2);
  });

  it('deve lidar com lista vazia', () => {
    expect(getGroupRankingTie([])).toEqual([]);
  });

  it('deve lidar com todos empatados', () => {
    const rank = [
      { rank: 1, userId: 'A', totalScore: 50 },
      { rank: 1, userId: 'B', totalScore: 50 },
      { rank: 1, userId: 'C', totalScore: 50 },
    ];
    const result = getGroupRankingTie(rank);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(3);
  });
});
