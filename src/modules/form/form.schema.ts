import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { HydratedDocument, Types } from 'mongoose';
import { Section } from '../section/section.schema';

@Schema({ timestamps: true, versionKey: false })
export class Form extends BaseSchema {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  inscriptionId: string;

  @Prop({
    type: [{ ref: 'Section', type: Types.ObjectId }],
    default: [],
  })
  sections: Section[];

  @Prop({ default: false })
  blocked: boolean;

  @Prop({ default: true })
  active: boolean;
}

export type FormDocument = HydratedDocument<Form>;
export default SchemaFactory.createForClass(Form);
