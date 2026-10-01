import { Prisma } from '../generated/prisma/client.js';

export const OUTBOX_EVENT_TYPE = {
  PURCHASE_ORDER_SUBMITTED: 'PURCHASE_ORDER.SUBMITTED',

  PURCHASE_ORDER_RECEIVED: 'PURCHASE_ORDER.RECEIVED',

  PURCHASE_ORDER_CANCELLED: 'PURCHASE_ORDER.CANCELLED',

  SALES_ORDER_CONFIRMED: 'SALES_ORDER.CONFIRMED',

  SALES_ORDER_RESERVED: 'SALES_ORDER.RESERVED',

  SALES_ORDER_FULFILLED: 'SALES_ORDER.FULFILLED',

  SALES_ORDER_CANCELLED: 'SALES_ORDER.CANCELLED',
} as const;

export const OUTBOX_AGGREGATE_TYPE = {
  PURCHASE_ORDER: 'PurchaseOrder',

  SALES_ORDER: 'SalesOrder',
} as const;

export type OutboxEventType =
  (typeof OUTBOX_EVENT_TYPE)[keyof typeof OUTBOX_EVENT_TYPE];

export type OutboxAggregateType =
  (typeof OUTBOX_AGGREGATE_TYPE)[keyof typeof OUTBOX_AGGREGATE_TYPE];

type CreateOutboxEventDataInput = {
  organizationId: string;

  eventType: OutboxEventType;

  aggregateType: OutboxAggregateType;

  aggregateId: string;

  payload: Prisma.InputJsonValue;
};

export function createOutboxEventData(
  input: CreateOutboxEventDataInput,
): Prisma.OutboxEventUncheckedCreateInput {
  return {
    organizationId: input.organizationId,

    eventType: input.eventType,

    aggregateType: input.aggregateType,

    aggregateId: input.aggregateId,

    payload: input.payload,
  };
}
