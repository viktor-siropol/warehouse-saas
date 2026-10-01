import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';

import { OutboxEventProcessorService } from './outbox-event-processor.service.js';

import { OutboxWorkerService } from './outbox-worker.service.js';

@Module({
  imports: [PrismaModule],

  providers: [OutboxEventProcessorService, OutboxWorkerService],
})
export class OutboxModule {}
