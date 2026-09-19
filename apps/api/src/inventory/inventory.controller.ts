import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
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

import { ReceiptStockDto } from './dto/receipt-stock.dto.js';

import { TransferStockDto } from './dto/transfer-stock.dto.js';

import { InventoryService } from './inventory.service.js';

@Controller('organizations/:organizationId')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

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
