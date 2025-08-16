import { MongooseModule } from '@nestjs/mongoose';
import questionSchema, { Question } from '../question/question.schema';
import { Module } from '@nestjs/common';
import sectionSchema, { Section } from '../section/section.schema';
import { QuestionSevice } from './question.service';
import { QuestionRepository } from './question.repository';
import { QuestionController } from './question.controller';
import { SectionModule } from '../section/section.module';

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
