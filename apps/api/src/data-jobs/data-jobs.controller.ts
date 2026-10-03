import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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

import { DataJobsService } from './data-jobs.service.js';

import { CreateProductImportJobDto } from './dto/create-product-import-job.dto.js';

import { DataJobQueryDto } from './dto/data-job-query.dto.js';

@Controller('organizations/:organizationId/data-jobs')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
@Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
export class DataJobsController {
  constructor(private readonly dataJobsService: DataJobsService) {}

  @Get('products/import-template')
  getProductImportTemplate() {
    return this.dataJobsService.getProductImportTemplate();
  }

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Query()
    query: DataJobQueryDto,
  ) {
    return this.dataJobsService.findAll(organizationId, query);
  }

  @Get(':jobId')
  findOne(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('jobId', ParseUUIDPipe)
    jobId: string,
  ) {
    return this.dataJobsService.findOne(organizationId, jobId);
  }

  @Post('products/import')
  createProductImport(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: CreateProductImportJobDto,
  ) {
    return this.dataJobsService.createProductImport(
      organizationId,
      user.id,
      dto,
    );
  }

  @Post('products/export')
  createProductExport(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.dataJobsService.createProductExport(organizationId, user.id);
  }
}
