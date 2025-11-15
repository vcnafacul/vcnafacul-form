import { BadRequestException } from '@nestjs/common';
import { AnswerCollectionType } from 'src/modules/question/enum/answer-collection-type';
import { AnswerType } from 'src/modules/question/enum/answer-type';
import { AnswerDto } from '../dto/create-submission.dto.input';
import { QuestionBase } from 'src/modules/form-full/schema/question-base.schema';

export function validateAndNormalizeValue(answer: AnswerDto, question: QuestionBase) {
  const type: AnswerType = question.answerType;
  const typeColl: AnswerCollectionType = question.collection;

  if (type === AnswerType.Text) {
    if (typeof answer.answer !== 'string') throw new BadRequestException('Esperado string');
    return;
  }

  if (type === AnswerType.Number) {
    const n = typeof answer.answer === 'number' ? answer.answer : Number(answer.answer);
    if (Number.isNaN(n)) throw new BadRequestException('Esperado number');
    return;
  }

  if (type === AnswerType.Boolean) {
    // aceita 'true'/'false'?
    if (typeof answer.answer === 'boolean') return;
    if (answer.answer === 'true') return;
    if (answer.answer === 'false') return;
    throw new BadRequestException('Esperado boolean');
  }

  // Multiple (escolhas)
  if (type === AnswerType.Options) {
    if (typeColl === AnswerCollectionType.Single) {
      if (typeof answer.answer !== 'string')
        throw new BadRequestException('Esperado string (Single)');
      if (!question.options!.includes(answer.answer))
        throw new BadRequestException('Opção inválida');
      return;
    }

    // Multiple selection
    if (!Array.isArray(answer.answer))
      throw new BadRequestException('Esperado array de strings (Multiple)');
    // todos devem existir
    for (const v of answer.answer) {
      if (typeof v !== 'string') throw new BadRequestException('Valores devem ser strings');
      if (!question.options!.includes(v)) throw new BadRequestException(`Opção inválida: ${v}`);
    }
    // normaliza removendo duplicados
    return;
  }
}
