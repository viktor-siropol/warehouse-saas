import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { PrismaModule } from '../prisma/prisma.module.js';

import { StockMovementsController } from './stock-movements.controller.js';

import { StockMovementsService } from './stock-movements.service.js';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [StockMovementsController],

  providers: [StockMovementsService],
})
export class StockMovementsModule {}
