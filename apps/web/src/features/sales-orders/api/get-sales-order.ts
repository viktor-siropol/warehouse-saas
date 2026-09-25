import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { SalesOrderDetail } from "../types";

export function getSalesOrder(
  organizationId: string,
  salesOrderId: string,
): Promise<SalesOrderDetail> {
  return authenticatedApiFetch<SalesOrderDetail>(
    `/organizations/${organizationId}/sales-orders/${salesOrderId}`,
  );
}
