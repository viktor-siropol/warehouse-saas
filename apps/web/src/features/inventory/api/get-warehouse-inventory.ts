import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { WarehouseInventory } from "../types";

export function getWarehouseInventory(
  organizationId: string,
  warehouseId: string,
): Promise<WarehouseInventory> {
  return authenticatedApiFetch<WarehouseInventory>(
    `/organizations/${organizationId}/warehouses/${warehouseId}/inventory`,
  );
}
