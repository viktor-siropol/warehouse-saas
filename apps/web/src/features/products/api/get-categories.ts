import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { Category } from "../types";

export function getCategories(organizationId: string): Promise<Category[]> {
  return authenticatedApiFetch<Category[]>(
    `/organizations/${organizationId}/categories`,
  );
}
