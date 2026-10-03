import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator.js';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { RolesGuard } from '../auth/guards/roles.guard.js';

import { MembershipRole } from '../generated/prisma/client.js';

import { OperationsService } from './operations.service.js';

@Controller('organizations/:organizationId/operations')
@UseGuards(OrganizationMembershipGuard, RolesGuard)
@Roles(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MANAGER)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get('health')
  getHealth(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.operationsService.getHealth(organizationId);
  }
}
