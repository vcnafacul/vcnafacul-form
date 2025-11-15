import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { FormFull } from '../form-full/schema/form-full.schema';

@Schema({ timestamps: true, versionKey: false })
export class Submission extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'FormFull', required: true })
  form: FormFull;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  studentId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  birthday: Date;

  @Prop({
    type: [
      {
        questionId: { type: Types.ObjectId, ref: 'Question', required: true },
        // value pode ser string|number|boolean|string[] dependendo do tipo
        answer: { type: SchemaTypes.Mixed, required: true },
        question: { type: String, required: true },
      },
    ],
    default: [],
  })
  answers: Array<{ questionId: Types.ObjectId; value: any }>;
}

export type SubmissionDocument = HydratedDocument<Submission>;
export default SchemaFactory.createForClass(Submission);
