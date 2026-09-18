import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { Product } from "../types";

export function getProducts(organizationId: string): Promise<Product[]> {
  return authenticatedApiFetch<Product[]>(
    `/organizations/${organizationId}/products`,
  );
}
