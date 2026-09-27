import { Injectable } from '@nestjs/common';

import {
  Prisma,
  PurchaseOrderStatus,
  SalesOrderStatus,
} from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

type DashboardInventoryRow = {
  onHand: Prisma.Decimal;

  reserved: Prisma.Decimal;

  available: Prisma.Decimal;

  inventoryPositions: number;

  lowStockPositions: number;
};

type InventoryWarehouseRow = {
  warehouseId: string;

  warehouseCode: string;

  warehouseName: string;

  productPositions: number;

  lowStockPositions: number;

  onHand: Prisma.Decimal;

  reserved: Prisma.Decimal;

  available: Prisma.Decimal;
};

type MovementSummaryRow = {
  date: string;

  inbound: Prisma.Decimal;

  outbound: Prisma.Decimal;

  movementCount: number;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(organizationId: string) {
    const [
      inventoryRows,
      activeProducts,
      activeWarehouses,
      openPurchaseOrders,
      openSalesOrders,
      recentMovements,
      recentAudit,
    ] = await Promise.all([
      this.prisma.$queryRaw<DashboardInventoryRow[]>`
          SELECT
            COALESCE(
              SUM(i."quantity"),
              0
            )::numeric
              AS "onHand",

            COALESCE(
              SUM(i."reservedQuantity"),
              0
            )::numeric
              AS "reserved",

            COALESCE(
              SUM(
                i."quantity" -
                i."reservedQuantity"
              ),
              0
            )::numeric
              AS "available",

            COUNT(*)::int
              AS "inventoryPositions",

            (
              COUNT(*) FILTER (
                WHERE
                  i."reorderPoint" > 0
                  AND (
                    i."quantity" -
                    i."reservedQuantity"
                  ) <=
                    i."reorderPoint"
              )
            )::int
              AS "lowStockPositions"

          FROM "Inventory" i

          INNER JOIN "Product" p
            ON p."id" =
              i."productId"

          INNER JOIN "Warehouse" w
            ON w."id" =
              i."warehouseId"

          WHERE
            p."organizationId" =
              CAST(
                ${organizationId}
                AS uuid
              )

            AND w."organizationId" =
              CAST(
                ${organizationId}
                AS uuid
              )

            AND p."isActive" =
              true

            AND w."isActive" =
              true
        `,

      this.prisma.product.count({
        where: {
          organizationId,
          isActive: true,
        },
      }),

      this.prisma.warehouse.count({
        where: {
          organizationId,
          isActive: true,
        },
      }),

      this.prisma.purchaseOrder.count({
        where: {
          organizationId,

          status: {
            in: [
              PurchaseOrderStatus.DRAFT,
              PurchaseOrderStatus.SUBMITTED,
              PurchaseOrderStatus.PARTIALLY_RECEIVED,
            ],
          },
        },
      }),

      this.prisma.salesOrder.count({
        where: {
          organizationId,

          status: {
            in: [
              SalesOrderStatus.DRAFT,
              SalesOrderStatus.CONFIRMED,
              SalesOrderStatus.PARTIALLY_RESERVED,
              SalesOrderStatus.RESERVED,
              SalesOrderStatus.PARTIALLY_FULFILLED,
            ],
          },
        },
      }),

      this.prisma.stockMovement.findMany({
        where: {
          warehouse: {
            organizationId,
          },
        },

        select: {
          id: true,
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
        },

        orderBy: {
          createdAt: 'desc',
        },

        take: 8,
      }),

      this.prisma.auditLog.findMany({
        where: {
          organizationId,
        },

        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,

          actorUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },

        take: 8,
      }),
    ]);

    const inventory = inventoryRows[0] ?? {
      onHand: new Prisma.Decimal(0),

      reserved: new Prisma.Decimal(0),

      available: new Prisma.Decimal(0),

      inventoryPositions: 0,

      lowStockPositions: 0,
    };

    return {
      catalog: {
        activeProducts,
        activeWarehouses,
      },

      inventory: {
        onHand: inventory.onHand.toString(),

        reserved: inventory.reserved.toString(),

        available: inventory.available.toString(),

        inventoryPositions: inventory.inventoryPositions,

        lowStockPositions: inventory.lowStockPositions,
      },

      orders: {
        openPurchaseOrders,
        openSalesOrders,
      },

      recentMovements: recentMovements.map((movement) => ({
        ...movement,

        delta: movement.delta.toString(),
      })),

      recentAudit,
    };
  }

  async getInventoryByWarehouse(organizationId: string) {
    const rows = await this.prisma.$queryRaw<InventoryWarehouseRow[]>`
        SELECT
          w."id"::text
            AS "warehouseId",

          w."code"
            AS "warehouseCode",

          w."name"
            AS "warehouseName",

          (
            COUNT(
              i."productId"
            ) FILTER (
              WHERE
                p."id" IS NOT NULL
            )
          )::int
            AS "productPositions",

          (
            COUNT(*) FILTER (
              WHERE
                p."id" IS NOT NULL
                AND i."reorderPoint" > 0
                AND (
                  i."quantity" -
                  i."reservedQuantity"
                ) <=
                  i."reorderPoint"
            )
          )::int
            AS "lowStockPositions",

          COALESCE(
            SUM(
              i."quantity"
            ) FILTER (
              WHERE
                p."id" IS NOT NULL
            ),
            0
          )::numeric
            AS "onHand",

          COALESCE(
            SUM(
              i."reservedQuantity"
            ) FILTER (
              WHERE
                p."id" IS NOT NULL
            ),
            0
          )::numeric
            AS "reserved",

          COALESCE(
            SUM(
              i."quantity" -
              i."reservedQuantity"
            ) FILTER (
              WHERE
                p."id" IS NOT NULL
            ),
            0
          )::numeric
            AS "available"

        FROM "Warehouse" w

        LEFT JOIN "Inventory" i
          ON i."warehouseId" =
            w."id"

        LEFT JOIN "Product" p
          ON p."id" =
            i."productId"

          AND p."organizationId" =
            CAST(
              ${organizationId}
              AS uuid
            )

          AND p."isActive" =
            true

        WHERE
          w."organizationId" =
            CAST(
              ${organizationId}
              AS uuid
            )

          AND w."isActive" =
            true

        GROUP BY
          w."id",
          w."code",
          w."name"

        ORDER BY
          w."name" ASC
      `;

    return rows.map((row) => ({
      ...row,

      onHand: row.onHand.toString(),

      reserved: row.reserved.toString(),

      available: row.available.toString(),
    }));
  }

  async getMovementSummary(
    organizationId: string,

    days: number,
  ) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.$queryRaw<MovementSummaryRow[]>`
        SELECT
          TO_CHAR(
            sm."createdAt"
              AT TIME ZONE
              'UTC',

            'YYYY-MM-DD'
          )
            AS "date",

          COALESCE(
            SUM(
              CASE
                WHEN sm."delta" > 0
                  THEN sm."delta"

                ELSE 0
              END
            ),
            0
          )::numeric
            AS "inbound",

          COALESCE(
            SUM(
              CASE
                WHEN sm."delta" < 0
                  THEN -sm."delta"

                ELSE 0
              END
            ),
            0
          )::numeric
            AS "outbound",

          COUNT(*)::int
            AS "movementCount"

        FROM "StockMovement" sm

        INNER JOIN "Warehouse" w
          ON w."id" =
            sm."warehouseId"

        WHERE
          w."organizationId" =
            CAST(
              ${organizationId}
              AS uuid
            )

          AND sm."createdAt" >=
            ${from}

        GROUP BY
          TO_CHAR(
            sm."createdAt"
              AT TIME ZONE
              'UTC',

            'YYYY-MM-DD'
          )

        ORDER BY
          "date" ASC
      `;

    return rows.map((row) => ({
      ...row,

      inbound: row.inbound.toString(),

      outbound: row.outbound.toString(),
    }));
  }

  async getOrderStatusSummary(organizationId: string) {
    const [purchaseOrders, salesOrders] = await Promise.all([
      this.prisma.purchaseOrder.groupBy({
        by: ['status'],

        where: {
          organizationId,
        },

        _count: {
          _all: true,
        },

        orderBy: {
          status: 'asc',
        },
      }),

      this.prisma.salesOrder.groupBy({
        by: ['status'],

        where: {
          organizationId,
        },

        _count: {
          _all: true,
        },

        orderBy: {
          status: 'asc',
        },
      }),
    ]);

    return {
      purchaseOrders: purchaseOrders.map((item) => ({
        status: item.status,

        count: item._count._all,
      })),

      salesOrders: salesOrders.map((item) => ({
        status: item.status,

        count: item._count._all,
      })),
    };
  }
}
