import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { PrismaModule } from '../prisma/prisma.module.js';

import { OperationsController } from './operations.controller.js';

import { OperationsService } from './operations.service.js';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [OperationsController],

  providers: [OperationsService],
})
export class OperationsModule {}
