import { MongooseModule } from '@nestjs/mongoose';
import questionSchema, { Question } from '../question/question.schema';
import sectionSchema, { Section } from './section.schema';
import { SectionRepository } from './section.repository';
import { SectionSevice } from './section.service';
import { SectionController } from './section.controller';
import { Module } from '@nestjs/common';
import { QuestionRepository } from '../question/question.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Section.name, schema: sectionSchema },
      { name: Question.name, schema: questionSchema },
    ]),
  ],
  providers: [SectionSevice, SectionRepository, QuestionRepository],
  controllers: [SectionController],
  exports: [SectionSevice, SectionRepository],
})
export class SectionModule {}
