import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.category.findMany({
      where: {
        organizationId,
      },

      orderBy: {
        name: 'asc',
      },
    });
  }
}
