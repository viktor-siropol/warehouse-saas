import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateCustomerDto } from './dto/create-customer.dto.js';

import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.customer.findMany({
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
        shippingAddress: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            salesOrders: true,
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

  async create(organizationId: string, dto: CreateCustomerDto) {
    try {
      return await this.prisma.customer.create({
        data: {
          organizationId,

          code: dto.code.trim().toUpperCase(),

          name: dto.name.trim(),

          contactName: this.normalizeOptionalText(dto.contactName),

          email: this.normalizeEmail(dto.email),

          phone: this.normalizeOptionalText(dto.phone),

          shippingAddress: this.normalizeOptionalText(dto.shippingAddress),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Customer with this code already exists');
      }

      throw error;
    }
  }

  async update(
    organizationId: string,
    customerId: string,
    dto: UpdateCustomerDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,

        organizationId,
      },

      select: {
        id: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    return this.prisma.customer.update({
      where: {
        id: customerId,
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

        ...(dto.shippingAddress !== undefined
          ? {
              shippingAddress: this.normalizeOptionalText(dto.shippingAddress),
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
