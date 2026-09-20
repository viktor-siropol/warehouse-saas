import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { Warehouse } from "../types";

export function getWarehouses(organizationId: string): Promise<Warehouse[]> {
  return authenticatedApiFetch<Warehouse[]>(
    `/organizations/${organizationId}/warehouses`,
  );
}
