import { ordemDasQuestoes } from './ordem-das-questoes';

const secao = [
  { id: 'a', active: true },
  { id: 'b', active: false },
  { id: 'c', active: true },
  { id: 'd', active: false },
];

describe('ordemDasQuestoes (tickets-documentacao, 21)', () => {
  it('lista completa: usa a ordem recebida', () => {
    expect(ordemDasQuestoes(secao, ['d', 'c', 'b', 'a'])).toEqual({
      ids: ['d', 'c', 'b', 'a'],
    });
  });

  it('⚠️ só as ativas: inativas vão para o fim, na ordem atual', () => {
    expect(ordemDasQuestoes(secao, ['c', 'a'])).toEqual({
      ids: ['c', 'a', 'b', 'd'],
    });
  });

  it('faltando uma ativa: recusa', () => {
    expect(ordemDasQuestoes(secao, ['a'])).toEqual({ faltando: ['c'] });
  });

  it('questão de outra seção: recusa', () => {
    expect(ordemDasQuestoes(secao, ['a', 'c', 'x'])).toEqual({
      foraDaSecao: ['x'],
    });
  });
});
