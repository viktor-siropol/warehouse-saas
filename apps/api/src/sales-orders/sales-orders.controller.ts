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

import { AddSalesOrderItemDto } from './dto/add-sales-order-item.dto.js';

import { CreateSalesOrderDto } from './dto/create-sales-order.dto.js';

import { FulfillSalesOrderDto } from './dto/fulfill-sales-order.dto.js';

import { ReserveSalesOrderDto } from './dto/reserve-sales-order.dto.js';

import { SalesOrdersService } from './sales-orders.service.js';

@Controller('organizations/:organizationId/sales-orders')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.salesOrdersService.findAll(organizationId);
  }

  @Get(':salesOrderId')
  findOne(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('salesOrderId', ParseUUIDPipe)
    salesOrderId: string,
  ) {
    return this.salesOrdersService.findOne(organizationId, salesOrderId);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  create(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateSalesOrderDto,
  ) {
    return this.salesOrdersService.create(organizationId, user.id, dto);
  }

  @Post(':salesOrderId/items')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  addItem(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('salesOrderId', ParseUUIDPipe)
    salesOrderId: string,

    @Body()
    dto: AddSalesOrderItemDto,
  ) {
    return this.salesOrdersService.addItem(organizationId, salesOrderId, dto);
  }

  @Delete(':salesOrderId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  async removeItem(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('salesOrderId', ParseUUIDPipe)
    salesOrderId: string,

    @Param('itemId', ParseUUIDPipe)
    itemId: string,
  ): Promise<void> {
    await this.salesOrdersService.removeItem(
      organizationId,
      salesOrderId,
      itemId,
    );
  }

  @Post(':salesOrderId/confirm')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  confirm(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('salesOrderId', ParseUUIDPipe)
    salesOrderId: string,
  ) {
    return this.salesOrdersService.confirm(organizationId, salesOrderId);
  }

  @Post(':salesOrderId/reservations')
  @Roles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.MANAGER,
    MembershipRole.WORKER,
  )
  reserve(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('salesOrderId', ParseUUIDPipe)
    salesOrderId: string,

    @Body()
    dto: ReserveSalesOrderDto,
  ) {
    return this.salesOrdersService.reserve(organizationId, salesOrderId, dto);
  }

  @Post(':salesOrderId/fulfillments')
  @Roles(
    MembershipRole.OWNER,
    MembershipRole.ADMIN,
    MembershipRole.MANAGER,
    MembershipRole.WORKER,
  )
  fulfill(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('salesOrderId', ParseUUIDPipe)
    salesOrderId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: FulfillSalesOrderDto,
  ) {
    return this.salesOrdersService.fulfill(
      organizationId,
      salesOrderId,
      user.id,
      dto,
    );
  }

  @Post(':salesOrderId/cancel')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  cancel(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('salesOrderId', ParseUUIDPipe)
    salesOrderId: string,
  ) {
    return this.salesOrdersService.cancel(organizationId, salesOrderId);
  }
}
