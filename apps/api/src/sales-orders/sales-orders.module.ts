import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { PrismaModule } from '../prisma/prisma.module.js';

import { SalesOrdersController } from './sales-orders.controller.js';

import { SalesOrdersService } from './sales-orders.service.js';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [SalesOrdersController],

  providers: [SalesOrdersService],
})
export class SalesOrdersModule {}
