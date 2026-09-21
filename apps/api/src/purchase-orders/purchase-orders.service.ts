import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import {
  Prisma,
  PurchaseOrderStatus,
  StockMovementType,
} from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { AddPurchaseOrderItemDto } from './dto/add-purchase-order-item.dto.js';

import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';

import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto.js';

const MAX_TRANSACTION_RETRIES = 3;

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: {
        organizationId,
      },

      select: {
        id: true,
        number: true,
        status: true,
        currency: true,
        note: true,
        submittedAt: true,
        receivedAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,

        supplier: {
          select: {
            id: true,
            code: true,
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

        _count: {
          select: {
            items: true,
            receipts: true,
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

      take: 100,
    });
  }

  async findOne(organizationId: string, purchaseOrderId: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,

        organizationId,
      },

      select: {
        id: true,
        number: true,
        status: true,
        currency: true,
        note: true,
        submittedAt: true,
        receivedAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,

        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },

        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },

        items: {
          select: {
            id: true,
            orderedQuantity: true,
            receivedQuantity: true,
            unitCost: true,

            product: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
          },

          orderBy: {
            createdAt: 'asc',
          },
        },

        receipts: {
          select: {
            id: true,
            note: true,
            createdAt: true,

            receivedBy: {
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
        },
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(
        'Purchase order not found in this organization',
      );
    }

    return {
      ...purchaseOrder,

      items: purchaseOrder.items.map((item) => ({
        ...item,

        remainingQuantity: item.orderedQuantity.minus(item.receivedQuantity),
      })),
    };
  }

  async create(
    organizationId: string,
    userId: string,
    dto: CreatePurchaseOrderDto,
  ) {
    const [supplier, warehouse] = await Promise.all([
      this.prisma.supplier.findFirst({
        where: {
          id: dto.supplierId,

          organizationId,
          isActive: true,
        },

        select: {
          id: true,
        },
      }),

      this.prisma.warehouse.findFirst({
        where: {
          id: dto.warehouseId,

          organizationId,
          isActive: true,
        },

        select: {
          id: true,
        },
      }),
    ]);

    if (!supplier) {
      throw new NotFoundException(
        'Active supplier not found in this organization',
      );
    }

    if (!warehouse) {
      throw new NotFoundException(
        'Active warehouse not found in this organization',
      );
    }

    const currency = dto.currency.trim().toUpperCase();

    const note = this.normalizeOptionalText(dto.note);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const number = this.generatePurchaseOrderNumber();

      try {
        return await this.prisma.purchaseOrder.create({
          data: {
            organizationId,
            supplierId: dto.supplierId,

            warehouseId: dto.warehouseId,

            createdById: userId,

            number,
            currency,
            note,
          },

          select: {
            id: true,
            number: true,
            status: true,
            currency: true,
            createdAt: true,
          },
        });
      } catch (error) {
        const numberCollision =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002';

        if (numberCollision && attempt < 3) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException('Could not generate purchase order number');
  }

  async addItem(
    organizationId: string,
    purchaseOrderId: string,
    dto: AddPurchaseOrderItemDto,
  ) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,

        organizationId,
      },

      select: {
        id: true,
        status: true,
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(
        'Purchase order not found in this organization',
      );
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new ConflictException(
        'Items can only be changed while the purchase order is in DRAFT status',
      );
    }

    const product = await this.prisma.product.findFirst({
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
        'Active product not found in this organization',
      );
    }

    const orderedQuantity = this.parsePositiveQuantity(dto.orderedQuantity);

    const unitCost = this.parseNonNegativeMoney(dto.unitCost);

    try {
      return await this.prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId,
          productId: dto.productId,

          orderedQuantity,
          unitCost,
        },

        select: {
          id: true,
          orderedQuantity: true,
          receivedQuantity: true,
          unitCost: true,

          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This product is already present on the purchase order',
        );
      }

      throw error;
    }
  }

  async removeItem(
    organizationId: string,
    purchaseOrderId: string,
    itemId: string,
  ): Promise<void> {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,

        organizationId,
      },

      select: {
        id: true,
        status: true,
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(
        'Purchase order not found in this organization',
      );
    }

    if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new ConflictException(
        'Items can only be removed while the purchase order is in DRAFT status',
      );
    }

    const result = await this.prisma.purchaseOrderItem.deleteMany({
      where: {
        id: itemId,

        purchaseOrderId,
      },
    });

    if (result.count !== 1) {
      throw new NotFoundException('Purchase order item not found');
    }
  }

  async submit(organizationId: string, purchaseOrderId: string) {
    return this.runSerializableTransaction(() =>
      this.prisma.$transaction(
        async (tx) => {
          const purchaseOrder = await tx.purchaseOrder.findFirst({
            where: {
              id: purchaseOrderId,

              organizationId,
            },

            select: {
              id: true,
              status: true,

              supplier: {
                select: {
                  isActive: true,
                },
              },

              warehouse: {
                select: {
                  isActive: true,
                },
              },

              _count: {
                select: {
                  items: true,
                },
              },
            },
          });

          if (!purchaseOrder) {
            throw new NotFoundException(
              'Purchase order not found in this organization',
            );
          }

          if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
            throw new ConflictException(
              'Only DRAFT purchase orders can be submitted',
            );
          }

          if (purchaseOrder._count.items === 0) {
            throw new BadRequestException(
              'Purchase order must contain at least one item',
            );
          }

          if (!purchaseOrder.supplier.isActive) {
            throw new ConflictException('Supplier is inactive');
          }

          if (!purchaseOrder.warehouse.isActive) {
            throw new ConflictException('Warehouse is inactive');
          }

          return tx.purchaseOrder.update({
            where: {
              id: purchaseOrderId,
            },

            data: {
              status: PurchaseOrderStatus.SUBMITTED,

              submittedAt: new Date(),
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

          maxWait: 5_000,

          timeout: 10_000,
        },
      ),
    );
  }

  async cancel(organizationId: string, purchaseOrderId: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,

        organizationId,
      },

      select: {
        id: true,
        status: true,
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(
        'Purchase order not found in this organization',
      );
    }

    if (
      purchaseOrder.status !== PurchaseOrderStatus.DRAFT &&
      purchaseOrder.status !== PurchaseOrderStatus.SUBMITTED
    ) {
      throw new ConflictException(
        'Only DRAFT or unreceived SUBMITTED purchase orders can be cancelled',
      );
    }

    return this.prisma.purchaseOrder.update({
      where: {
        id: purchaseOrderId,
      },

      data: {
        status: PurchaseOrderStatus.CANCELLED,

        cancelledAt: new Date(),
      },
    });
  }

  async receive(
    organizationId: string,
    purchaseOrderId: string,
    userId: string,
    dto: ReceivePurchaseOrderDto,
  ) {
    const uniqueItemIds = new Set(
      dto.items.map((item) => item.purchaseOrderItemId),
    );

    if (uniqueItemIds.size !== dto.items.length) {
      throw new BadRequestException(
        'Each purchase order item may appear only once in a receipt',
      );
    }

    const parsedItems = dto.items.map((item) => ({
      purchaseOrderItemId: item.purchaseOrderItemId,

      quantity: this.parsePositiveQuantity(item.quantity),
    }));

    const note = this.normalizeOptionalText(dto.note);

    return this.runSerializableTransaction(() =>
      this.prisma.$transaction(
        async (tx) => {
          const purchaseOrder = await tx.purchaseOrder.findFirst({
            where: {
              id: purchaseOrderId,

              organizationId,
            },

            select: {
              id: true,
              number: true,
              status: true,
              warehouseId: true,

              warehouse: {
                select: {
                  isActive: true,
                },
              },

              items: {
                select: {
                  id: true,
                  productId: true,
                  orderedQuantity: true,

                  receivedQuantity: true,
                },
              },
            },
          });

          if (!purchaseOrder) {
            throw new NotFoundException(
              'Purchase order not found in this organization',
            );
          }

          if (
            purchaseOrder.status !== PurchaseOrderStatus.SUBMITTED &&
            purchaseOrder.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
          ) {
            throw new ConflictException(
              'Purchase order is not open for receiving',
            );
          }

          if (!purchaseOrder.warehouse.isActive) {
            throw new ConflictException('Purchase order warehouse is inactive');
          }

          const itemsById = new Map(
            purchaseOrder.items.map((item) => [item.id, item]),
          );

          for (const line of parsedItems) {
            const item = itemsById.get(line.purchaseOrderItemId);

            if (!item) {
              throw new BadRequestException(
                'Receipt contains an item that does not belong to this purchase order',
              );
            }

            const remaining = item.orderedQuantity.minus(item.receivedQuantity);

            if (line.quantity.gt(remaining)) {
              throw new ConflictException(
                'Received quantity exceeds the remaining ordered quantity',
              );
            }
          }

          const receipt = await tx.purchaseReceipt.create({
            data: {
              purchaseOrderId: purchaseOrder.id,

              warehouseId: purchaseOrder.warehouseId,

              receivedById: userId,

              note,
            },

            select: {
              id: true,
              createdAt: true,
            },
          });

          for (const line of parsedItems) {
            const item = itemsById.get(line.purchaseOrderItemId);

            if (!item) {
              throw new BadRequestException('Purchase order item not found');
            }

            await tx.purchaseOrderItem.update({
              where: {
                id: item.id,
              },

              data: {
                receivedQuantity: {
                  increment: line.quantity,
                },
              },
            });

            await tx.purchaseReceiptItem.create({
              data: {
                receiptId: receipt.id,

                purchaseOrderItemId: item.id,

                quantity: line.quantity,
              },
            });

            await tx.inventory.upsert({
              where: {
                warehouseId_productId: {
                  warehouseId: purchaseOrder.warehouseId,

                  productId: item.productId,
                },
              },

              create: {
                warehouseId: purchaseOrder.warehouseId,

                productId: item.productId,

                quantity: line.quantity,
              },

              update: {
                quantity: {
                  increment: line.quantity,
                },
              },
            });

            await tx.stockMovement.create({
              data: {
                operationId: receipt.id,

                purchaseReceiptId: receipt.id,

                warehouseId: purchaseOrder.warehouseId,

                productId: item.productId,

                createdById: userId,

                type: StockMovementType.RECEIPT,

                delta: line.quantity,

                note: note
                  ? `PO ${purchaseOrder.number}: ${note}`
                  : `PO ${purchaseOrder.number}`,
              },
            });
          }

          const updatedItems = await tx.purchaseOrderItem.findMany({
            where: {
              purchaseOrderId: purchaseOrder.id,
            },

            select: {
              orderedQuantity: true,

              receivedQuantity: true,
            },
          });

          const fullyReceived = updatedItems.every((item) =>
            item.receivedQuantity.eq(item.orderedQuantity),
          );

          const nextStatus = fullyReceived
            ? PurchaseOrderStatus.RECEIVED
            : PurchaseOrderStatus.PARTIALLY_RECEIVED;

          await tx.purchaseOrder.update({
            where: {
              id: purchaseOrder.id,
            },

            data: {
              status: nextStatus,

              receivedAt: fullyReceived ? new Date() : null,
            },
          });

          return {
            receiptId: receipt.id,

            purchaseOrderId: purchaseOrder.id,

            purchaseOrderNumber: purchaseOrder.number,

            status: nextStatus,

            createdAt: receipt.createdAt,
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
    const value = new Prisma.Decimal(rawValue);

    if (value.lte(0)) {
      throw new BadRequestException('quantity must be greater than zero');
    }

    return value;
  }

  private parseNonNegativeMoney(rawValue: string): Prisma.Decimal {
    const value = new Prisma.Decimal(rawValue);

    if (value.lt(0)) {
      throw new BadRequestException('unitCost must not be negative');
    }

    return value;
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim();

    return normalized ? normalized : undefined;
  }

  private generatePurchaseOrderNumber(): string {
    const year = new Date().getUTCFullYear();

    const suffix = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();

    return `PO-${year}-${suffix}`;
  }

  private async runSerializableTransaction<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!retryable) {
          throw error;
        }

        if (attempt === MAX_TRANSACTION_RETRIES) {
          throw new ConflictException(
            'Purchase order was modified concurrently. Please retry.',
          );
        }

        await new Promise((resolve) => {
          setTimeout(resolve, attempt * 25);
        });
      }
    }

    throw new ConflictException(
      'Purchase order operation could not be completed',
    );
  }
}
