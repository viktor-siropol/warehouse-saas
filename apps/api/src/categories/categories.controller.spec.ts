import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';

describe('CategoriesController', () => {
  const categoriesServiceMock = {
    findAll: vi.fn(),
  };

  let controller: CategoriesController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [CategoriesController],

      providers: [
        {
          provide: CategoriesService,
          useValue: categoriesServiceMock,
        },
      ],
    }).compile();

    controller = moduleRef.get(CategoriesController);
  });

  describe('findAll', () => {
    it('should pass organizationId to CategoriesService', async () => {
      const organizationId = '550e8400-e29b-41d4-a716-446655440000';

      const categories = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Electronics',
        },
      ];

      categoriesServiceMock.findAll.mockResolvedValue(categories);

      const result = await controller.findAll(organizationId);

      expect(categoriesServiceMock.findAll).toHaveBeenCalledWith(
        organizationId,
      );

      expect(result).toEqual(categories);
    });
  });
});
