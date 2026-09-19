import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.warehouse.findMany({
      where: {
        organizationId,
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        isActive: true,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }
}
