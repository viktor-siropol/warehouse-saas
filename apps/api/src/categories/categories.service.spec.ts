import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service.js';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  const prismaMock = {
    category: {
      findMany: vi.fn(),
    },
  };

  let service: CategoriesService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new CategoriesService(prismaMock as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('should return categories belonging to the organization', async () => {
      const organizationId = '550e8400-e29b-41d4-a716-446655440000';

      const categories = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          organizationId,
          name: 'Electronics',
        },
      ];

      prismaMock.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll(organizationId);

      expect(result).toEqual(categories);

      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        where: {
          organizationId,
        },

        orderBy: {
          name: 'asc',
        },
      });
    });
  });
});
