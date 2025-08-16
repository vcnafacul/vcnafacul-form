import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ruleSchema, { Rule } from './rule.schema';
import { RuleSevice } from './rule.service';
import { RuleRepository } from './rule.repository';
import { RuleController } from './rule.controller';
import { QuestionModule } from '../question/question.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rule.name, schema: ruleSchema }]),
    QuestionModule,
  ],
  providers: [RuleSevice, RuleRepository],
  controllers: [RuleController],
  exports: [RuleSevice, RuleRepository],
})
export class RuleModule {}
