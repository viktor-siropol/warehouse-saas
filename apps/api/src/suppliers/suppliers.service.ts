import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateSupplierDto } from './dto/create-supplier.dto.js';

import { UpdateSupplierDto } from './dto/update-supplier.dto.js';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.supplier.findMany({
      where: {
        organizationId,
      },

      select: {
        id: true,
        code: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            purchaseOrders: true,
          },
        },
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

  async create(organizationId: string, dto: CreateSupplierDto) {
    try {
      return await this.prisma.supplier.create({
        data: {
          organizationId,

          code: dto.code.trim().toUpperCase(),

          name: dto.name.trim(),

          contactName: this.normalizeOptionalText(dto.contactName),

          email: this.normalizeEmail(dto.email),

          phone: this.normalizeOptionalText(dto.phone),

          address: this.normalizeOptionalText(dto.address),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Supplier with this code already exists');
      }

      throw error;
    }
  }

  async update(
    organizationId: string,
    supplierId: string,
    dto: UpdateSupplierDto,
  ) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id: supplierId,

        organizationId,
      },

      select: {
        id: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found in this organization');
    }

    return this.prisma.supplier.update({
      where: {
        id: supplierId,
      },

      data: {
        ...(dto.name !== undefined
          ? {
              name: dto.name.trim(),
            }
          : {}),

        ...(dto.contactName !== undefined
          ? {
              contactName: this.normalizeOptionalText(dto.contactName),
            }
          : {}),

        ...(dto.email !== undefined
          ? {
              email: this.normalizeEmail(dto.email),
            }
          : {}),

        ...(dto.phone !== undefined
          ? {
              phone: this.normalizeOptionalText(dto.phone),
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

  private normalizeEmail(
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalized = value.trim().toLowerCase();

    return normalized ? normalized : null;
  }
}
