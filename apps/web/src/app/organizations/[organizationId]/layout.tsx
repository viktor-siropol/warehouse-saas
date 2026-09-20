import { redirect } from "next/navigation";

import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";

import { AppSidebar } from "@/components/layout/app-sidebar";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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

  const membership = user.memberships.find(
    (item) => item.organization.id === organizationId,
  );

  if (!membership) {
    redirect("/organizations");
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} organizationId={organizationId} />

      <SidebarInset>
        <AppHeader
          organizationName={membership.organization.name}
          role={membership.role}
        />

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
