import { redirect } from "next/navigation";

import type { ReactNode } from "react";

import { getCurrentUser } from "@/features/auth/get-current-user";

type OrganizationLayoutProps = {
  children: ReactNode;

  params: Promise<{
    organizationId: string;
  }>;
};

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const { organizationId } = await params;

  const user = await getCurrentUser();

  const hasMembership = user.memberships.some(
    (membership) => membership.organization.id === organizationId,
  );

  if (!hasMembership) {
    redirect("/organizations");
  }

  return children;
}
