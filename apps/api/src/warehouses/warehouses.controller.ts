import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { WarehousesService } from './warehouses.service.js';

@Controller('organizations/:organizationId/warehouses')
@UseGuards(OrganizationMembershipGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.warehousesService.findAll(organizationId);
  }
}
