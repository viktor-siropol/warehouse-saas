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

import { AuditService } from './audit.service.js';

import { AuditLogQueryDto } from './dto/audit-log-query.dto.js';

@Controller('organizations/:organizationId/audit-logs')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
@Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Query()
    query: AuditLogQueryDto,
  ) {
    return this.auditService.findAll(organizationId, query);
  }
}
