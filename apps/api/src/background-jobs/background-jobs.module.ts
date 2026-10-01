import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { PrismaModule } from '../prisma/prisma.module.js';

import { BackgroundJobsController } from './background-jobs.controller.js';

import { BackgroundJobsService } from './background-jobs.service.js';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [BackgroundJobsController],

  providers: [BackgroundJobsService],
})
export class BackgroundJobsModule {}
