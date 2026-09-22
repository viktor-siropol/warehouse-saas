import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { PurchaseOrderDetail } from "../types";

export function getPurchaseOrder(
  organizationId: string,

  purchaseOrderId: string,
): Promise<PurchaseOrderDetail> {
  return authenticatedApiFetch<PurchaseOrderDetail>(
    `/organizations/${organizationId}/purchase-orders/${purchaseOrderId}`,
  );
}
