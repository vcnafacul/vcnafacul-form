import { Prop } from '@nestjs/mongoose';
import { AnswerCollectionType } from '../../question/enum/answer-collection-type';
import { AnswerType } from '../../question/enum/answer-type';
import { Question } from '../../question/question.schema';
import { Types } from 'mongoose';

export class QuestionBase {
  @Prop()
  _id: Types.ObjectId;

  @Prop()
  text: string; // Enunciado da pergunta

  @Prop()
  helpText?: string; // Texto auxiliar

  @Prop({ enum: AnswerType, required: true })
  answerType: AnswerType;

  @Prop({ enum: AnswerCollectionType, default: AnswerCollectionType.Single })
  collection: AnswerCollectionType;

  @Prop({
    type: [String],
    default: [],
    validate: {
      validator: function (this: Question, value: string[]) {
        if (this.answerType === AnswerType.Options) {
          return Array.isArray(value) && value.length > 0;
        }
        return true;
      },
      message: 'Options é obrigatório quando AnswerType for Options',
    },
  })
  options?: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt?: Date;
}
