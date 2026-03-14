import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { Section } from '../section/section.schema';
import { OwnerType } from './enum/owner-type.enum';

@Schema({ timestamps: true, versionKey: false })
export class Form extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({
    type: [{ ref: 'Section', type: Types.ObjectId }],
    default: [],
  })
  sections: Section[];

  @Prop({ default: false })
  active: boolean;

  @Prop({ enum: OwnerType, required: true, default: OwnerType.GLOBAL })
  ownerType: OwnerType;

  @Prop({ type: String, default: null, index: true })
  ownerId: string | null;
}

export type FormDocument = HydratedDocument<Form>;

const formSchema = SchemaFactory.createForClass(Form);
formSchema.index({ ownerType: 1, ownerId: 1, active: 1 });
// Impede dois forms ativos para o mesmo partner (race condition safety)
formSchema.index(
  { ownerType: 1, ownerId: 1 },
  {
    unique: true,
    partialFilterExpression: { ownerId: { $ne: null }, active: true, deleted: false },
  },
);

export default formSchema;
