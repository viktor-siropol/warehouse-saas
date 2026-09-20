"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  ArrowLeftRight,
  Boxes,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Package,
  TriangleAlert,
  Warehouse,
} from "lucide-react";

import { logoutAction } from "@/features/auth/actions";

import type { AuthUser } from "@/features/auth/types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type AppSidebarProps = {
  user: AuthUser;
  organizationId: string;
};

export function AppSidebar({ user, organizationId }: AppSidebarProps) {
  const pathname = usePathname();

  const membership = user.memberships.find(
    (item) => item.organization.id === organizationId,
  );

  if (!membership) {
    return null;
  }

  const navigation = [
    {
      label: "Overview",
      href: `/organizations/${organizationId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Products",
      href: `/organizations/${organizationId}/products`,
      icon: Package,
    },
    {
      label: "Warehouses",
      href: `/organizations/${organizationId}/warehouses`,
      icon: Warehouse,
    },
    {
      label: "Low stock",
      href: `/organizations/${organizationId}/inventory/low-stock`,
      icon: TriangleAlert,
    },
    {
      label: "Movements",
      href: `/organizations/${organizationId}/stock-movements`,
      icon: ArrowLeftRight,
    },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Boxes className="size-4" />
                  </div>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {membership.organization.name}
                    </span>

                    <span className="truncate text-xs text-muted-foreground">
                      {membership.role}
                    </span>
                  </div>

                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                side="right"
                sideOffset={8}
                className="min-w-64"
              >
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>

                <DropdownMenuSeparator />

                {user.memberships.map((item) => (
                  <DropdownMenuItem key={item.id} asChild>
                    <Link href={`/organizations/${item.organization.id}`}>
                      <div className="flex size-7 items-center justify-center rounded-md border bg-background">
                        <Boxes className="size-3.5" />
                      </div>

                      <div className="flex flex-col">
                        <span>{item.organization.name}</span>

                        <span className="text-xs text-muted-foreground">
                          {item.role}
                        </span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <Icon />

                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 pb-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <form action={logoutAction}>
              <SidebarMenuButton type="submit" tooltip="Log out">
                <LogOut />

                <span>Log out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
