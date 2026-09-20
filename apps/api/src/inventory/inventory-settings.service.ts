import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { LowStockQueryDto } from './dto/low-stock-query.dto.js';

import { SetReorderPointDto } from './dto/set-reorder-point.dto.js';

@Injectable()
export class InventorySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async setReorderPoint(
    organizationId: string,
    warehouseId: string,
    productId: string,
    dto: SetReorderPointDto,
  ) {
    const [warehouse, product] = await Promise.all([
      this.prisma.warehouse.findFirst({
        where: {
          id: warehouseId,
          organizationId,
          isActive: true,
        },

        select: {
          id: true,
        },
      }),

      this.prisma.product.findFirst({
        where: {
          id: productId,
          organizationId,
          isActive: true,
        },

        select: {
          id: true,
        },
      }),
    ]);

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found in this organization');
    }

    if (!product) {
      throw new NotFoundException('Product not found in this organization');
    }

    const reorderPoint = new Prisma.Decimal(dto.reorderPoint);

    return this.prisma.inventory.upsert({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },

      create: {
        warehouseId,
        productId,
        quantity: new Prisma.Decimal(0),
        reorderPoint,
      },

      update: {
        reorderPoint,
      },

      select: {
        quantity: true,
        reorderPoint: true,
        updatedAt: true,

        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },

        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
  }

  findLowStock(organizationId: string, query: LowStockQueryDto) {
    return this.prisma.inventory.findMany({
      where: {
        reorderPoint: {
          gt: new Prisma.Decimal(0),
        },

        quantity: {
          lte: this.prisma.inventory.fields.reorderPoint,
        },

        product: {
          is: {
            organizationId,
            isActive: true,
          },
        },

        warehouse: {
          is: {
            organizationId,
            isActive: true,

            ...(query.warehouseId
              ? {
                  id: query.warehouseId,
                }
              : {}),
          },
        },
      },

      select: {
        quantity: true,
        reorderPoint: true,
        updatedAt: true,

        product: {
          select: {
            id: true,
            sku: true,
            name: true,

            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },

      orderBy: {
        updatedAt: 'asc',
      },

      take: query.limit ?? 100,
    });
  }
}
