import { Prop } from '@nestjs/mongoose';
import { Logic } from '../enum/logic';
import { BaseCondition } from './base-condition';

export class ComplexCondition {
  @Prop({ required: true })
  conditions: BaseCondition[];

  @Prop({ required: true })
  logic: Logic;
}
