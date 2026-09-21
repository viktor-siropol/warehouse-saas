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

import { CreateSupplierDto } from './dto/create-supplier.dto.js';

import { UpdateSupplierDto } from './dto/update-supplier.dto.js';

import { SuppliersService } from './suppliers.service.js';

@Controller('organizations/:organizationId/suppliers')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.suppliersService.findAll(organizationId);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  create(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Body()
    dto: CreateSupplierDto,
  ) {
    return this.suppliersService.create(organizationId, dto);
  }

  @Patch(':supplierId')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  update(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('supplierId', ParseUUIDPipe)
    supplierId: string,

    @Body()
    dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(organizationId, supplierId, dto);
  }
}
