import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { OutboxJobsPage } from "../types";

export function getBackgroundJobs(
  organizationId: string,

  limit: number = 50,
): Promise<OutboxJobsPage> {
  return authenticatedApiFetch<OutboxJobsPage>(
    `/organizations/${organizationId}/background-jobs/outbox?limit=${limit}`,
  );
}
