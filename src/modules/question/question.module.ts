import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import questionSchema, { Question } from '../question/question.schema';
import { SectionModule } from '../section/section.module';
import sectionSchema, { Section } from '../section/section.schema';
import { QuestionController } from './question.controller';
import { QuestionRepository } from './question.repository';
import { QuestionSevice } from './question.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Section.name, schema: sectionSchema },
      { name: Question.name, schema: questionSchema },
    ]),
    SectionModule,
  ],
  providers: [QuestionSevice, QuestionRepository],
  controllers: [QuestionController],
  exports: [QuestionSevice, QuestionRepository],
})
export class QuestionModule {}
