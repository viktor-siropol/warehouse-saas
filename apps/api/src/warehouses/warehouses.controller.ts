import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator.js';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { RolesGuard } from '../auth/guards/roles.guard.js';

import { MembershipRole } from '../generated/prisma/client.js';

import { CreateWarehouseDto } from './dto/create-warehouse.dto.js';

import { UpdateWarehouseDto } from './dto/update-warehouse.dto.js';

import { WarehousesService } from './warehouses.service.js';

@Controller('organizations/:organizationId/warehouses')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.warehousesService.findAll(organizationId);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  create(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Body()
    dto: CreateWarehouseDto,
  ) {
    return this.warehousesService.create(organizationId, dto);
  }

  @Patch(':warehouseId')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  update(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('warehouseId', ParseUUIDPipe)
    warehouseId: string,

    @Body()
    dto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(organizationId, warehouseId, dto);
  }
}
