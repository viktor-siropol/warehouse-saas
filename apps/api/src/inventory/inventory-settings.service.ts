import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { LowStockQueryDto } from './dto/low-stock-query.dto.js';

import { SetReorderPointDto } from './dto/set-reorder-point.dto.js';

type LowStockRow = {
  quantity: Prisma.Decimal;
  reservedQuantity: Prisma.Decimal;
  availableQuantity: Prisma.Decimal;
  reorderPoint: Prisma.Decimal;
  updatedAt: Date;

  productId: string;
  productSku: string;
  productName: string;

  categoryId: string;
  categoryName: string;

  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
};

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
        reservedQuantity: true,
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

  async findLowStock(organizationId: string, query: LowStockQueryDto) {
    const limit = query.limit ?? 100;

    const rows = query.warehouseId
      ? await this.prisma.$queryRaw<LowStockRow[]>`
            SELECT
              i."quantity",
              i."reservedQuantity",
              (
                i."quantity" -
                i."reservedQuantity"
              ) AS "availableQuantity",
              i."reorderPoint",
              i."updatedAt",

              p."id" AS "productId",
              p."sku" AS "productSku",
              p."name" AS "productName",

              c."id" AS "categoryId",
              c."name" AS "categoryName",

              w."id" AS "warehouseId",
              w."code" AS "warehouseCode",
              w."name" AS "warehouseName"

            FROM "Inventory" i

            INNER JOIN "Product" p
              ON p."id" = i."productId"

            INNER JOIN "Category" c
              ON c."id" = p."categoryId"

            INNER JOIN "Warehouse" w
              ON w."id" = i."warehouseId"

            WHERE
              p."organizationId" =
                CAST(${organizationId} AS uuid)

              AND w."organizationId" =
                CAST(${organizationId} AS uuid)

              AND w."id" =
                CAST(${query.warehouseId} AS uuid)

              AND p."isActive" = true
              AND w."isActive" = true

              AND i."reorderPoint" > 0

              AND (
                i."quantity" -
                i."reservedQuantity"
              ) <= i."reorderPoint"

            ORDER BY
              i."updatedAt" ASC

            LIMIT ${limit}
          `
      : await this.prisma.$queryRaw<LowStockRow[]>`
            SELECT
              i."quantity",
              i."reservedQuantity",
              (
                i."quantity" -
                i."reservedQuantity"
              ) AS "availableQuantity",
              i."reorderPoint",
              i."updatedAt",

              p."id" AS "productId",
              p."sku" AS "productSku",
              p."name" AS "productName",

              c."id" AS "categoryId",
              c."name" AS "categoryName",

              w."id" AS "warehouseId",
              w."code" AS "warehouseCode",
              w."name" AS "warehouseName"

            FROM "Inventory" i

            INNER JOIN "Product" p
              ON p."id" = i."productId"

            INNER JOIN "Category" c
              ON c."id" = p."categoryId"

            INNER JOIN "Warehouse" w
              ON w."id" = i."warehouseId"

            WHERE
              p."organizationId" =
                CAST(${organizationId} AS uuid)

              AND w."organizationId" =
                CAST(${organizationId} AS uuid)

              AND p."isActive" = true
              AND w."isActive" = true

              AND i."reorderPoint" > 0

              AND (
                i."quantity" -
                i."reservedQuantity"
              ) <= i."reorderPoint"

            ORDER BY
              i."updatedAt" ASC

            LIMIT ${limit}
          `;

    return rows.map((row) => ({
      quantity: row.quantity,

      reservedQuantity: row.reservedQuantity,

      availableQuantity: row.availableQuantity,

      reorderPoint: row.reorderPoint,

      updatedAt: row.updatedAt,

      product: {
        id: row.productId,

        sku: row.productSku,

        name: row.productName,

        category: {
          id: row.categoryId,

          name: row.categoryName,
        },
      },

      warehouse: {
        id: row.warehouseId,

        code: row.warehouseCode,

        name: row.warehouseName,
      },
    }));
  }
}
