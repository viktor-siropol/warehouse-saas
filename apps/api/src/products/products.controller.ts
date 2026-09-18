import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { MembershipRole } from '../generated/prisma/client.js';

import { Roles } from '../auth/decorators/roles.decorator.js';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { RolesGuard } from '../auth/guards/roles.guard.js';

import { CreateProductDto } from './dto/create-product.dto.js';

import { ProductsService } from './products.service.js';

@Controller('organizations/:organizationId/products')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.productsService.findAll(organizationId);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
  create(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Body()
    dto: CreateProductDto,
  ) {
    return this.productsService.create(organizationId, dto);
  }
}
