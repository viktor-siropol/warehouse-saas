import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { LowStockItem } from "../types";

export function getLowStock(organizationId: string): Promise<LowStockItem[]> {
  return authenticatedApiFetch<LowStockItem[]>(
    `/organizations/${organizationId}/inventory/low-stock`,
  );
}
