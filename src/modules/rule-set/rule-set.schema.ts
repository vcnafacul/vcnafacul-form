import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { HydratedDocument, Types } from 'mongoose';
import { Rule } from '../rule/rule.schema';
import { Form } from '../form/form.schema';

@Schema({ timestamps: true, versionKey: false })
export class RuleSet extends BaseSchema {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ ref: Form.name, type: Types.ObjectId })
  form: Form;

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
