import { MongooseModule } from '@nestjs/mongoose';
import ruleSetSchema, { RuleSet } from './rule-set.schema';
import { Module } from '@nestjs/common';
import { RuleSetController } from './rule-set.controller';
import { RuleSetRepository } from './rule-set.repository';
import { RuleSetSevice } from './rule-set.service';
import ruleSchema, { Rule } from '../rule/rule.schema';
import { RuleModule } from '../rule/rule.module';
import { SubmissionModule } from '../submission/submission.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RuleSet.name, schema: ruleSetSchema },
      { name: Rule.name, schema: ruleSchema },
    ]),
    RuleModule,
    SubmissionModule,
  ],
  providers: [RuleSetSevice, RuleSetRepository],
  controllers: [RuleSetController],
  exports: [RuleSetSevice, RuleSetRepository],
})
export class RuleSetModule {}
