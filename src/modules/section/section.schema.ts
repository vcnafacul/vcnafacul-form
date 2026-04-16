import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { Question } from '../question/question.schema';

@Schema({ timestamps: true, versionKey: false })
export class Section extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({
    type: [{ ref: 'Question', type: Types.ObjectId }],
    default: [],
  })
  questions: Question[];

  @Prop({ default: true })
  active: boolean;

  static createCopy(section: Section): Section {
    return {
      ...section,
      _id: new Types.ObjectId(),
      name: `${section.name}_${new Date().getTime()}`,
      description: section.description,
      questions: [],
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export type SectionDocument = HydratedDocument<Section>;
export default SchemaFactory.createForClass(Section);
