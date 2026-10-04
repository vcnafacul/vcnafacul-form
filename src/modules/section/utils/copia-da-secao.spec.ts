import { Types } from 'mongoose';
import { copiarQuestoes, nomeDaCopia } from './copia-da-secao';

describe('nomeDaCopia (tickets-documentacao, 18)', () => {
  it('"<nome> (cópia)", numerando só se já existir', () => {
    expect(nomeDaCopia('Transporte', ['Transporte'])).toBe('Transporte (cópia)');
    expect(nomeDaCopia('Transporte', ['Transporte', 'Transporte (cópia)'])).toBe(
      'Transporte (cópia 2)',
    );
    expect(nomeDaCopia('Transporte', ['Transporte (cópia)', 'Transporte (cópia 2)'])).toBe(
      'Transporte (cópia 3)',
    );
  });
});

describe('copiarQuestoes (tickets-documentacao, 18)', () => {
  const sozinho = new Types.ObjectId();
  const quantas = new Types.ObjectId();
  const deOutraSecao = new Types.ObjectId().toString();
  const originais = [
    {
      _id: sozinho,
      text: 'Você mora sozinho?',
      answerType: 'Boolean',
      collection: 'Single',
      active: true,
    },
    {
      _id: quantas,
      text: 'Quantas pessoas moram com você?',
      helpText: undefined,
      answerType: 'Number',
      collection: 'Single',
      active: false,
      conditions: {
        logic: 'And',
        conditions: [
          { questionId: sozinho.toString(), operator: 'Equal', expectedValue: 'false' },
          { questionId: deOutraSecao, operator: 'Equal', expectedValue: 'Sim' },
        ],
      },
    },
  ];
  const copias = copiarQuestoes(originais);

  it('ids novos', () => {
    expect(String(copias[0]._id)).not.toBe(sozinho.toString());
    expect(String(copias[1]._id)).not.toBe(quantas.toString());
  });

  it('⚠️ sem helpText não vira "undefined"', () => {
    expect(copias[1].helpText).toBeUndefined();
    expect('helpText' in copias[1]).toBe(false);
  });

  it('⚠️ condição interna aponta para a cópia; de outra seção fica', () => {
    const [interna, externa] = copias[1].conditions!.conditions;
    expect(interna.questionId).toBe(String(copias[0]._id));
    expect(externa.questionId).toBe(deOutraSecao);
  });

  it('mantém se a questão estava ativa', () => {
    expect(copias.map((c) => c.active)).toEqual([true, false]);
  });
});
