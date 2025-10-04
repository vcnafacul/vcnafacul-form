import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { Section } from '../section/section.schema';

@Schema({ timestamps: true, versionKey: false })
export class Form extends BaseSchema {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({
    type: [{ ref: 'Section', type: Types.ObjectId }],
    default: [],
  })
  sections: Section[];

  @Prop({ default: false })
  active: boolean;
}

export type FormDocument = HydratedDocument<Form>;
export default SchemaFactory.createForClass(Form);
