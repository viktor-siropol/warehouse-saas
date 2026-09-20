import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { StockMovement } from "../types";

export function getStockMovements(
  organizationId: string,
): Promise<StockMovement[]> {
  return authenticatedApiFetch<StockMovement[]>(
    `/organizations/${organizationId}/stock-movements?limit=50`,
  );
}
