import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { AnswerCollectionType } from './enum/answer-collection-type';
import { AnswerType } from './enum/answer-type';
import { ComplexCondition } from './types/complex-condition';

@Schema({ timestamps: true, versionKey: false })
export class Question extends BaseSchema {
  @Prop({ required: true })
  text: string; // Enunciado da pergunta

  @Prop()
  helpText?: string; // Texto auxiliar

  @Prop({ enum: AnswerType, required: true })
  answerType: AnswerType;

  @Prop({ enum: AnswerCollectionType, default: AnswerCollectionType.Single })
  collection: AnswerCollectionType;

  @Prop({ type: ComplexCondition, default: null })
  conditions?: ComplexCondition;

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

  @Prop({ default: true })
  active: boolean; // Se a questão está ativa no banco
}

export type QuestionDocument = HydratedDocument<Question>;
export default SchemaFactory.createForClass(Question);

//Exemplo
//
//text: "Qual é a sua renda mensal?",
//helpText: "Considerar salários, pensões e benefícios recebidos."
