import 'dotenv/config';

import { Logger } from '@nestjs/common';

import { createWarehouseApplication } from './bootstrap.js';

async function bootstrap(): Promise<void> {
  const { app, runtime } = await createWarehouseApplication({
    enableShutdownHooks: true,
  });

  await app.listen(runtime.port);

  const logger = new Logger('Bootstrap');

  logger.log({
    event: 'application_started',

    service: 'warehouse-api',

    nodeEnv: runtime.nodeEnv,

    port: runtime.port,

    logFormat: runtime.logFormat,
  });
}

void bootstrap();
