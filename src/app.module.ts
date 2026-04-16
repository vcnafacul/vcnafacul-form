import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { envSchema } from './common/modules/env/env';
import { EnvModule } from './common/modules/env/env.module';
import { MongoModule } from './common/modules/mongo.module';
import { OwnerContextInterceptor } from './common/interceptors/owner-context.interceptor';
import { FormModule } from './modules/form/form.module';
import { QuestionModule } from './modules/question/question.module';
import { RuleSetModule } from './modules/rule-set/rule-set.module';
import { RuleModule } from './modules/rule/rule.module';
import { SectionModule } from './modules/section/section.module';
import { SubmissionModule } from './modules/submission/submission.module';

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
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: OwnerContextInterceptor,
    },
  ],
})
export class AppModule {}
