import { Injectable } from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { AuditLogQueryDto } from './dto/audit-log-query.dto.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    organizationId: string,

    query: AuditLogQueryDto,
  ) {
    const where: Prisma.AuditLogWhereInput = {
      organizationId,

      ...(query.action
        ? {
            action: query.action,
          }
        : {}),

      ...(query.entityType
        ? {
            entityType: query.entityType,
          }
        : {}),
    };

    const rows = await this.prisma.auditLog.findMany({
      where,

      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
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

      orderBy: [
        {
          createdAt: 'desc',
        },

        {
          id: 'desc',
        },
      ],

      take: query.limit + 1,

      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },

            skip: 1,
          }
        : {}),
    });

    const hasMore = rows.length > query.limit;

    const items = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items,

      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
    };
  }
}
