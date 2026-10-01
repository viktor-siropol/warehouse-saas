import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { OutboxJobQueryDto } from './dto/outbox-job-query.dto.js';

@Injectable()
export class BackgroundJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOutboxJobs(
    organizationId: string,

    query: OutboxJobQueryDto,
  ) {
    const where: Prisma.OutboxEventWhereInput = {
      organizationId,

      ...(query.status
        ? {
            status: query.status,
          }
        : {}),
    };

    const [rows, statusCounts] = await Promise.all([
      this.prisma.outboxEvent.findMany({
        where,

        select: {
          id: true,
          eventType: true,
          aggregateType: true,
          aggregateId: true,
          status: true,
          attempts: true,
          availableAt: true,
          lockedAt: true,
          lockedBy: true,
          processedAt: true,
          lastError: true,
          createdAt: true,
          updatedAt: true,
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
      }),

      this.prisma.outboxEvent.groupBy({
        by: ['status'],

        where: {
          organizationId,
        },

        _count: {
          _all: true,
        },
      }),
    ]);

    const hasMore = rows.length > query.limit;

    const items = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items,

      statusCounts: statusCounts.map((item) => ({
        status: item.status,

        count: item._count._all,
      })),

      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
    };
  }

  async findOne(
    organizationId: string,

    eventId: string,
  ) {
    const event = await this.prisma.outboxEvent.findFirst({
      where: {
        id: eventId,

        organizationId,
      },

      select: {
        id: true,
        eventType: true,
        aggregateType: true,
        aggregateId: true,
        payload: true,
        status: true,
        attempts: true,
        availableAt: true,
        lockedAt: true,
        lockedBy: true,
        processedAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Outbox event not found');
    }

    return event;
  }
}
