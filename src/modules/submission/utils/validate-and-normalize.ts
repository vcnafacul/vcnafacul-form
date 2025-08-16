import { Question } from 'src/modules/question/question.schema';
import { AnswerDto } from '../dto/create-submission.dto.input';
import { AnswerType } from 'src/modules/question/enum/answer-type';
import { AnswerCollectionType } from 'src/modules/question/enum/answer-collection-type';
import { BadRequestException } from '@nestjs/common';

export function validateAndNormalizeValue(
  answer: AnswerDto,
  question: Question,
) {
  const type: AnswerType = question.answerType;
  const typeColl: AnswerCollectionType = question.collection;

  if (type === AnswerType.Text) {
    if (typeof answer.value !== 'string')
      throw new BadRequestException('Esperado string');
    return;
  }

  if (type === AnswerType.Number) {
    const n =
      typeof answer.value === 'number' ? answer.value : Number(answer.value);
    if (Number.isNaN(n)) throw new BadRequestException('Esperado number');
    return;
  }

  if (type === AnswerType.Boolean) {
    // aceita 'true'/'false'?
    if (typeof answer.value === 'boolean') return;
    if (answer.value === 'true') return;
    if (answer.value === 'false') return;
    throw new BadRequestException('Esperado boolean');
  }

  // Multiple (escolhas)
  if (type === AnswerType.Options) {
    if (typeColl === AnswerCollectionType.Single) {
      if (typeof answer.value !== 'string')
        throw new BadRequestException('Esperado string (Single)');
      if (!question.options!.includes(answer.value))
        throw new BadRequestException('Opção inválida');
      return;
    }

    // Multiple selection
    if (!Array.isArray(answer.value))
      throw new BadRequestException('Esperado array de strings (Multiple)');
    // todos devem existir
    for (const v of answer.value) {
      if (typeof v !== 'string')
        throw new BadRequestException('Valores devem ser strings');
      if (!question.options!.includes(v))
        throw new BadRequestException(`Opção inválida: ${v}`);
    }
    // normaliza removendo duplicados
    return;
  }
}
