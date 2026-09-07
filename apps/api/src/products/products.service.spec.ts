import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  const prismaMock = {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },

    organization: {
      findUnique: vi.fn(),
    },

    category: {
      findFirst: vi.fn(),
    },
  };

  let service: ProductsService;

  beforeEach(() => {
    vi.clearAllMocks();

    service = new ProductsService(prismaMock as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('should return products belonging to the organization', async () => {
      const organizationId = '550e8400-e29b-41d4-a716-446655440000';

      prismaMock.product.findMany.mockResolvedValue([]);

      const result = await service.findAll(organizationId);

      expect(result).toEqual([]);

      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: {
          organizationId,
        },

        include: {
          category: true,
        },

        orderBy: {
          name: 'asc',
        },
      });
    });
  });

  describe('create', () => {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000';

    const categoryId = '550e8400-e29b-41d4-a716-446655440001';

    const productId = '550e8400-e29b-41d4-a716-446655440002';

    const dto: CreateProductDto = {
      categoryId,
      sku: 'IPHONE-15',
      name: 'iPhone 15',
      description: 'Apple smartphone',
    };

    it('should throw NotFoundException when organization does not exist', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      await expect(service.create(organizationId, dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: {
          id: organizationId,
        },

        select: {
          id: true,
        },
      });

      expect(prismaMock.category.findFirst).not.toHaveBeenCalled();

      expect(prismaMock.product.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when category does not belong to organization', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: organizationId,
      });

      prismaMock.category.findFirst.mockResolvedValue(null);

      await expect(service.create(organizationId, dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
        where: {
          id: categoryId,
          organizationId,
        },

        select: {
          id: true,
        },
      });

      expect(prismaMock.product.findUnique).not.toHaveBeenCalled();

      expect(prismaMock.product.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when product with SKU already exists', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: organizationId,
      });

      prismaMock.category.findFirst.mockResolvedValue({
        id: categoryId,
      });

      prismaMock.product.findUnique.mockResolvedValue({
        id: productId,
      });

      await expect(service.create(organizationId, dto)).rejects.toThrow(
        ConflictException,
      );

      expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_sku: {
            organizationId,
            sku: dto.sku,
          },
        },

        select: {
          id: true,
        },
      });

      expect(prismaMock.product.create).not.toHaveBeenCalled();
    });

    it('should create a product', async () => {
      prismaMock.organization.findUnique.mockResolvedValue({
        id: organizationId,
      });

      prismaMock.category.findFirst.mockResolvedValue({
        id: categoryId,
      });

      prismaMock.product.findUnique.mockResolvedValue(null);

      const createdProduct = {
        id: productId,
        organizationId,
        categoryId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,

        category: {
          id: categoryId,
          name: 'Electronics',
        },
      };

      prismaMock.product.create.mockResolvedValue(createdProduct);

      const result = await service.create(organizationId, dto);

      expect(prismaMock.product.create).toHaveBeenCalledWith({
        data: {
          organizationId,
          categoryId: dto.categoryId,
          sku: dto.sku,
          name: dto.name,
          description: dto.description,
        },

        include: {
          category: true,
        },
      });

      expect(result).toEqual(createdProduct);
    });
  });
});
