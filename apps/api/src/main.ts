import 'dotenv/config';

import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';

import { NestFactory } from '@nestjs/core';

import type { NestExpressApplication } from '@nestjs/platform-express';

import helmet from 'helmet';

import { AppModule } from './app.module.js';

import { validateRuntimeEnvironment } from './config/runtime-env.js';

import { requestContextMiddleware } from './observability/request-context.middleware.js';

async function bootstrap(): Promise<void> {
  const runtime = validateRuntimeEnvironment(process.env);

  const jsonLogs = runtime.logFormat === 'json';

  const logger = new ConsoleLogger({
    json: jsonLogs,

    colors: !jsonLogs,

    compact: jsonLogs,

    logLevels:
      runtime.nodeEnv === 'production'
        ? ['log', 'warn', 'error', 'fatal']
        : ['log', 'warn', 'error', 'fatal', 'debug', 'verbose'],
  });

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,

    {
      logger,

      routeConflictPolicy: {
        duplicate: 'error',

        shadow: 'warn',
      },
    },
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.use(requestContextMiddleware);

  app.useBodyParser('json', {
    limit: '6mb',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,

      forbidNonWhitelisted: true,

      transform: true,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(runtime.port);

  const bootstrapLogger = new Logger('Bootstrap');

  bootstrapLogger.log({
    event: 'application_started',

    service: 'warehouse-api',

    nodeEnv: runtime.nodeEnv,

    port: runtime.port,

    logFormat: runtime.logFormat,
  });
}

void bootstrap();
