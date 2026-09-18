import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { CategoriesService } from './categories.service.js';

@Controller('organizations/:organizationId/categories')
@UseGuards(OrganizationMembershipGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.categoriesService.findAll(organizationId);
  }
}
