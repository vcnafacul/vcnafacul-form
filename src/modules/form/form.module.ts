import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import formSchema, { Form } from './form.schema';
import { FormSevice } from './form.service';
import { FormRepository } from './form.repository';
import { FormController } from './form.controller';
import sectionSchema, { Section } from '../section/section.schema';
import questionSchema, { Question } from '../question/question.schema';
import { SectionModule } from '../section/section.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Form.name, schema: formSchema },
      { name: Section.name, schema: sectionSchema },
      { name: Question.name, schema: questionSchema },
    ]),
    SectionModule,
  ],
  providers: [FormSevice, FormRepository],
  controllers: [FormController],
  exports: [FormSevice, FormRepository],
})
export class FormModule {}
