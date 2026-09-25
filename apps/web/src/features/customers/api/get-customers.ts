import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { Customer } from "../types";

export function getCustomers(organizationId: string): Promise<Customer[]> {
  return authenticatedApiFetch<Customer[]>(
    `/organizations/${organizationId}/customers`,
  );
}
