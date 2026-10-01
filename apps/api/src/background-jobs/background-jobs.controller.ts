import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator.js';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { RolesGuard } from '../auth/guards/roles.guard.js';

import { MembershipRole } from '../generated/prisma/client.js';

import { BackgroundJobsService } from './background-jobs.service.js';

import { OutboxJobQueryDto } from './dto/outbox-job-query.dto.js';

@Controller('organizations/:organizationId/background-jobs')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
@Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
export class BackgroundJobsController {
  constructor(private readonly backgroundJobsService: BackgroundJobsService) {}

  @Get('outbox')
  findOutboxJobs(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Query()
    query: OutboxJobQueryDto,
  ) {
    return this.backgroundJobsService.findOutboxJobs(organizationId, query);
  }

  @Get('outbox/:eventId')
  findOne(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('eventId', ParseUUIDPipe)
    eventId: string,
  ) {
    return this.backgroundJobsService.findOne(organizationId, eventId);
  }
}
