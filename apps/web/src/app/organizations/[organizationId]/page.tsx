import Link from "next/link";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  Package,
  TriangleAlert,
  Warehouse,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getDashboard } from "@/features/analytics/api/get-dashboard";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function OrganizationPage({ params }: Props) {
  const { organizationId } = await params;

  const dashboard = await getDashboard(organizationId);

  const metrics = [
    {
      label: "Active products",

      value: dashboard.catalog.activeProducts,

      icon: Package,

      href: `/organizations/${organizationId}/products`,
    },

    {
      label: "Warehouses",

      value: dashboard.catalog.activeWarehouses,

      icon: Warehouse,

      href: `/organizations/${organizationId}/warehouses`,
    },

    {
      label: "Available stock",

      value: dashboard.inventory.available,

      icon: Boxes,

      href: `/organizations/${organizationId}/warehouses`,
    },

    {
      label: "Reserved",

      value: dashboard.inventory.reserved,

      icon: ClipboardList,

      href: `/organizations/${organizationId}/sales-orders`,
    },

    {
      label: "Low stock",

      value: dashboard.inventory.lowStockPositions,

      icon: TriangleAlert,

      href: `/organizations/${organizationId}/inventory/low-stock`,
    },

    {
      label: "Open purchase orders",

      value: dashboard.orders.openPurchaseOrders,

      icon: ArrowDownToLine,

      href: `/organizations/${organizationId}/purchase-orders`,
    },

    {
      label: "Open sales orders",

      value: dashboard.orders.openSalesOrders,

      icon: ArrowUpFromLine,

      href: `/organizations/${organizationId}/sales-orders`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="Operational snapshot of inventory, procurement and sales."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Link key={metric.label} href={metric.href}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </CardTitle>

                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>

                <CardContent>
                  <p className="text-2xl font-semibold tracking-tight">
                    {metric.value}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent stock movements</CardTitle>

            <CardDescription>
              Latest physical changes to warehouse inventory.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {dashboard.recentMovements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stock movements yet.
              </p>
            ) : (
              <div className="space-y-3">
                {dashboard.recentMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {movement.product.name}
                      </p>

                      <p className="font-mono text-xs text-muted-foreground">
                        {movement.warehouse.code}
                        {" · "}
                        {movement.type}
                      </p>
                    </div>

                    <Badge variant="outline">{movement.delta}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent audit activity</CardTitle>

            <CardDescription>
              Important operational actions recorded by the system.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {dashboard.recentAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No audit events recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {dashboard.recentAudit.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-b pb-3 last:border-0 last:pb-0"
                  >
                    <p className="text-sm font-medium">{entry.action}</p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.actorUser?.email ?? "System"}
                      {" · "}
                      {entry.entityType}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
