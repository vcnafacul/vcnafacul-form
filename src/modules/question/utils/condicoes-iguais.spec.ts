import { condicoesIguais } from './condicoes-iguais';

const c = (expectedValue: unknown, logic = 'And') => ({
  logic,
  conditions: [{ questionId: 'q1', operator: 'Equal', expectedValue }],
});

describe('condicoesIguais (card 23)', () => {
  it('iguais, mesmo com ObjectId x string', () => {
    expect(condicoesIguais(c('Sim'), c('Sim'))).toBe(true);
    expect(
      condicoesIguais(
        {
          logic: 'And',
          conditions: [
            { questionId: { toString: () => 'q1' }, operator: 'Equal', expectedValue: 'Sim' },
          ],
        },
        c('Sim'),
      ),
    ).toBe(true);
  });

  it('diferentes no valor, na lógica ou vindo do nada', () => {
    expect(condicoesIguais(c('Sim'), c('Não'))).toBe(false);
    expect(condicoesIguais(c('Sim'), c('Sim', 'Or'))).toBe(false);
    expect(condicoesIguais(undefined, c('Sim'))).toBe(false);
  });
});
