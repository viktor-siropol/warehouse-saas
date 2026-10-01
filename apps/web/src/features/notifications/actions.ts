"use server";

import { revalidatePath } from "next/cache";

import { authenticatedApiFetch } from "@/lib/api/server-api";

export async function markNotificationReadAction(
  organizationId: string,

  notificationId: string,
): Promise<void> {
  await authenticatedApiFetch(
    `/organizations/${organizationId}/notifications/${notificationId}/read`,
    {
      method: "POST",
    },
  );

  revalidatePath(`/organizations/${organizationId}/notifications`);
}

export async function markAllNotificationsReadAction(
  organizationId: string,
): Promise<void> {
  await authenticatedApiFetch(
    `/organizations/${organizationId}/notifications/read-all`,
    {
      method: "POST",
    },
  );

  revalidatePath(`/organizations/${organizationId}/notifications`);
}
