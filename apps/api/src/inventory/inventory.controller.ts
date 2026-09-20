import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

import { Roles } from '../auth/decorators/roles.decorator.js';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { RolesGuard } from '../auth/guards/roles.guard.js';

import type { AuthenticatedUser } from '../auth/types/auth.type.js';

import { MembershipRole } from '../generated/prisma/client.js';

import { AdjustStockDto } from './dto/adjust-stock.dto.js';

import { IssueStockDto } from './dto/issue-stock.dto.js';

import { LowStockQueryDto } from './dto/low-stock-query.dto.js';

import { ReceiptStockDto } from './dto/receipt-stock.dto.js';

import { SetReorderPointDto } from './dto/set-reorder-point.dto.js';

import { TransferStockDto } from './dto/transfer-stock.dto.js';

import { InventorySettingsService } from './inventory-settings.service.js';

import { InventoryService } from './inventory.service.js';

@Controller('organizations/:organizationId')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,

    private readonly inventorySettingsService: InventorySettingsService,
  ) {}

  @Get('warehouses/:warehouseId/inventory')
  findWarehouseInventory(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('warehouseId', ParseUUIDPipe)
    warehouseId: string,
  ) {
    return this.inventoryService.findWarehouseInventory(
      organizationId,
      warehouseId,
    );
  }

  @Get('inventory/low-stock')
  findLowStock(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Query()
    query: LowStockQueryDto,
  ) {
    return this.inventorySettingsService.findLowStock(organizationId, query);
  }

  @Patch('warehouses/:warehouseId/inventory/:productId/reorder-point')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  setReorderPoint(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('warehouseId', ParseUUIDPipe)
    warehouseId: string,

    @Param('productId', ParseUUIDPipe)
    productId: string,

    @Body()
    dto: SetReorderPointDto,
  ) {
    return this.inventorySettingsService.setReorderPoint(
      organizationId,
      warehouseId,
      productId,
      dto,
    );
  }

  @Post('warehouses/:warehouseId/inventory/receipts')
  @Roles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.MANAGER,
    MembershipRole.WORKER,
  )
  receiveStock(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('warehouseId', ParseUUIDPipe)
    warehouseId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: ReceiptStockDto,
  ) {
    return this.inventoryService.receiveStock(
      organizationId,
      warehouseId,
      user.id,
      dto,
    );
  }

  @Post('warehouses/:warehouseId/inventory/issues')
  @Roles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.MANAGER,
    MembershipRole.WORKER,
  )
  issueStock(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('warehouseId', ParseUUIDPipe)
    warehouseId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: IssueStockDto,
  ) {
    return this.inventoryService.issueStock(
      organizationId,
      warehouseId,
      user.id,
      dto,
    );
  }

  @Post('warehouses/:warehouseId/inventory/adjustments')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  adjustStock(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('warehouseId', ParseUUIDPipe)
    warehouseId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(
      organizationId,
      warehouseId,
      user.id,
      dto,
    );
  }

  @Post('inventory/transfers')
  @Roles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.MANAGER,
    MembershipRole.WORKER,
  )
  transferStock(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: TransferStockDto,
  ) {
    return this.inventoryService.transferStock(organizationId, user.id, dto);
  }
}
