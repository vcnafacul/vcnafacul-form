import { MongooseModule } from '@nestjs/mongoose';
import questionSchema, { Question } from '../question/question.schema';
import { Module } from '@nestjs/common';

import submissionSchema, { Submission } from './submission.schema';
import formSchema, { Form } from '../form/form.schema';
import { SubmissionRepository } from './submission.repository';
import { SubmissionSevice } from './submission.service';
import { SubmissionController } from './submission.controller';
import { FormRepository } from '../form/form.repository';

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
