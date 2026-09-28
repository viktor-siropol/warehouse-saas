import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { DashboardSummary } from "../types";

export function getDashboard(
  organizationId: string,
): Promise<DashboardSummary> {
  return authenticatedApiFetch<DashboardSummary>(
    `/organizations/${organizationId}/dashboard`,
  );
}
