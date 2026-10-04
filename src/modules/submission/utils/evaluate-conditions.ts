import { AnswerDto } from '../dto/create-submission.dto.input';
import { QuestionBase } from '../../form-full/schema/question-base.schema';
import { ComplexCondition } from '../../question/types/complex-condition';
import { BaseCondition } from '../../question/types/base-condition';
import { Operator } from '../../question/enum/operator';
import { Logic } from '../../question/enum/logic';

/**
 * Avalia se uma questão deve ser obrigatória baseado em suas condições
 */
export function shouldQuestionBeRequired(question: QuestionBase, answers: AnswerDto[]): boolean {
  // Se não tem condições, a questão é obrigatória
  if (!question.conditions) {
    return true;
  }

  return evaluateConditions(question.conditions, answers);
}

/**
 * Avalia um conjunto de condições complexas
 */
function evaluateConditions(conditions: ComplexCondition, answers: AnswerDto[]): boolean {
  if (!conditions.conditions || conditions.conditions.length === 0) {
    return true;
  }

  const results = conditions.conditions.map((condition) =>
    evaluateBaseCondition(condition, answers),
  );

  // Aplica a lógica de combinação (AND ou OR)
  return conditions.logic === Logic.And
    ? results.every((result) => result)
    : results.some((result) => result);
}

/**
 * Avalia uma condição base individual
 */
function evaluateBaseCondition(condition: BaseCondition, answers: AnswerDto[]): boolean {
  const answer = answers.find((a) => a.questionId === condition.questionId);

  // Sem resposta (ou resposta vazia), a condição não é atendida
  if (!answer || semResposta(answer.answer)) {
    return false;
  }

  return evaluateOperator(condition.operator, answer.answer, condition.expectedValue);
}

function semResposta(valor: unknown): boolean {
  return (
    valor === undefined ||
    valor === null ||
    valor === '' ||
    (Array.isArray(valor) && valor.length === 0)
  );
}

/**
 * Avalia um operador específico.
 *
 * ⚠️ O esperado chega sempre como texto (o modal grava assim), mas a resposta
 * pode ser número ou booleano. Igual/Diferente comparam os dois lados como
 * texto: antes `3 === "3"` dava falso e `3 !== "3"` verdadeiro — a tela
 * mostrava a questão e a submissão discordava (tickets-documentacao, card 19).
 * A tabela de testes é espelhada no client (`avaliarCondicao.test.ts`).
 */
export function evaluateOperator(
  operator: Operator,
  actualValue: any,
  expectedValue: string | number | boolean,
): boolean {
  switch (operator) {
    case Operator.Equal:
      return String(actualValue) === String(expectedValue);

    case Operator.NotEqual:
      return String(actualValue) !== String(expectedValue);

    case Operator.GreaterThan:
      return Number(actualValue) > Number(expectedValue);

    case Operator.GreaterThanOrEqual:
      return Number(actualValue) >= Number(expectedValue);

    case Operator.LessThan:
      return Number(actualValue) < Number(expectedValue);

    case Operator.LessThanOrEqual:
      return Number(actualValue) <= Number(expectedValue);

    case Operator.Contains:
      if (Array.isArray(actualValue)) {
        return actualValue.map(String).includes(String(expectedValue));
      }
      if (typeof actualValue === 'string') {
        return actualValue.includes(String(expectedValue));
      }
      return false;

    default:
      return false;
  }
}
