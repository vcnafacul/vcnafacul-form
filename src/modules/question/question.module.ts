import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import questionSchema, { Question } from '../question/question.schema';
import { SectionModule } from '../section/section.module';
import sectionSchema, { Section } from '../section/section.schema';
import formSchema, { Form } from '../form/form.schema';
import { QuestionController } from './question.controller';
import { QuestionRepository } from './question.repository';
import { QuestionSevice } from './question.service';
import { FormRepository } from '../form/form.repository';
import { EnvModule } from 'src/common/modules/env/env.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Section.name, schema: sectionSchema },
      { name: Question.name, schema: questionSchema },
      { name: Form.name, schema: formSchema },
    ]),
    SectionModule,
    EnvModule,
  ],
  providers: [QuestionSevice, QuestionRepository, FormRepository],
  controllers: [QuestionController],
  exports: [QuestionSevice, QuestionRepository],
})
export class QuestionModule {}
