import { Prop } from '@nestjs/mongoose';
import { Operator } from '../enum/operator';

export class BaseCondition {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  operator: Operator;

  @Prop({ required: true })
  expectedValue: string | number | boolean;
}
