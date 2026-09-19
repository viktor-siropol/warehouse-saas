import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import { Prisma, StockMovementType } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { AdjustStockDto } from './dto/adjust-stock.dto.js';

import { IssueStockDto } from './dto/issue-stock.dto.js';

import { ReceiptStockDto } from './dto/receipt-stock.dto.js';

import { TransferStockDto } from './dto/transfer-stock.dto.js';

const MAX_TRANSACTION_RETRIES = 3;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findWarehouseInventory(organizationId: string, warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        organizationId,
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        code: true,
        address: true,
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found in this organization');
    }

    const products = await this.prisma.product.findMany({
      where: {
        organizationId,
        isActive: true,
      },

      select: {
        id: true,
        sku: true,
        name: true,
        isActive: true,

        category: {
          select: {
            id: true,
            name: true,
          },
        },

        inventories: {
          where: {
            warehouseId,
          },

          select: {
            quantity: true,
            reorderPoint: true,
            updatedAt: true,
          },

          take: 1,
        },
      },

      orderBy: {
        name: 'asc',
      },
    });

    return {
      warehouse,

      items: products.map(({ inventories, ...product }) => {
        const inventory = inventories[0];

        return {
          product,

          quantity: inventory?.quantity ?? new Prisma.Decimal(0),

          reorderPoint: inventory?.reorderPoint ?? new Prisma.Decimal(0),

          updatedAt: inventory?.updatedAt ?? null,
        };
      }),
    };
  }

  async receiveStock(
    organizationId: string,
    warehouseId: string,
    userId: string,
    dto: ReceiptStockDto,
  ) {
    const quantity = this.parsePositiveQuantity(dto.quantity);

    const operationId = randomUUID();

    const note = this.normalizeOptionalNote(dto.note);

    return this.runStockTransaction(() =>
      this.prisma.$transaction(
        async (tx) => {
          const warehouse = await tx.warehouse.findFirst({
            where: {
              id: warehouseId,
              organizationId,
              isActive: true,
            },

            select: {
              id: true,
            },
          });

          if (!warehouse) {
            throw new NotFoundException(
              'Warehouse not found in this organization',
            );
          }

          const product = await tx.product.findFirst({
            where: {
              id: dto.productId,
              organizationId,
              isActive: true,
            },

            select: {
              id: true,
            },
          });

          if (!product) {
            throw new NotFoundException(
              'Product not found in this organization',
            );
          }

          const inventory = await tx.inventory.upsert({
            where: {
              warehouseId_productId: {
                warehouseId,
                productId: dto.productId,
              },
            },

            create: {
              warehouseId,
              productId: dto.productId,
              quantity,
            },

            update: {
              quantity: {
                increment: quantity,
              },
            },
          });

          const movement = await tx.stockMovement.create({
            data: {
              operationId,
              warehouseId,
              productId: dto.productId,
              createdById: userId,
              type: StockMovementType.RECEIPT,
              delta: quantity,
              note,
            },
          });

          return {
            operationId,
            inventory,
            movement,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

          maxWait: 5_000,

          timeout: 10_000,
        },
      ),
    );
  }

  async issueStock(
    organizationId: string,
    warehouseId: string,
    userId: string,
    dto: IssueStockDto,
  ) {
    const quantity = this.parsePositiveQuantity(dto.quantity);

    const operationId = randomUUID();

    const note = this.normalizeOptionalNote(dto.note);

    return this.runStockTransaction(() =>
      this.prisma.$transaction(
        async (tx) => {
          const warehouse = await tx.warehouse.findFirst({
            where: {
              id: warehouseId,
              organizationId,
              isActive: true,
            },

            select: {
              id: true,
            },
          });

          if (!warehouse) {
            throw new NotFoundException(
              'Warehouse not found in this organization',
            );
          }

          const product = await tx.product.findFirst({
            where: {
              id: dto.productId,
              organizationId,
              isActive: true,
            },

            select: {
              id: true,
            },
          });

          if (!product) {
            throw new NotFoundException(
              'Product not found in this organization',
            );
          }

          const updateResult = await tx.inventory.updateMany({
            where: {
              warehouseId,
              productId: dto.productId,

              quantity: {
                gte: quantity,
              },
            },

            data: {
              quantity: {
                decrement: quantity,
              },
            },
          });

          if (updateResult.count !== 1) {
            throw new ConflictException('Insufficient stock');
          }

          const inventory = await tx.inventory.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId,
                productId: dto.productId,
              },
            },
          });

          if (!inventory) {
            throw new ConflictException(
              'Inventory changed during the operation',
            );
          }

          const movement = await tx.stockMovement.create({
            data: {
              operationId,
              warehouseId,
              productId: dto.productId,
              createdById: userId,

              type: StockMovementType.ISSUE,

              delta: quantity.negated(),

              note,
            },
          });

          return {
            operationId,
            inventory,
            movement,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

          maxWait: 5_000,

          timeout: 10_000,
        },
      ),
    );
  }

  async adjustStock(
    organizationId: string,
    warehouseId: string,
    userId: string,
    dto: AdjustStockDto,
  ) {
    const delta = this.parseNonZeroDelta(dto.delta);

    const operationId = randomUUID();

    const note = dto.note.trim();

    return this.runStockTransaction(() =>
      this.prisma.$transaction(
        async (tx) => {
          const warehouse = await tx.warehouse.findFirst({
            where: {
              id: warehouseId,
              organizationId,
              isActive: true,
            },

            select: {
              id: true,
            },
          });

          if (!warehouse) {
            throw new NotFoundException(
              'Warehouse not found in this organization',
            );
          }

          const product = await tx.product.findFirst({
            where: {
              id: dto.productId,
              organizationId,
              isActive: true,
            },

            select: {
              id: true,
            },
          });

          if (!product) {
            throw new NotFoundException(
              'Product not found in this organization',
            );
          }

          if (delta.gt(0)) {
            await tx.inventory.upsert({
              where: {
                warehouseId_productId: {
                  warehouseId,
                  productId: dto.productId,
                },
              },

              create: {
                warehouseId,
                productId: dto.productId,

                quantity: delta,
              },

              update: {
                quantity: {
                  increment: delta,
                },
              },
            });
          } else {
            const amount = delta.abs();

            const updateResult = await tx.inventory.updateMany({
              where: {
                warehouseId,
                productId: dto.productId,

                quantity: {
                  gte: amount,
                },
              },

              data: {
                quantity: {
                  decrement: amount,
                },
              },
            });

            if (updateResult.count !== 1) {
              throw new ConflictException(
                'Adjustment would make stock negative',
              );
            }
          }

          const inventory = await tx.inventory.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId,
                productId: dto.productId,
              },
            },
          });

          if (!inventory) {
            throw new ConflictException(
              'Inventory changed during the operation',
            );
          }

          const movement = await tx.stockMovement.create({
            data: {
              operationId,
              warehouseId,
              productId: dto.productId,
              createdById: userId,

              type: StockMovementType.ADJUSTMENT,

              delta,

              note,
            },
          });

          return {
            operationId,
            inventory,
            movement,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

          maxWait: 5_000,

          timeout: 10_000,
        },
      ),
    );
  }

  async transferStock(
    organizationId: string,
    userId: string,
    dto: TransferStockDto,
  ) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouses must be different',
      );
    }

    const quantity = this.parsePositiveQuantity(dto.quantity);

    const operationId = randomUUID();

    const note = this.normalizeOptionalNote(dto.note);

    return this.runStockTransaction(() =>
      this.prisma.$transaction(
        async (tx) => {
          const warehouses = await tx.warehouse.findMany({
            where: {
              organizationId,
              isActive: true,

              id: {
                in: [dto.fromWarehouseId, dto.toWarehouseId],
              },
            },

            select: {
              id: true,
            },
          });

          if (warehouses.length !== 2) {
            throw new NotFoundException(
              'One or both warehouses were not found in this organization',
            );
          }

          const product = await tx.product.findFirst({
            where: {
              id: dto.productId,
              organizationId,
              isActive: true,
            },

            select: {
              id: true,
            },
          });

          if (!product) {
            throw new NotFoundException(
              'Product not found in this organization',
            );
          }

          const sourceUpdate = await tx.inventory.updateMany({
            where: {
              warehouseId: dto.fromWarehouseId,

              productId: dto.productId,

              quantity: {
                gte: quantity,
              },
            },

            data: {
              quantity: {
                decrement: quantity,
              },
            },
          });

          if (sourceUpdate.count !== 1) {
            throw new ConflictException(
              'Insufficient stock in source warehouse',
            );
          }

          await tx.inventory.upsert({
            where: {
              warehouseId_productId: {
                warehouseId: dto.toWarehouseId,

                productId: dto.productId,
              },
            },

            create: {
              warehouseId: dto.toWarehouseId,

              productId: dto.productId,

              quantity,
            },

            update: {
              quantity: {
                increment: quantity,
              },
            },
          });

          const sourceInventory = await tx.inventory.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId: dto.fromWarehouseId,

                productId: dto.productId,
              },
            },
          });

          const destinationInventory = await tx.inventory.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId: dto.toWarehouseId,

                productId: dto.productId,
              },
            },
          });

          if (!sourceInventory || !destinationInventory) {
            throw new ConflictException('Inventory changed during transfer');
          }

          await tx.stockMovement.createMany({
            data: [
              {
                operationId,

                warehouseId: dto.fromWarehouseId,

                productId: dto.productId,

                createdById: userId,

                type: StockMovementType.TRANSFER_OUT,

                delta: quantity.negated(),

                note,
              },

              {
                operationId,

                warehouseId: dto.toWarehouseId,

                productId: dto.productId,

                createdById: userId,

                type: StockMovementType.TRANSFER_IN,

                delta: quantity,

                note,
              },
            ],
          });

          return {
            operationId,

            from: sourceInventory,

            to: destinationInventory,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

          maxWait: 5_000,

          timeout: 10_000,
        },
      ),
    );
  }

  private parsePositiveQuantity(rawValue: string): Prisma.Decimal {
    const quantity = new Prisma.Decimal(rawValue);

    if (quantity.lte(0)) {
      throw new BadRequestException('quantity must be greater than zero');
    }

    return quantity;
  }

  private parseNonZeroDelta(rawValue: string): Prisma.Decimal {
    const delta = new Prisma.Decimal(rawValue);

    if (delta.isZero()) {
      throw new BadRequestException('delta must not be zero');
    }

    return delta;
  }

  private normalizeOptionalNote(note: string | undefined): string | undefined {
    const normalized = note?.trim();

    return normalized ? normalized : undefined;
  }

  private async runStockTransaction<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || error.code === 'P2002');

        if (!retryable) {
          throw error;
        }

        if (attempt === MAX_TRANSACTION_RETRIES) {
          throw new ConflictException(
            'Inventory was modified concurrently. Please retry the operation.',
          );
        }

        await new Promise((resolve) => {
          setTimeout(resolve, attempt * 25);
        });
      }
    }

    throw new ConflictException('Inventory operation could not be completed');
  }
}
