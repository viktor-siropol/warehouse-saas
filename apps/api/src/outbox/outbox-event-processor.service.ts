import { Injectable } from '@nestjs/common';

import {
  MembershipRole,
  NotificationKind,
  Prisma,
} from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { OUTBOX_EVENT_TYPE } from './outbox-event.js';

type ClaimedOutboxEvent = {
  id: string;

  organizationId: string;

  eventType: string;

  aggregateType: string;

  aggregateId: string | null;

  payload: Prisma.JsonValue;

  attempts: number;
};

type NotificationDefinition = {
  kind: NotificationKind;

  title: string;

  message: string;

  roles: MembershipRole[];
};

@Injectable()
export class OutboxEventProcessorService {
  constructor(private readonly prisma: PrismaService) {}

  async process(event: ClaimedOutboxEvent): Promise<void> {
    const definition = this.createNotificationDefinition(event);

    const memberships = await this.prisma.membership.findMany({
      where: {
        organizationId: event.organizationId,

        role: {
          in: definition.roles,
        },
      },

      select: {
        userId: true,
      },
    });

    if (memberships.length === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: memberships.map((membership) => ({
        organizationId: event.organizationId,

        recipientUserId: membership.userId,

        outboxEventId: event.id,

        kind: definition.kind,

        title: definition.title,

        message: definition.message,
      })),

      skipDuplicates: true,
    });
  }

  private createNotificationDefinition(
    event: ClaimedOutboxEvent,
  ): NotificationDefinition {
    const number =
      this.readString(event.payload, 'number') ??
      event.aggregateId ??
      'Unknown';

    switch (event.eventType) {
      case OUTBOX_EVENT_TYPE.PURCHASE_ORDER_SUBMITTED:
        return {
          kind: NotificationKind.INFO,

          title: 'Purchase order submitted',

          message: `${number} is ready for warehouse receiving.`,

          roles: [
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.MANAGER,
            MembershipRole.WORKER,
          ],
        };

      case OUTBOX_EVENT_TYPE.PURCHASE_ORDER_RECEIVED:
        return {
          kind: NotificationKind.SUCCESS,

          title: 'Purchase order received',

          message: `${number} has been received into inventory.`,

          roles: [
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.MANAGER,
          ],
        };

      case OUTBOX_EVENT_TYPE.PURCHASE_ORDER_CANCELLED:
        return {
          kind: NotificationKind.WARNING,

          title: 'Purchase order cancelled',

          message: `${number} has been cancelled.`,

          roles: [
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.MANAGER,
            MembershipRole.WORKER,
          ],
        };

      case OUTBOX_EVENT_TYPE.SALES_ORDER_CONFIRMED:
        return {
          kind: NotificationKind.INFO,

          title: 'Sales order confirmed',

          message: `${number} is ready for reservation and fulfillment.`,

          roles: [
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.MANAGER,
            MembershipRole.WORKER,
          ],
        };

      case OUTBOX_EVENT_TYPE.SALES_ORDER_RESERVED:
        return {
          kind: NotificationKind.INFO,

          title: 'Sales order stock reserved',

          message: `Stock has been reserved for ${number}.`,

          roles: [
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.MANAGER,
            MembershipRole.WORKER,
          ],
        };

      case OUTBOX_EVENT_TYPE.SALES_ORDER_FULFILLED:
        return {
          kind: NotificationKind.SUCCESS,

          title: 'Sales order fulfilled',

          message: `${number} has been fulfilled.`,

          roles: [
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.MANAGER,
          ],
        };

      case OUTBOX_EVENT_TYPE.SALES_ORDER_CANCELLED:
        return {
          kind: NotificationKind.WARNING,

          title: 'Sales order cancelled',

          message: `${number} has been cancelled.`,

          roles: [
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.MANAGER,
            MembershipRole.WORKER,
          ],
        };

      default:
        throw new Error(`Unsupported outbox event type: ${event.eventType}`);
    }
  }

  private readString(
    payload: Prisma.JsonValue,

    key: string,
  ): string | null {
    if (
      payload === null ||
      Array.isArray(payload) ||
      typeof payload !== 'object'
    ) {
      return null;
    }

    const value = (payload as Record<string, Prisma.JsonValue>)[key];

    return typeof value === 'string' ? value : null;
  }
}
