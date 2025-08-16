import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Question } from 'src/modules/question/question.schema';
import { RuleType } from './enum/rule-type';
import { Strategy } from './enum/strategy';

@Schema({ timestamps: true, versionKey: false })
export class Rule extends BaseSchema {
  @Prop({ require: true })
  name: string;

  @Prop({ require: true })
  description: string;

  @Prop({ enum: RuleType, require: true })
  type: RuleType;

  @Prop({ enum: Strategy, require: true })
  strategy: Strategy;

  @Prop({ ref: 'Question', type: Types.ObjectId })
  question: Question;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  config: Record<string, any>;

  @Prop({ default: 1 })
  weight?: number;

  @Prop({ default: true })
  active: boolean;
}

export type uleDocument = HydratedDocument<Rule>;
export default SchemaFactory.createForClass(Rule);
