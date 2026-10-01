import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { NotificationPage } from "../types";

export function getNotifications(
  organizationId: string,

  limit: number = 50,
): Promise<NotificationPage> {
  return authenticatedApiFetch<NotificationPage>(
    `/organizations/${organizationId}/notifications?limit=${limit}`,
  );
}
