import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { document } from './config/swagger.config';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';
import { MongoExceptionFilter } from './common/exception/mongo-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT;

  // Pipes globais para validação
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new MongoExceptionFilter());

  void useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Swagger
  SwaggerModule.setup('api', app, document(app));

  // Start da aplicação
  await app.listen(port ?? 3000);

  Logger.log(
    `🚀 ${chalk.blueBright(`API rodando em: http://localhost:${port}`)}`,
    `📃 ${chalk.redBright(`Swagger: http://localhost:${port}/api`)}`,
    'Bootstrap',
  );
}

void bootstrap();
