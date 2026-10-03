import { Prisma } from '../generated/prisma/client.js';

export const AUDIT_ACTION = {
  INVENTORY_RECEIVED: 'INVENTORY_RECEIVED',

  INVENTORY_ISSUED: 'INVENTORY_ISSUED',

  INVENTORY_ADJUSTED: 'INVENTORY_ADJUSTED',

  INVENTORY_TRANSFERRED: 'INVENTORY_TRANSFERRED',

  PURCHASE_ORDER_SUBMITTED: 'PURCHASE_ORDER_SUBMITTED',

  PURCHASE_ORDER_CANCELLED: 'PURCHASE_ORDER_CANCELLED',

  PURCHASE_ORDER_RECEIVED: 'PURCHASE_ORDER_RECEIVED',

  SALES_ORDER_CONFIRMED: 'SALES_ORDER_CONFIRMED',

  SALES_ORDER_RESERVED: 'SALES_ORDER_RESERVED',

  SALES_ORDER_FULFILLED: 'SALES_ORDER_FULFILLED',

  SALES_ORDER_CANCELLED: 'SALES_ORDER_CANCELLED',

  DATA_JOB_CREATED: 'DATA_JOB_CREATED',

  PRODUCT_IMPORT_COMPLETED: 'PRODUCT_IMPORT_COMPLETED',

  PRODUCT_EXPORT_COMPLETED: 'PRODUCT_EXPORT_COMPLETED',

  DATA_JOB_FAILED: 'DATA_JOB_FAILED',
} as const;

export const AUDIT_ENTITY_TYPE = {
  INVENTORY_OPERATION: 'InventoryOperation',

  PURCHASE_ORDER: 'PurchaseOrder',

  SALES_ORDER: 'SalesOrder',

  DATA_JOB: 'DATA_JOB',
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

export type AuditEntityType =
  (typeof AUDIT_ENTITY_TYPE)[keyof typeof AUDIT_ENTITY_TYPE];

type CreateAuditLogDataInput = {
  organizationId: string;

  actorUserId: string | null;

  action: AuditAction;

  entityType: AuditEntityType;

  entityId?: string | null;

  metadata?: Prisma.InputJsonValue;
};

export function createAuditLogData(
  input: CreateAuditLogDataInput,
): Prisma.AuditLogUncheckedCreateInput {
  return {
    organizationId: input.organizationId,

    actorUserId: input.actorUserId,

    action: input.action,

    entityType: input.entityType,

    entityId: input.entityId ?? null,

    ...(input.metadata !== undefined
      ? {
          metadata: input.metadata,
        }
      : {}),
  };
}
