import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import chalk from 'chalk';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { MongoExceptionFilter } from './common/exception/mongo-exception.filter';
import { document } from './config/swagger.config';

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
