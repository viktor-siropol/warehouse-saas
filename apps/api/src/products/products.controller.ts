import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductsService } from './products.service.js';

@Controller(
  'organizations/:organizationId/products',
)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  findAll(
    @Param(
      'organizationId',
      ParseUUIDPipe,
    )
    organizationId: string,
  ) {
    return this.productsService.findAll(
      organizationId,
    );
  }

  @Post()
  create(
    @Param(
      'organizationId',
      ParseUUIDPipe,
    )
    organizationId: string,

    @Body()
    dto: CreateProductDto,
  ) {
    return this.productsService.create(
      organizationId,
      dto,
    );
  }
}