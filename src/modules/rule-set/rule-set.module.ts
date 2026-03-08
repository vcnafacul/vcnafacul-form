import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RuleModule } from '../rule/rule.module';
import ruleSchema, { Rule } from '../rule/rule.schema';
import { FormFullModule } from '../form-full/form-full.module';
import { SubmissionModule } from '../submission/submission.module';
import { RuleSetController } from './rule-set.controller';
import { RuleSetRepository } from './rule-set.repository';
import ruleSetSchema, { RuleSet } from './rule-set.schema';
import { RuleSetService } from './rule-set.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RuleSet.name, schema: ruleSetSchema },
      { name: Rule.name, schema: ruleSchema },
    ]),
    RuleModule,
    FormFullModule,
    SubmissionModule,
  ],
  providers: [RuleSetService, RuleSetRepository],
  controllers: [RuleSetController],
  exports: [RuleSetService, RuleSetRepository],
})
export class RuleSetModule {}
