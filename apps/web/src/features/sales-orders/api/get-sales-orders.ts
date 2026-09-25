import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { SalesOrderListItem } from "../types";

export function getSalesOrders(
  organizationId: string,
): Promise<SalesOrderListItem[]> {
  return authenticatedApiFetch<SalesOrderListItem[]>(
    `/organizations/${organizationId}/sales-orders`,
  );
}
