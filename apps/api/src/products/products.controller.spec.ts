import { Test, type TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { RolesGuard } from '../auth/guards/roles.guard.js';

import { CreateProductDto } from './dto/create-product.dto.js';

import { ProductsController } from './products.controller.js';

import { ProductsService } from './products.service.js';

describe('ProductsController', () => {
  let controller: ProductsController;

  const findAllMock = vi.fn();

  const createMock = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],

      providers: [
        {
          provide: ProductsService,

          useValue: {
            findAll: findAllMock,

            create: createMock,
          },
        },
      ],
    })
      .overrideGuard(OrganizationMembershipGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  describe('findAll', () => {
    it('should pass organizationId to ProductsService', () => {
      const organizationId = '550e8400-e29b-41d4-a716-446655440000';

      controller.findAll(organizationId);

      expect(findAllMock).toHaveBeenCalledTimes(1);

      expect(findAllMock).toHaveBeenCalledWith(organizationId);
    });
  });

  describe('create', () => {
    it('should pass organizationId and dto to ProductsService', () => {
      const organizationId = '550e8400-e29b-41d4-a716-446655440000';

      const dto: CreateProductDto = {
        categoryId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',

        sku: 'TEST-SKU-001',

        name: 'Test Product',

        description: 'Test description',
      };

      controller.create(organizationId, dto);

      expect(createMock).toHaveBeenCalledTimes(1);

      expect(createMock).toHaveBeenCalledWith(organizationId, dto);
    });
  });
});
