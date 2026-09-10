import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { CategoriesService } from './categories.service.js';

@Controller('organizations/:organizationId/categories')
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
