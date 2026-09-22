import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { PurchaseOrderListItem } from "../types";

export function getPurchaseOrders(
  organizationId: string,
): Promise<PurchaseOrderListItem[]> {
  return authenticatedApiFetch<PurchaseOrderListItem[]>(
    `/organizations/${organizationId}/purchase-orders`,
  );
}
