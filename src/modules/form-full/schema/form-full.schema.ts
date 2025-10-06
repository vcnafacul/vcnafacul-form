import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { SectionBase } from './section-base.schema';

@Schema({ timestamps: true, versionKey: false })
export class FormFull extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  inscriptionId: string;

  @Prop({ type: [SectionBase], default: [] })
  sections: SectionBase[];
}

export type FormFullDocument = HydratedDocument<FormFull>;
export default SchemaFactory.createForClass(FormFull);
