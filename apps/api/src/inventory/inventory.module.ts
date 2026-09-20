import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { PrismaModule } from '../prisma/prisma.module.js';

import { InventoryController } from './inventory.controller.js';

import { InventorySettingsService } from './inventory-settings.service.js';

import { InventoryService } from './inventory.service.js';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [InventoryController],

  providers: [InventoryService, InventorySettingsService],
})
export class InventoryModule {}
