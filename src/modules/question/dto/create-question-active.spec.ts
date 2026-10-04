import { ValidationPipe } from '@nestjs/common';
import { CreateQuestionDtoInput } from './create-question.dto.input';
import { AnswerType } from '../enum/answer-type';
import { AnswerCollectionType } from '../enum/answer-collection-type';

/** O mesmo pipe do `main.ts`: o `whitelist` descarta o que não está no DTO. */
const pipe = new ValidationPipe({ whitelist: true, transform: true });
const corpo = {
  sectionId: 's1',
  text: 'Nova',
  answerType: AnswerType.Text,
  collection: AnswerCollectionType.Single,
};

describe('criar questão: a chave Questão Ativa chega ao service (card 24)', () => {
  it('⚠️ active: false sobrevive ao whitelist', async () => {
    const dto = (await pipe.transform(
      { ...corpo, active: false },
      { type: 'body', metatype: CreateQuestionDtoInput },
    )) as CreateQuestionDtoInput;
    expect(dto.active).toBe(false);
  });

  it('valor que não é booleano é recusado', async () => {
    await expect(
      pipe.transform(
        { ...corpo, active: 'talvez' },
        { type: 'body', metatype: CreateQuestionDtoInput },
      ),
    ).rejects.toBeDefined();
  });
});
