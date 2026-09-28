import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { AuditLogPage } from "../types";

export function getAuditLogs(
  organizationId: string,

  limit: number = 100,
): Promise<AuditLogPage> {
  return authenticatedApiFetch<AuditLogPage>(
    `/organizations/${organizationId}/audit-logs?limit=${limit}`,
  );
}
