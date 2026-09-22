import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { Supplier } from "../types";

export function getSuppliers(organizationId: string): Promise<Supplier[]> {
  return authenticatedApiFetch<Supplier[]>(
    `/organizations/${organizationId}/suppliers`,
  );
}
