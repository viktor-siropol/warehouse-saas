import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { StockMovementsQueryDto } from './dto/stock-movements-query.dto.js';

import { StockMovementsService } from './stock-movements.service.js';

@Controller('organizations/:organizationId/stock-movements')
@UseGuards(OrganizationMembershipGuard)
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Get()
  findAll(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Query()
    query: StockMovementsQueryDto,
  ) {
    return this.stockMovementsService.findAll(organizationId, query);
  }
}
