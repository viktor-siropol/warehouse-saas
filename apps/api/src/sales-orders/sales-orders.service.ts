import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  randomUUID,
} from 'node:crypto';

import {
  Prisma,
  SalesOrderStatus,
  StockMovementType,
} from '../generated/prisma/client.js';

import {
  PrismaService,
} from '../prisma/prisma.service.js';

import {
  AddSalesOrderItemDto,
} from './dto/add-sales-order-item.dto.js';

import {
  CreateSalesOrderDto,
} from './dto/create-sales-order.dto.js';

import {
  FulfillSalesOrderDto,
} from './dto/fulfill-sales-order.dto.js';

import {
  ReserveSalesOrderDto,
} from './dto/reserve-sales-order.dto.js';

const MAX_TRANSACTION_RETRIES =
  3;

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  findAll(
    organizationId: string,
  ) {
    return this.prisma.salesOrder.findMany({
      where: {
        organizationId,
      },

      select: {
        id: true,
        number: true,
        status: true,
        currency: true,
        note: true,
        customerNameSnapshot: true,
        confirmedAt: true,
        fulfilledAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,

        customer: {
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
            fulfillments: true,
          },
        },
      },

      orderBy: [
        {
          createdAt:
            'desc',
        },

        {
          id:
            'desc',
        },
      ],

      take: 100,
    });
  }

  async findOne(
    organizationId: string,
    salesOrderId: string,
  ) {
    const salesOrder =
      await this.prisma.salesOrder.findFirst({
        where: {
          id:
            salesOrderId,

          organizationId,
        },

        select: {
          id: true,
          number: true,
          status: true,
          currency: true,
          note: true,
          customerNameSnapshot: true,
          shippingAddressSnapshot: true,
          confirmedAt: true,
          fulfilledAt: true,
          cancelledAt: true,
          createdAt: true,
          updatedAt: true,
          warehouseId: true,

          customer: {
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
              productId: true,
              orderedQuantity: true,
              reservedQuantity: true,
              fulfilledQuantity: true,
              unitPrice: true,

              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                },
              },
            },

            orderBy: {
              createdAt:
                'asc',
            },
          },

          fulfillments: {
            select: {
              id: true,
              note: true,
              createdAt: true,

              fulfilledBy: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },

            orderBy: {
              createdAt:
                'desc',
            },
          },
        },
      });

    if (!salesOrder) {
      throw new NotFoundException(
        'Sales order not found in this organization',
      );
    }

    const productIds =
      salesOrder.items.map(
        (item) =>
          item.productId,
      );

    const inventories =
      productIds.length > 0
        ? await this.prisma.inventory.findMany({
            where: {
              warehouseId:
                salesOrder.warehouseId,

              productId: {
                in:
                  productIds,
              },
            },

            select: {
              productId: true,
              quantity: true,
              reservedQuantity: true,
            },
          })
        : [];

    const inventoryByProduct =
      new Map(
        inventories.map(
          (inventory) => [
            inventory.productId,
            inventory,
          ],
        ),
      );

    return {
      ...salesOrder,

      items:
        salesOrder.items.map(
          (item) => {
            const inventory =
              inventoryByProduct.get(
                item.productId,
              );

            const warehouseOnHandQuantity =
              inventory?.quantity ??
              new Prisma.Decimal(
                0,
              );

            const warehouseReservedQuantity =
              inventory?.reservedQuantity ??
              new Prisma.Decimal(
                0,
              );

            return {
              ...item,

              remainingToReserve:
                item
                  .orderedQuantity
                  .minus(
                    item
                      .fulfilledQuantity,
                  )
                  .minus(
                    item
                      .reservedQuantity,
                  ),

              remainingToFulfill:
                item
                  .orderedQuantity
                  .minus(
                    item
                      .fulfilledQuantity,
                  ),

              warehouseOnHandQuantity,

              warehouseReservedQuantity,

              warehouseAvailableQuantity:
                warehouseOnHandQuantity.minus(
                  warehouseReservedQuantity,
                ),
            };
          },
        ),
    };
  }

  async create(
    organizationId: string,
    userId: string,
    dto:
      CreateSalesOrderDto,
  ) {
    const [
      customer,
      warehouse,
    ] =
      await Promise.all([
        this.prisma.customer.findFirst({
          where: {
            id:
              dto.customerId,

            organizationId,
            isActive: true,
          },

          select: {
            id: true,
            name: true,
            shippingAddress: true,
          },
        }),

        this.prisma.warehouse.findFirst({
          where: {
            id:
              dto.warehouseId,

            organizationId,
            isActive: true,
          },

          select: {
            id: true,
          },
        }),
      ]);

    if (!customer) {
      throw new NotFoundException(
        'Active customer not found in this organization',
      );
    }

    if (!warehouse) {
      throw new NotFoundException(
        'Active warehouse not found in this organization',
      );
    }

    const currency =
      dto.currency
        .trim()
        .toUpperCase();

    const note =
      this.normalizeOptionalText(
        dto.note,
      );

    for (
      let attempt = 1;
      attempt <= 3;
      attempt += 1
    ) {
      const number =
        this.generateSalesOrderNumber();

      try {
        return await this.prisma.salesOrder.create({
          data: {
            organizationId,

            customerId:
              dto.customerId,

            warehouseId:
              dto.warehouseId,

            createdById:
              userId,

            number,
            currency,
            note,

            customerNameSnapshot:
              customer.name,

            shippingAddressSnapshot:
              customer.shippingAddress,
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
          error instanceof
            Prisma.PrismaClientKnownRequestError &&
          error.code ===
            'P2002';

        if (
          numberCollision &&
          attempt < 3
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException(
      'Could not generate sales order number',
    );
  }

  async addItem(
    organizationId: string,
    salesOrderId: string,
    dto:
      AddSalesOrderItemDto,
  ) {
    const salesOrder =
      await this.prisma.salesOrder.findFirst({
        where: {
          id:
            salesOrderId,

          organizationId,
        },

        select: {
          id: true,
          status: true,
        },
      });

    if (!salesOrder) {
      throw new NotFoundException(
        'Sales order not found in this organization',
      );
    }

    if (
      salesOrder.status !==
      SalesOrderStatus.DRAFT
    ) {
      throw new ConflictException(
        'Items can only be changed while the sales order is in DRAFT status',
      );
    }

    const product =
      await this.prisma.product.findFirst({
        where: {
          id:
            dto.productId,

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

    const orderedQuantity =
      this.parsePositiveQuantity(
        dto.orderedQuantity,
      );

    const unitPrice =
      this.parseNonNegativeMoney(
        dto.unitPrice,
      );

    try {
      return await this.prisma.salesOrderItem.create({
        data: {
          salesOrderId,

          productId:
            dto.productId,

          orderedQuantity,

          unitPrice,
        },

        select: {
          id: true,
          orderedQuantity: true,
          reservedQuantity: true,
          fulfilledQuantity: true,
          unitPrice: true,

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
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code ===
          'P2002'
      ) {
        throw new ConflictException(
          'This product is already present on the sales order',
        );
      }

      throw error;
    }
  }

  async removeItem(
    organizationId: string,
    salesOrderId: string,
    itemId: string,
  ): Promise<void> {
    const salesOrder =
      await this.prisma.salesOrder.findFirst({
        where: {
          id:
            salesOrderId,

          organizationId,
        },

        select: {
          id: true,
          status: true,
        },
      });

    if (!salesOrder) {
      throw new NotFoundException(
        'Sales order not found in this organization',
      );
    }

    if (
      salesOrder.status !==
      SalesOrderStatus.DRAFT
    ) {
      throw new ConflictException(
        'Items can only be removed while the sales order is in DRAFT status',
      );
    }

    const result =
      await this.prisma.salesOrderItem.deleteMany({
        where: {
          id:
            itemId,

          salesOrderId,
        },
      });

    if (
      result.count !==
      1
    ) {
      throw new NotFoundException(
        'Sales order item not found',
      );
    }
  }

  async confirm(
    organizationId: string,
    salesOrderId: string,
  ) {
    return this.runSerializableTransaction(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            const salesOrder =
              await tx.salesOrder.findFirst({
                where: {
                  id:
                    salesOrderId,

                  organizationId,
                },

                select: {
                  id: true,
                  status: true,

                  customer: {
                    select: {
                      isActive:
                        true,
                    },
                  },

                  warehouse: {
                    select: {
                      isActive:
                        true,
                    },
                  },

                  _count: {
                    select: {
                      items:
                        true,
                    },
                  },
                },
              });

            if (!salesOrder) {
              throw new NotFoundException(
                'Sales order not found in this organization',
              );
            }

            if (
              salesOrder.status !==
              SalesOrderStatus.DRAFT
            ) {
              throw new ConflictException(
                'Only DRAFT sales orders can be confirmed',
              );
            }

            if (
              salesOrder
                ._count
                .items ===
              0
            ) {
              throw new BadRequestException(
                'Sales order must contain at least one item',
              );
            }

            if (
              !salesOrder
                .customer
                .isActive
            ) {
              throw new ConflictException(
                'Customer is inactive',
              );
            }

            if (
              !salesOrder
                .warehouse
                .isActive
            ) {
              throw new ConflictException(
                'Warehouse is inactive',
              );
            }

            return tx.salesOrder.update({
              where: {
                id:
                  salesOrderId,
              },

              data: {
                status:
                  SalesOrderStatus.CONFIRMED,

                confirmedAt:
                  new Date(),
              },
            });
          },
          {
            isolationLevel:
              Prisma
                .TransactionIsolationLevel
                .Serializable,

            maxWait:
              5_000,

            timeout:
              10_000,
          },
        ),
    );
  }

  async reserve(
    organizationId: string,
    salesOrderId: string,
    dto:
      ReserveSalesOrderDto,
  ) {
    const uniqueItemIds =
      new Set(
        dto.items.map(
          (item) =>
            item
              .salesOrderItemId,
        ),
      );

    if (
      uniqueItemIds.size !==
      dto.items.length
    ) {
      throw new BadRequestException(
        'Each sales order item may appear only once in a reservation request',
      );
    }

    const parsedItems =
      dto.items.map(
        (item) => ({
          salesOrderItemId:
            item
              .salesOrderItemId,

          quantity:
            this.parsePositiveQuantity(
              item.quantity,
            ),
        }),
      );

    return this.runSerializableTransaction(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            const salesOrder =
              await tx.salesOrder.findFirst({
                where: {
                  id:
                    salesOrderId,

                  organizationId,
                },

                select: {
                  id: true,
                  warehouseId: true,
                  status: true,

                  warehouse: {
                    select: {
                      isActive:
                        true,
                    },
                  },

                  items: {
                    select: {
                      id: true,
                      productId: true,
                      orderedQuantity:
                        true,

                      reservedQuantity:
                        true,

                      fulfilledQuantity:
                        true,
                    },
                  },
                },
              });

            if (!salesOrder) {
              throw new NotFoundException(
                'Sales order not found in this organization',
              );
            }

            const reservableStatuses:
              SalesOrderStatus[] = [
                SalesOrderStatus.CONFIRMED,
                SalesOrderStatus.PARTIALLY_RESERVED,
                SalesOrderStatus.RESERVED,
                SalesOrderStatus.PARTIALLY_FULFILLED,
              ];

            if (
              !reservableStatuses.includes(
                salesOrder.status,
              )
            ) {
              throw new ConflictException(
                'Sales order is not open for reservation',
              );
            }

            if (
              !salesOrder
                .warehouse
                .isActive
            ) {
              throw new ConflictException(
                'Sales order warehouse is inactive',
              );
            }

            const itemsById =
              new Map(
                salesOrder.items.map(
                  (item) => [
                    item.id,
                    item,
                  ],
                ),
              );

            for (
              const line of
              parsedItems
            ) {
              const item =
                itemsById.get(
                  line
                    .salesOrderItemId,
                );

              if (!item) {
                throw new BadRequestException(
                  'Reservation contains an item that does not belong to this sales order',
                );
              }

              const remainingToReserve =
                item
                  .orderedQuantity
                  .minus(
                    item
                      .fulfilledQuantity,
                  )
                  .minus(
                    item
                      .reservedQuantity,
                  );

              if (
                line.quantity.gt(
                  remainingToReserve,
                )
              ) {
                throw new ConflictException(
                  'Reservation quantity exceeds the remaining unreserved order quantity',
                );
              }
            }

            const productIds =
              parsedItems.map(
                (line) => {
                  const item =
                    itemsById.get(
                      line
                        .salesOrderItemId,
                    );

                  if (!item) {
                    throw new BadRequestException(
                      'Sales order item not found',
                    );
                  }

                  return item.productId;
                },
              );

            const inventories =
              await tx.inventory.findMany({
                where: {
                  warehouseId:
                    salesOrder
                      .warehouseId,

                  productId: {
                    in:
                      productIds,
                  },
                },
              });

            const inventoryByProduct =
              new Map(
                inventories.map(
                  (inventory) => [
                    inventory.productId,
                    inventory,
                  ],
                ),
              );

            for (
              const line of
              parsedItems
            ) {
              const item =
                itemsById.get(
                  line
                    .salesOrderItemId,
                );

              if (!item) {
                throw new BadRequestException(
                  'Sales order item not found',
                );
              }

              const inventory =
                inventoryByProduct.get(
                  item.productId,
                );

              if (!inventory) {
                throw new ConflictException(
                  'Insufficient available stock',
                );
              }

              const available =
                inventory.quantity.minus(
                  inventory
                    .reservedQuantity,
                );

              if (
                available.lt(
                  line.quantity,
                )
              ) {
                throw new ConflictException(
                  'Insufficient available stock',
                );
              }

              await tx.inventory.update({
                where: {
                  warehouseId_productId: {
                    warehouseId:
                      salesOrder
                        .warehouseId,

                    productId:
                      item.productId,
                  },
                },

                data: {
                  reservedQuantity: {
                    increment:
                      line.quantity,
                  },
                },
              });

              await tx.salesOrderItem.update({
                where: {
                  id:
                    item.id,
                },

                data: {
                  reservedQuantity: {
                    increment:
                      line.quantity,
                  },
                },
              });
            }

            const updatedItems =
              await tx.salesOrderItem.findMany({
                where: {
                  salesOrderId:
                    salesOrder.id,
                },

                select: {
                  orderedQuantity:
                    true,

                  reservedQuantity:
                    true,

                  fulfilledQuantity:
                    true,
                },
              });

            const nextStatus =
              this.determineReservationStatus(
                updatedItems,
              );

            await tx.salesOrder.update({
              where: {
                id:
                  salesOrder.id,
              },

              data: {
                status:
                  nextStatus,
              },
            });

            return {
              salesOrderId:
                salesOrder.id,

              status:
                nextStatus,
            };
          },
          {
            isolationLevel:
              Prisma
                .TransactionIsolationLevel
                .Serializable,

            maxWait:
              5_000,

            timeout:
              10_000,
          },
        ),
    );
  }

  async fulfill(
    organizationId: string,
    salesOrderId: string,
    userId: string,
    dto:
      FulfillSalesOrderDto,
  ) {
    const uniqueItemIds =
      new Set(
        dto.items.map(
          (item) =>
            item
              .salesOrderItemId,
        ),
      );

    if (
      uniqueItemIds.size !==
      dto.items.length
    ) {
      throw new BadRequestException(
        'Each sales order item may appear only once in a fulfillment request',
      );
    }

    const parsedItems =
      dto.items.map(
        (item) => ({
          salesOrderItemId:
            item
              .salesOrderItemId,

          quantity:
            this.parsePositiveQuantity(
              item.quantity,
            ),
        }),
      );

    const note =
      this.normalizeOptionalText(
        dto.note,
      );

    return this.runSerializableTransaction(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            const salesOrder =
              await tx.salesOrder.findFirst({
                where: {
                  id:
                    salesOrderId,

                  organizationId,
                },

                select: {
                  id: true,
                  number: true,
                  warehouseId: true,
                  status: true,

                  warehouse: {
                    select: {
                      isActive:
                        true,
                    },
                  },

                  items: {
                    select: {
                      id: true,
                      productId: true,
                      orderedQuantity:
                        true,

                      reservedQuantity:
                        true,

                      fulfilledQuantity:
                        true,
                    },
                  },
                },
              });

            if (!salesOrder) {
              throw new NotFoundException(
                'Sales order not found in this organization',
              );
            }

            const fulfillmentStatuses:
              SalesOrderStatus[] = [
                SalesOrderStatus.PARTIALLY_RESERVED,
                SalesOrderStatus.RESERVED,
                SalesOrderStatus.PARTIALLY_FULFILLED,
              ];

            if (
              !fulfillmentStatuses.includes(
                salesOrder.status,
              )
            ) {
              throw new ConflictException(
                'Sales order has no stock available for fulfillment',
              );
            }

            if (
              !salesOrder
                .warehouse
                .isActive
            ) {
              throw new ConflictException(
                'Sales order warehouse is inactive',
              );
            }

            const itemsById =
              new Map(
                salesOrder.items.map(
                  (item) => [
                    item.id,
                    item,
                  ],
                ),
              );

            for (
              const line of
              parsedItems
            ) {
              const item =
                itemsById.get(
                  line
                    .salesOrderItemId,
                );

              if (!item) {
                throw new BadRequestException(
                  'Fulfillment contains an item that does not belong to this sales order',
                );
              }

              if (
                line.quantity.gt(
                  item
                    .reservedQuantity,
                )
              ) {
                throw new ConflictException(
                  'Fulfillment quantity exceeds the currently reserved quantity',
                );
              }
            }

            const fulfillment =
              await tx.salesFulfillment.create({
                data: {
                  salesOrderId:
                    salesOrder.id,

                  warehouseId:
                    salesOrder
                      .warehouseId,

                  fulfilledById:
                    userId,

                  note,
                },

                select: {
                  id: true,
                  createdAt: true,
                },
              });

            for (
              const line of
              parsedItems
            ) {
              const item =
                itemsById.get(
                  line
                    .salesOrderItemId,
                );

              if (!item) {
                throw new BadRequestException(
                  'Sales order item not found',
                );
              }

              const inventory =
                await tx.inventory.findUnique({
                  where: {
                    warehouseId_productId: {
                      warehouseId:
                        salesOrder
                          .warehouseId,

                      productId:
                        item.productId,
                    },
                  },
                });

              if (!inventory) {
                throw new ConflictException(
                  'Inventory reservation is missing',
                );
              }

              if (
                inventory.reservedQuantity.lt(
                  line.quantity,
                ) ||
                inventory.quantity.lt(
                  line.quantity,
                )
              ) {
                throw new ConflictException(
                  'Inventory reservation state is inconsistent',
                );
              }

              await tx.inventory.update({
                where: {
                  warehouseId_productId: {
                    warehouseId:
                      salesOrder
                        .warehouseId,

                    productId:
                      item.productId,
                  },
                },

                data: {
                  quantity: {
                    decrement:
                      line.quantity,
                  },

                  reservedQuantity: {
                    decrement:
                      line.quantity,
                  },
                },
              });

              await tx.salesOrderItem.update({
                where: {
                  id:
                    item.id,
                },

                data: {
                  reservedQuantity: {
                    decrement:
                      line.quantity,
                  },

                  fulfilledQuantity: {
                    increment:
                      line.quantity,
                  },
                },
              });

              await tx.salesFulfillmentItem.create({
                data: {
                  fulfillmentId:
                    fulfillment.id,

                  salesOrderItemId:
                    item.id,

                  quantity:
                    line.quantity,
                },
              });

              await tx.stockMovement.create({
                data: {
                  operationId:
                    fulfillment.id,

                  salesFulfillmentId:
                    fulfillment.id,

                  warehouseId:
                    salesOrder
                      .warehouseId,

                  productId:
                    item.productId,

                  createdById:
                    userId,

                  type:
                    StockMovementType.ISSUE,

                  delta:
                    line
                      .quantity
                      .negated(),

                  note:
                    note
                      ? `SO ${salesOrder.number}: ${note}`
                      : `SO ${salesOrder.number}`,
                },
              });
            }

            const updatedItems =
              await tx.salesOrderItem.findMany({
                where: {
                  salesOrderId:
                    salesOrder.id,
                },

                select: {
                  orderedQuantity:
                    true,

                  fulfilledQuantity:
                    true,
                },
              });

            const fullyFulfilled =
              updatedItems.every(
                (item) =>
                  item
                    .fulfilledQuantity
                    .eq(
                      item
                        .orderedQuantity,
                    ),
              );

            const nextStatus =
              fullyFulfilled
                ? SalesOrderStatus.FULFILLED
                : SalesOrderStatus.PARTIALLY_FULFILLED;

            await tx.salesOrder.update({
              where: {
                id:
                  salesOrder.id,
              },

              data: {
                status:
                  nextStatus,

                fulfilledAt:
                  fullyFulfilled
                    ? new Date()
                    : null,
              },
            });

            return {
              fulfillmentId:
                fulfillment.id,

              salesOrderId:
                salesOrder.id,

              salesOrderNumber:
                salesOrder.number,

              status:
                nextStatus,

              createdAt:
                fulfillment.createdAt,
            };
          },
          {
            isolationLevel:
              Prisma
                .TransactionIsolationLevel
                .Serializable,

            maxWait:
              5_000,

            timeout:
              10_000,
          },
        ),
    );
  }

  async cancel(
    organizationId: string,
    salesOrderId: string,
  ) {
    return this.runSerializableTransaction(
      () =>
        this.prisma.$transaction(
          async (tx) => {
            const salesOrder =
              await tx.salesOrder.findFirst({
                where: {
                  id:
                    salesOrderId,

                  organizationId,
                },

                select: {
                  id: true,
                  warehouseId: true,
                  status: true,

                  items: {
                    select: {
                      id: true,
                      productId: true,
                      reservedQuantity:
                        true,
                    },
                  },
                },
              });

            if (!salesOrder) {
              throw new NotFoundException(
                'Sales order not found in this organization',
              );
            }

            const cancellableStatuses:
              SalesOrderStatus[] = [
                SalesOrderStatus.DRAFT,
                SalesOrderStatus.CONFIRMED,
                SalesOrderStatus.PARTIALLY_RESERVED,
                SalesOrderStatus.RESERVED,
              ];

            if (
              !cancellableStatuses.includes(
                salesOrder.status,
              )
            ) {
              throw new ConflictException(
                'Sales order can no longer be cancelled',
              );
            }

            for (
              const item of
              salesOrder.items
            ) {
              if (
                item
                  .reservedQuantity
                  .isZero()
              ) {
                continue;
              }

              const inventory =
                await tx.inventory.findUnique({
                  where: {
                    warehouseId_productId: {
                      warehouseId:
                        salesOrder
                          .warehouseId,

                      productId:
                        item.productId,
                    },
                  },
                });

              if (!inventory) {
                throw new ConflictException(
                  'Reserved inventory is missing',
                );
              }

              if (
                inventory.reservedQuantity.lt(
                  item.reservedQuantity,
                )
              ) {
                throw new ConflictException(
                  'Inventory reservation state is inconsistent',
                );
              }

              await tx.inventory.update({
                where: {
                  warehouseId_productId: {
                    warehouseId:
                      salesOrder
                        .warehouseId,

                    productId:
                      item.productId,
                  },
                },

                data: {
                  reservedQuantity: {
                    decrement:
                      item
                        .reservedQuantity,
                  },
                },
              });

              await tx.salesOrderItem.update({
                where: {
                  id:
                    item.id,
                },

                data: {
                  reservedQuantity:
                    new Prisma.Decimal(
                      0,
                    ),
                },
              });
            }

            return tx.salesOrder.update({
              where: {
                id:
                  salesOrder.id,
              },

              data: {
                status:
                  SalesOrderStatus.CANCELLED,

                cancelledAt:
                  new Date(),
              },
            });
          },
          {
            isolationLevel:
              Prisma
                .TransactionIsolationLevel
                .Serializable,

            maxWait:
              5_000,

            timeout:
              10_000,
          },
        ),
    );
  }

  private determineReservationStatus(
    items: Array<{
      orderedQuantity:
        Prisma.Decimal;

      reservedQuantity:
        Prisma.Decimal;

      fulfilledQuantity:
        Prisma.Decimal;
    }>,
  ): SalesOrderStatus {
    const hasFulfilled =
      items.some(
        (item) =>
          item
            .fulfilledQuantity
            .gt(0),
      );

    if (hasFulfilled) {
      return SalesOrderStatus.PARTIALLY_FULFILLED;
    }

    const allReserved =
      items.every(
        (item) =>
          item
            .reservedQuantity
            .eq(
              item
                .orderedQuantity,
            ),
      );

    if (allReserved) {
      return SalesOrderStatus.RESERVED;
    }

    return SalesOrderStatus.PARTIALLY_RESERVED;
  }

  private parsePositiveQuantity(
    rawValue: string,
  ): Prisma.Decimal {
    const value =
      new Prisma.Decimal(
        rawValue,
      );

    if (
      value.lte(
        0,
      )
    ) {
      throw new BadRequestException(
        'quantity must be greater than zero',
      );
    }

    return value;
  }

  private parseNonNegativeMoney(
    rawValue: string,
  ): Prisma.Decimal {
    const value =
      new Prisma.Decimal(
        rawValue,
      );

    if (
      value.lt(
        0,
      )
    ) {
      throw new BadRequestException(
        'unitPrice must not be negative',
      );
    }

    return value;
  }

  private normalizeOptionalText(
    value:
      string | undefined,
  ):
    | string
    | undefined {
    const normalized =
      value?.trim();

    return normalized
      ? normalized
      : undefined;
  }

  private generateSalesOrderNumber():
    string {
    const year =
      new Date()
        .getUTCFullYear();

    const suffix =
      randomUUID()
        .replaceAll(
          '-',
          '',
        )
        .slice(
          0,
          8,
        )
        .toUpperCase();

    return `SO-${year}-${suffix}`;
  }

  private async runSerializableTransaction<T>(
    operation:
      () => Promise<T>,
  ): Promise<T> {
    for (
      let attempt = 1;
      attempt <=
      MAX_TRANSACTION_RETRIES;
      attempt += 1
    ) {
      try {
        return await operation();
      } catch (error) {
        const retryable =
          error instanceof
            Prisma.PrismaClientKnownRequestError &&
          error.code ===
            'P2034';

        if (!retryable) {
          throw error;
        }

        if (
          attempt ===
          MAX_TRANSACTION_RETRIES
        ) {
          throw new ConflictException(
            'Sales order was modified concurrently. Please retry.',
          );
        }

        await new Promise(
          (resolve) => {
            setTimeout(
              resolve,
              attempt * 25,
            );
          },
        );
      }
    }

    throw new ConflictException(
      'Sales order operation could not be completed',
    );
  }
}