import { describe, expect, it, vi } from 'vitest';

import { MembershipRole } from '../generated/prisma/client.js';

import type { PrismaService } from '../prisma/prisma.service.js';

import { OutboxEventProcessorService } from './outbox-event-processor.service.js';

import { OUTBOX_EVENT_TYPE } from './outbox-event.js';

describe('OutboxEventProcessorService', () => {
  it('creates idempotent notifications for matching organization members', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        userId: '11111111-1111-4111-8111-111111111111',
      },

      {
        userId: '22222222-2222-4222-8222-222222222222',
      },
    ]);

    const createMany = vi.fn().mockResolvedValue({
      count: 2,
    });

    const prisma = {
      membership: {
        findMany,
      },

      notification: {
        createMany,
      },
    } as unknown as PrismaService;

    const service = new OutboxEventProcessorService(prisma);

    await service.process({
      id: '33333333-3333-4333-8333-333333333333',

      organizationId: '44444444-4444-4444-8444-444444444444',

      eventType: OUTBOX_EVENT_TYPE.SALES_ORDER_CONFIRMED,

      aggregateType: 'SalesOrder',

      aggregateId: '55555555-5555-4555-8555-555555555555',

      payload: {
        number: 'SO-TEST-001',
      },

      attempts: 1,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        organizationId: '44444444-4444-4444-8444-444444444444',

        role: {
          in: [
            MembershipRole.OWNER,
            MembershipRole.ADMIN,
            MembershipRole.MANAGER,
            MembershipRole.WORKER,
          ],
        },
      },

      select: {
        userId: true,
      },
    });

    expect(createMany).toHaveBeenCalledTimes(1);

    const call = createMany.mock.calls[0]?.[0];

    expect(call?.skipDuplicates).toBe(true);

    expect(call?.data).toHaveLength(2);

    expect(call?.data[0]).toMatchObject({
      organizationId: '44444444-4444-4444-8444-444444444444',

      recipientUserId: '11111111-1111-4111-8111-111111111111',

      outboxEventId: '33333333-3333-4333-8333-333333333333',

      title: 'Sales order confirmed',

      message: 'SO-TEST-001 is ready for reservation and fulfillment.',
    });
  });

  it('fails unknown event types instead of silently discarding them', async () => {
    const prisma = {
      membership: {
        findMany: vi.fn(),
      },

      notification: {
        createMany: vi.fn(),
      },
    } as unknown as PrismaService;

    const service = new OutboxEventProcessorService(prisma);

    await expect(
      service.process({
        id: '33333333-3333-4333-8333-333333333333',

        organizationId: '44444444-4444-4444-8444-444444444444',

        eventType: 'UNKNOWN.EVENT',

        aggregateType: 'Unknown',

        aggregateId: null,

        payload: {},

        attempts: 1,
      }),
    ).rejects.toThrow('Unsupported outbox event type: UNKNOWN.EVENT');
  });
});
