import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { Rule } from '../rule/rule.schema';
import { FormFull } from '../form-full/schema/form-full.schema';

@Schema({ timestamps: true, versionKey: false })
export class RuleSet extends BaseSchema {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ ref: FormFull.name, type: Types.ObjectId })
  form: FormFull;

  @Prop({
    type: [{ ref: 'Rule', type: Types.ObjectId }],
    default: [],
  })
  scoringRules: Rule[];

  @Prop({
    type: [{ ref: 'Rule', type: Types.ObjectId }],
    default: [],
  })
  tieBreakerRules: Rule[];
}

export type RuleSetDocument = HydratedDocument<RuleSet>;
export default SchemaFactory.createForClass(RuleSet);
