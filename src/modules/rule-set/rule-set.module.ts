import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleModule } from '../rule/rule.module';
import ruleSchema, { Rule } from '../rule/rule.schema';
import { SubmissionModule } from '../submission/submission.module';
import { RuleSetController } from './rule-set.controller';
import { RuleSetRepository } from './rule-set.repository';
import ruleSetSchema, { RuleSet } from './rule-set.schema';
import { RuleSetSevice } from './rule-set.service';

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
