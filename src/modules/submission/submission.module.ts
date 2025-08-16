import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import questionSchema, { Question } from '../question/question.schema';

import { FormRepository } from '../form/form.repository';
import formSchema, { Form } from '../form/form.schema';
import { SubmissionController } from './submission.controller';
import { SubmissionRepository } from './submission.repository';
import submissionSchema, { Submission } from './submission.schema';
import { SubmissionSevice } from './submission.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: submissionSchema },
      { name: Form.name, schema: formSchema },
      { name: Question.name, schema: questionSchema },
    ]),
  ],
  providers: [SubmissionSevice, SubmissionRepository, FormRepository],
  controllers: [SubmissionController],
  exports: [SubmissionSevice, SubmissionRepository],
})
export class SubmissionModule {}
