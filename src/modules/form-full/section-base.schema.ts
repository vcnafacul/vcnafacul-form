import { Prop } from '@nestjs/mongoose';
import { QuestionBase } from './question-base.schema';

export class SectionBase {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [QuestionBase], default: [] })
  questions: QuestionBase[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt?: Date;
}
