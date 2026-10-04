import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQuestionDtoInput } from './create-question.dto.input';
import { UpdateQuestionDtoInput } from './update-question.dto.input';
import { AnswerType } from '../enum/answer-type';
import { AnswerCollectionType } from '../enum/answer-collection-type';

/** As mensagens de validação chegam ao toast da tela (tickets-documentacao, 26). */
async function mensagens(cls: any, dados: object): Promise<string[]> {
  const erros = await validate(plainToInstance(cls, dados));
  const saida: string[] = [];
  const junta = (lista: typeof erros) =>
    lista.forEach((e) => {
      saida.push(...Object.values(e.constraints ?? {}));
      junta(e.children ?? []);
    });
  junta(erros);
  return saida;
}

describe('mensagens de validação da questão em português (card 26)', () => {
  const base = {
    text: 'Como você vai?',
    answerType: AnswerType.Options,
    collection: AnswerCollectionType.Single,
  };

  it.each([CreateQuestionDtoInput, UpdateQuestionDtoInput])('%p: opções repetidas', async (cls) => {
    expect(await mensagens(cls, { ...base, options: ['Sim', 'Sim'] })).toContain(
      'As opções não podem se repetir',
    );
  });

  it('tipo de resposta e condição inválidos', async () => {
    const m = await mensagens(CreateQuestionDtoInput, {
      ...base,
      answerType: 'Xyz',
      options: ['A', 'B'],
      conditions: {
        logic: 'Talvez',
        conditions: [{ questionId: 'q', operator: 'Parecido', expectedValue: 'x' }],
      },
    });
    expect(m).toEqual(
      expect.arrayContaining([
        'Tipo de resposta inválido',
        'Lógica das condições inválida (E/OU)',
        'Operador da condição inválido',
      ]),
    );
  });
});
