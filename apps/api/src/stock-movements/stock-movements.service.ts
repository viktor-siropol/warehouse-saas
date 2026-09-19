import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { StockMovementsQueryDto } from './dto/stock-movements-query.dto.js';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string, query: StockMovementsQueryDto) {
    return this.prisma.stockMovement.findMany({
      where: {
        warehouse: {
          organizationId,
        },

        product: {
          organizationId,
        },

        ...(query.warehouseId
          ? {
              warehouseId: query.warehouseId,
            }
          : {}),

        ...(query.productId
          ? {
              productId: query.productId,
            }
          : {}),
      },

      select: {
        id: true,
        operationId: true,
        type: true,
        delta: true,
        note: true,
        createdAt: true,

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

        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },

      orderBy: [
        {
          createdAt: 'desc',
        },

        {
          id: 'desc',
        },
      ],

      take: query.limit ?? 50,
    });
  }
}
