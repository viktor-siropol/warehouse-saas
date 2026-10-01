import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { NotificationQueryDto } from './dto/notification-query.dto.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(
    organizationId: string,

    userId: string,

    query: NotificationQueryDto,
  ) {
    const where: Prisma.NotificationWhereInput = {
      organizationId,

      recipientUserId: userId,

      ...(query.unreadOnly === 'true'
        ? {
            readAt: null,
          }
        : {}),
    };

    const [rows, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,

        select: {
          id: true,
          kind: true,
          title: true,
          message: true,
          readAt: true,
          createdAt: true,
          outboxEventId: true,

          outboxEvent: {
            select: {
              eventType: true,
              aggregateType: true,
              aggregateId: true,
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
      }),

      this.prisma.notification.count({
        where: {
          organizationId,

          recipientUserId: userId,

          readAt: null,
        },
      }),
    ]);

    const hasMore = rows.length > query.limit;

    const items = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items,

      unreadCount,

      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
    };
  }

  async markRead(
    organizationId: string,

    userId: string,

    notificationId: string,
  ) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,

        organizationId,

        recipientUserId: userId,
      },

      select: {
        id: true,
        readAt: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.readAt) {
      return this.prisma.notification.findUniqueOrThrow({
        where: {
          id: notification.id,
        },

        select: {
          id: true,
          kind: true,
          title: true,
          message: true,
          readAt: true,
          createdAt: true,
          outboxEventId: true,
        },
      });
    }

    return this.prisma.notification.update({
      where: {
        id: notification.id,
      },

      data: {
        readAt: new Date(),
      },

      select: {
        id: true,
        kind: true,
        title: true,
        message: true,
        readAt: true,
        createdAt: true,
        outboxEventId: true,
      },
    });
  }

  async markAllRead(
    organizationId: string,

    userId: string,
  ) {
    const result = await this.prisma.notification.updateMany({
      where: {
        organizationId,

        recipientUserId: userId,

        readAt: null,
      },

      data: {
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }
}
