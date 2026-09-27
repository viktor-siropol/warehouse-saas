import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { ReportRangeQueryDto } from './dto/report-range-query.dto.js';

import { ReportsService } from './reports.service.js';

@Controller('organizations/:organizationId')
@UseGuards(OrganizationMembershipGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.reportsService.getDashboard(organizationId);
  }

  @Get('reports/inventory-by-warehouse')
  getInventoryByWarehouse(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.reportsService.getInventoryByWarehouse(organizationId);
  }

  @Get('reports/movement-summary')
  getMovementSummary(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Query()
    query: ReportRangeQueryDto,
  ) {
    return this.reportsService.getMovementSummary(organizationId, query.days);
  }

  @Get('reports/order-status-summary')
  getOrderStatusSummary(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,
  ) {
    return this.reportsService.getOrderStatusSummary(organizationId);
  }
}
