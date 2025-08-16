import { Module } from '@nestjs/common';
import { MongoModule } from './common/modules/mongo.module';
import { ConfigModule } from '@nestjs/config';
import { EnvModule } from './common/modules/env/env.module';
import { envSchema } from './common/modules/env/env';
import { FormModule } from './modules/form/form.module';
import { SectionModule } from './modules/section/section.module';
import { QuestionModule } from './modules/question/question.module';
import { SubmissionModule } from './modules/submission/submission.module';
import { RuleModule } from './modules/rule/rule.module';
import { RuleSetModule } from './modules/rule-set/rule-set.module';

@Module({
  imports: [
    MongoModule,
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    EnvModule,
    FormModule,
    SectionModule,
    QuestionModule,
    SubmissionModule,
    RuleModule,
    RuleSetModule,
  ],
})
export class AppModule {}
