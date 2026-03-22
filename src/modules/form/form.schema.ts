import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { Section } from '../section/section.schema';

@Schema({ timestamps: true, versionKey: false })
export class Form extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['GLOBAL', 'PARTNER'] })
  ownerType: string;

  @Prop({ type: String, default: null })
  ownerId: string | null;

  @Prop({
    type: [{ ref: 'Section', type: Types.ObjectId }],
    default: [],
  })
  sections: Section[];

  @Prop({ default: false })
  active: boolean;
}

export type FormDocument = HydratedDocument<Form>;

const FormSchema = SchemaFactory.createForClass(Form);
FormSchema.index({ name: 1, ownerType: 1, ownerId: 1 }, { unique: true });
export default FormSchema;
