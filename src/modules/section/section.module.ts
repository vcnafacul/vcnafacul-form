import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionRepository } from '../question/question.repository';
import questionSchema, { Question } from '../question/question.schema';
import { SectionController } from './section.controller';
import { SectionRepository } from './section.repository';
import sectionSchema, { Section } from './section.schema';
import { SectionSevice } from './section.service';
import { FormRepository } from '../form/form.repository';
import formSchema, { Form } from '../form/form.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Section.name, schema: sectionSchema },
      { name: Question.name, schema: questionSchema },
      { name: Form.name, schema: formSchema },
    ]),
  ],
  providers: [SectionSevice, SectionRepository, QuestionRepository, FormRepository],
  controllers: [SectionController],
  exports: [SectionSevice, SectionRepository],
})
export class SectionModule {}
