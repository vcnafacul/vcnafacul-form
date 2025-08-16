import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { BaseSchema } from 'src/common/base/base.schema';
import { Form } from '../form/form.schema';

@Schema({ timestamps: true, versionKey: false })
export class Submission extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Form', required: true })
  form: Form;

  @Prop({ required: true })
  userId: string;

  @Prop({
    type: [
      {
        questionId: { type: Types.ObjectId, ref: 'Question', required: true },
        // value pode ser string|number|boolean|string[] dependendo do tipo
        value: { type: SchemaTypes.Mixed, required: true },
      },
    ],
    default: [],
  })
  answers: Array<{ questionId: Types.ObjectId; value: any }>;
}

export type SubmissionDocument = HydratedDocument<Submission>;
export default SchemaFactory.createForClass(Submission);
