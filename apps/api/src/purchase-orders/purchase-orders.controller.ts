import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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

import { AddPurchaseOrderItemDto } from './dto/add-purchase-order-item.dto.js';

import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';

import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto.js';

import { PurchaseOrdersService } from './purchase-orders.service.js';

@Controller('organizations/:organizationId/purchase-orders')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.purchaseOrdersService.findAll(organizationId);
  }

  @Get(':purchaseOrderId')
  findOne(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('purchaseOrderId', ParseUUIDPipe)
    purchaseOrderId: string,
  ) {
    return this.purchaseOrdersService.findOne(organizationId, purchaseOrderId);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  create(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.create(organizationId, user.id, dto);
  }

  @Post(':purchaseOrderId/items')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  addItem(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('purchaseOrderId', ParseUUIDPipe)
    purchaseOrderId: string,

    @Body()
    dto: AddPurchaseOrderItemDto,
  ) {
    return this.purchaseOrdersService.addItem(
      organizationId,
      purchaseOrderId,
      dto,
    );
  }

  @Delete(':purchaseOrderId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  async removeItem(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('purchaseOrderId', ParseUUIDPipe)
    purchaseOrderId: string,

    @Param('itemId', ParseUUIDPipe)
    itemId: string,
  ): Promise<void> {
    await this.purchaseOrdersService.removeItem(
      organizationId,
      purchaseOrderId,
      itemId,
    );
  }

  @Post(':purchaseOrderId/submit')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  submit(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('purchaseOrderId', ParseUUIDPipe)
    purchaseOrderId: string,
  ) {
    return this.purchaseOrdersService.submit(organizationId, purchaseOrderId);
  }

  @Post(':purchaseOrderId/cancel')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  cancel(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('purchaseOrderId', ParseUUIDPipe)
    purchaseOrderId: string,
  ) {
    return this.purchaseOrdersService.cancel(organizationId, purchaseOrderId);
  }

  @Post(':purchaseOrderId/receipts')
  @Roles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.MANAGER,
    MembershipRole.WORKER,
  )
  receive(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('purchaseOrderId', ParseUUIDPipe)
    purchaseOrderId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: ReceivePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.receive(
      organizationId,
      purchaseOrderId,
      user.id,
      dto,
    );
  }
}
