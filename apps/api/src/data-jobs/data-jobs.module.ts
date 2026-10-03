import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { PrismaModule } from '../prisma/prisma.module.js';

import { DataJobProcessorService } from './data-job-processor.service.js';

import { DataJobsController } from './data-jobs.controller.js';

import { DataJobsService } from './data-jobs.service.js';

import { DataJobsWorkerService } from './data-jobs-worker.service.js';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [DataJobsController],

  providers: [DataJobsService, DataJobProcessorService, DataJobsWorkerService],
})
export class DataJobsModule {}
