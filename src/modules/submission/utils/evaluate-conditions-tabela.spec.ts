import { shouldQuestionBeRequired } from './evaluate-conditions';
import { AnswerDto } from '../dto/create-submission.dto.input';
import { QuestionBase } from '../../form-full/schema/question-base.schema';
import { Operator } from '../../question/enum/operator';
import { Logic } from '../../question/enum/logic';
import { AnswerType } from '../../question/enum/answer-type';
import { AnswerCollectionType } from '../../question/enum/answer-collection-type';
import { Types } from 'mongoose';

/**
 * ⚠️ Tabela espelhada em `client-vcnafacul/src/pages/partnerPrepInscription/
 * avaliarCondicao.test.ts`: a tela (questão aparece) e a submissão (questão
 * obrigatória) têm de dar o mesmo resultado (tickets-documentacao, card 19).
 * [operador, esperado (sempre texto), resposta, resultado]
 */
const TABELA: [Operator, string, unknown, boolean][] = [
  // Texto
  [Operator.Equal, 'Sim', 'Sim', true],
  [Operator.Equal, 'Sim', 'Não', false],
  [Operator.NotEqual, 'Sim', 'Não', true],
  [Operator.NotEqual, 'Sim', 'Sim', false],
  // Número (resposta number, esperado string)
  [Operator.Equal, '3', 3, true],
  [Operator.NotEqual, '0', 0, false],
  [Operator.NotEqual, '0', 2, true],
  [Operator.GreaterThan, '2', 3, true],
  [Operator.LessThanOrEqual, '2', 3, false],
  // Sim/Não (resposta boolean, esperado "true"/"false")
  [Operator.Equal, 'false', false, true],
  [Operator.NotEqual, 'false', false, false],
  [Operator.NotEqual, 'false', true, true],
  // Opções (várias)
  [Operator.Contains, 'Ônibus', ['Ônibus', 'Metrô'], true],
  [Operator.Contains, 'Bicicleta', ['Ônibus'], false],
  // Sem resposta: nenhuma condição é atendida
  [Operator.NotEqual, 'Não', undefined, false],
  [Operator.NotEqual, 'Não', '', false],
  [Operator.Equal, 'Sim', null, false],
  [Operator.Contains, 'Ônibus', [], false],
];

describe('condição: tabela compartilhada com o client (card 19)', () => {
  const anterior = new Types.ObjectId().toString();

  it.each(TABELA)('%s %p com resposta %p → %p', (operator, expectedValue, resposta, resultado) => {
    const question = {
      _id: new Types.ObjectId(),
      text: 'Condicionada',
      answerType: AnswerType.Text,
      collection: AnswerCollectionType.Single,
      createdAt: new Date(),
      conditions: {
        logic: Logic.And,
        conditions: [{ questionId: anterior, operator, expectedValue }],
      },
    } as unknown as QuestionBase;
    const answers = (
      resposta === undefined ? [] : [{ questionId: anterior, answer: resposta }]
    ) as AnswerDto[];
    expect(shouldQuestionBeRequired(question, answers)).toBe(resultado);
  });
});
