import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateWarehouseDto } from './dto/create-warehouse.dto.js';

import { UpdateWarehouseDto } from './dto/update-warehouse.dto.js';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.warehouse.findMany({
      where: {
        organizationId,
      },

      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },

      orderBy: [
        {
          isActive: 'desc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async create(organizationId: string, dto: CreateWarehouseDto) {
    const name = dto.name.trim();

    const code = dto.code.trim().toUpperCase();

    const address = this.normalizeOptionalText(dto.address);

    try {
      return await this.prisma.warehouse.create({
        data: {
          organizationId,
          name,
          code,
          address,
        },

        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Warehouse with this code already exists');
      }

      throw error;
    }
  }

  async update(
    organizationId: string,
    warehouseId: string,
    dto: UpdateWarehouseDto,
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        organizationId,
      },

      select: {
        id: true,
        isActive: true,
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found in this organization');
    }

    if (dto.isActive === false && warehouse.isActive) {
      const inventoryWithStock = await this.prisma.inventory.findFirst({
        where: {
          warehouseId,

          quantity: {
            gt: new Prisma.Decimal(0),
          },
        },

        select: {
          productId: true,
        },
      });

      if (inventoryWithStock) {
        throw new ConflictException(
          'Warehouse cannot be deactivated while it contains stock',
        );
      }
    }

    return this.prisma.warehouse.update({
      where: {
        id: warehouseId,
      },

      data: {
        ...(dto.name !== undefined
          ? {
              name: dto.name.trim(),
            }
          : {}),

        ...(dto.address !== undefined
          ? {
              address: this.normalizeOptionalText(dto.address),
            }
          : {}),

        ...(dto.isActive !== undefined
          ? {
              isActive: dto.isActive,
            }
          : {}),
      },

      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalized = value.trim();

    return normalized ? normalized : null;
  }
}
