import { convertUserPointToRank } from './convert-user-point-to-rank';

describe('convertUserPointToRank', () => {
  it('deve ordenar por pontuação decrescente e atribuir ranks', () => {
    const result = convertUserPointToRank([
      { userId: 'A', totalScore: 50 },
      { userId: 'B', totalScore: 80 },
      { userId: 'C', totalScore: 30 },
    ]);

    expect(result).toEqual([
      { rank: 1, userId: 'B', totalScore: 80 },
      { rank: 2, userId: 'A', totalScore: 50 },
      { rank: 3, userId: 'C', totalScore: 30 },
    ]);
  });

  it('deve atribuir mesmo rank para empates', () => {
    const result = convertUserPointToRank([
      { userId: 'A', totalScore: 70 },
      { userId: 'B', totalScore: 70 },
      { userId: 'C', totalScore: 50 },
    ]);

    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1);
    expect(result[2].rank).toBe(3);
  });

  it('deve lidar com lista vazia', () => {
    expect(convertUserPointToRank([])).toEqual([]);
  });

  it('deve lidar com um único usuário', () => {
    const result = convertUserPointToRank([{ userId: 'A', totalScore: 100 }]);
    expect(result).toEqual([{ rank: 1, userId: 'A', totalScore: 100 }]);
  });

  it('deve atribuir ranks corretamente com múltiplos empates', () => {
    const result = convertUserPointToRank([
      { userId: 'A', totalScore: 90 },
      { userId: 'B', totalScore: 90 },
      { userId: 'C', totalScore: 90 },
      { userId: 'D', totalScore: 50 },
    ]);

    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1);
    expect(result[2].rank).toBe(1);
    expect(result[3].rank).toBe(4);
  });
});
