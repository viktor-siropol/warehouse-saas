import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.product.findMany({
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
  }

  async create(organizationId: string, dto: CreateProductDto) {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
      },

      select: {
        id: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        organizationId,
      },

      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found in this organization');
    }

    const existingProduct = await this.prisma.product.findUnique({
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

    if (existingProduct) {
      throw new ConflictException('Product with this SKU already exists');
    }

    return this.prisma.product.create({
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
  }
}
