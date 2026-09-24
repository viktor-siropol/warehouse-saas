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

import { CreateCustomerDto } from './dto/create-customer.dto.js';

import { UpdateCustomerDto } from './dto/update-customer.dto.js';

import { CustomersService } from './customers.service.js';

@Controller('organizations/:organizationId/customers')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.customersService.findAll(organizationId);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  create(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Body()
    dto: CreateCustomerDto,
  ) {
    return this.customersService.create(organizationId, dto);
  }

  @Patch(':customerId')
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  update(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('customerId', ParseUUIDPipe)
    customerId: string,

    @Body()
    dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(organizationId, customerId, dto);
  }
}
