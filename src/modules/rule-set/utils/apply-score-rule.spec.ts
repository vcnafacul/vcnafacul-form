import { applyScoreRule } from './apply-score-rule';

// Usamos objetos simples em vez de importar os schemas (decorators do Mongoose)
const Strategy = { PerOption: 'PerOption', NumericRange: 'NumericRange' } as const;

function makeRule(strategy: string, config: Record<string, any>) {
  return { strategy, config } as any;
}

describe('applyScoreRule', () => {
  describe('quando value é null ou undefined', () => {
    it('deve retornar 0 para null', () => {
      const rule = makeRule(Strategy.PerOption, { points: { A: 10 } });
      expect(applyScoreRule(rule, null)).toBe(0);
    });

    it('deve retornar 0 para undefined', () => {
      const rule = makeRule(Strategy.PerOption, { points: { A: 10 } });
      expect(applyScoreRule(rule, undefined)).toBe(0);
    });
  });

  describe('Strategy.PerOption', () => {
    it('deve retornar pontos para uma opção existente', () => {
      const rule = makeRule(Strategy.PerOption, { points: { Sim: 10, Não: 0 } });
      expect(applyScoreRule(rule, 'Sim')).toBe(10);
      expect(applyScoreRule(rule, 'Não')).toBe(0);
    });

    it('deve retornar 0 para opção não mapeada', () => {
      const rule = makeRule(Strategy.PerOption, { points: { A: 5, B: 10 } });
      expect(applyScoreRule(rule, 'C')).toBe(0);
    });

    it('deve retornar 0 quando config.points é undefined', () => {
      const rule = makeRule(Strategy.PerOption, {});
      expect(applyScoreRule(rule, 'A')).toBe(0);
    });

    it('deve converter value para string antes de buscar', () => {
      const rule = makeRule(Strategy.PerOption, { points: { '123': 7 } });
      expect(applyScoreRule(rule, 123)).toBe(7);
    });
  });

  describe('Strategy.NumericRange', () => {
    const ranges = [
      { min: 0, max: 1000, points: 10 },
      { min: 1001, max: 3000, points: 7 },
      { min: 3001, max: null, points: 3 },
    ];

    it('deve retornar pontos da faixa correta', () => {
      const rule = makeRule(Strategy.NumericRange, { ranges });
      expect(applyScoreRule(rule, 500)).toBe(10);
      expect(applyScoreRule(rule, 2000)).toBe(7);
      expect(applyScoreRule(rule, 5000)).toBe(3);
    });

    it('deve retornar 0 quando valor não cai em nenhuma faixa', () => {
      const rule = makeRule(Strategy.NumericRange, {
        ranges: [{ min: 10, max: 20, points: 5 }],
      });
      expect(applyScoreRule(rule, 5)).toBe(0);
    });

    it('deve aceitar min null como -infinito', () => {
      const rule = makeRule(Strategy.NumericRange, {
        ranges: [{ min: null, max: 100, points: 15 }],
      });
      expect(applyScoreRule(rule, -999)).toBe(15);
      expect(applyScoreRule(rule, 100)).toBe(15);
    });

    it('deve aceitar max null como +infinito', () => {
      const rule = makeRule(Strategy.NumericRange, {
        ranges: [{ min: 100, max: null, points: 20 }],
      });
      expect(applyScoreRule(rule, 100)).toBe(20);
      expect(applyScoreRule(rule, 999999)).toBe(20);
    });

    it('deve retornar 0 quando value não é numérico', () => {
      const rule = makeRule(Strategy.NumericRange, { ranges });
      expect(applyScoreRule(rule, 'abc')).toBe(0);
    });

    it('deve retornar 0 quando config.ranges é undefined', () => {
      const rule = makeRule(Strategy.NumericRange, {});
      expect(applyScoreRule(rule, 100)).toBe(0);
    });

    it('deve aceitar string numérica como value', () => {
      const rule = makeRule(Strategy.NumericRange, { ranges });
      expect(applyScoreRule(rule, '500')).toBe(10);
    });
  });

  describe('strategy desconhecida', () => {
    it('deve retornar 0', () => {
      const rule = makeRule('Unknown', {});
      expect(applyScoreRule(rule, 'qualquer')).toBe(0);
    });
  });
});
