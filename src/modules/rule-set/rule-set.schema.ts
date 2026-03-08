import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { Rule } from '../rule/rule.schema';
import { FormFull } from '../form-full/schema/form-full.schema';

export class RankingEntry {
  rank: number;
  userId: string;
  totalScore: number;
}

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

  @Prop({ type: [{ rank: Number, userId: String, totalScore: Number }], default: null })
  lastRanking: RankingEntry[] | null;

  @Prop({ type: Date, default: null })
  lastRankingAt: Date | null;
}

export type RuleSetDocument = HydratedDocument<RuleSet>;
export default SchemaFactory.createForClass(RuleSet);
