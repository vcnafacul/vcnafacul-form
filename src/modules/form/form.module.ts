import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import questionSchema, { Question } from '../question/question.schema';
import { SectionModule } from '../section/section.module';
import sectionSchema, { Section } from '../section/section.schema';
import { FormController } from './form.controller';
import { FormRepository } from './form.repository';
import formSchema, { Form } from './form.schema';
import { FormSevice } from './form.service';
import { FormFullModule } from '../form-full/form-full.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Form.name, schema: formSchema },
      { name: Section.name, schema: sectionSchema },
      { name: Question.name, schema: questionSchema },
    ]),
    SectionModule,
    FormFullModule,
  ],
  providers: [FormSevice, FormRepository],
  controllers: [FormController],
  exports: [FormSevice, FormRepository],
})
export class FormModule {}
