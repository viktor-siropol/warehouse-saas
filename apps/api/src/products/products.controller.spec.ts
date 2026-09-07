import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

describe('ProductsController', () => {
  const productsServiceMock = {
    findAll: vi.fn(),
    create: vi.fn(),
  };

  let controller: ProductsController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],

      providers: [
        {
          provide: ProductsService,
          useValue: productsServiceMock,
        },
      ],
    }).compile();

    controller = moduleRef.get(ProductsController);
  });

  describe('findAll', () => {
    it('should pass organizationId to ProductsService', async () => {
      const organizationId = '550e8400-e29b-41d4-a716-446655440000';

      const products = [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'iPhone 15',
        },
      ];

      productsServiceMock.findAll.mockResolvedValue(products);

      const result = await controller.findAll(organizationId);

      expect(productsServiceMock.findAll).toHaveBeenCalledWith(organizationId);

      expect(result).toEqual(products);
    });
  });

  describe('create', () => {
    it('should pass organizationId and dto to ProductsService', async () => {
      const organizationId = '550e8400-e29b-41d4-a716-446655440000';

      const dto: CreateProductDto = {
        categoryId: '550e8400-e29b-41d4-a716-446655440001',

        sku: 'IPHONE-15',
        name: 'iPhone 15',
        description: 'Apple smartphone',
      };

      const createdProduct = {
        id: '550e8400-e29b-41d4-a716-446655440002',

        organizationId,
        ...dto,
      };

      productsServiceMock.create.mockResolvedValue(createdProduct);

      const result = await controller.create(organizationId, dto);

      expect(productsServiceMock.create).toHaveBeenCalledWith(
        organizationId,
        dto,
      );

      expect(result).toEqual(createdProduct);
    });
  });
});
