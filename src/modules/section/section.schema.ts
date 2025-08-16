import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { HydratedDocument, Types } from 'mongoose';
import { Question } from '../question/question.schema';

@Schema({ timestamps: true, versionKey: false })
export class Section extends BaseSchema {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({
    type: [{ ref: 'Question', type: Types.ObjectId }],
    default: [],
  })
  questions: Question[];

  @Prop({ default: true })
  active: boolean;
}

export type SectionDocument = HydratedDocument<Section>;
export default SchemaFactory.createForClass(Section);
