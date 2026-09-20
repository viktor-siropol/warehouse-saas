import Link from "next/link";

import {
  ArrowLeftRight,
  Package,
  TriangleAlert,
  Warehouse,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getLowStock } from "@/features/inventory/api/get-low-stock";

import { getStockMovements } from "@/features/inventory/api/get-stock-movements";

import { getProducts } from "@/features/products/api/get-products";

import { getWarehouses } from "@/features/warehouses/api/get-warehouses";

type OrganizationPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { organizationId } = await params;

  const [products, warehouses, lowStock, movements] = await Promise.all([
    getProducts(organizationId),

    getWarehouses(organizationId),

    getLowStock(organizationId),

    getStockMovements(organizationId),
  ]);

  const activeWarehouses = warehouses.filter(
    (warehouse) => warehouse.isActive,
  ).length;

  const metrics = [
    {
      label: "Products",
      value: products.length,
      icon: Package,
      href: `/organizations/${organizationId}/products`,
    },
    {
      label: "Active warehouses",
      value: activeWarehouses,
      icon: Warehouse,
      href: `/organizations/${organizationId}/warehouses`,
    },
    {
      label: "Low stock",
      value: lowStock.length,
      icon: TriangleAlert,
      href: `/organizations/${organizationId}/inventory/low-stock`,
    },
    {
      label: "Recent movements",
      value: movements.length,
      icon: ArrowLeftRight,
      href: `/organizations/${organizationId}/stock-movements`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="Monitor your warehouse operations and current inventory state."
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
                  <div className="text-3xl font-semibold tracking-tight">
                    {metric.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>

            <CardDescription>
              Inventory items at or below their reorder point.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All configured inventory levels are healthy.
              </p>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 5).map((item) => (
                  <div
                    key={`${item.warehouse.id}:${item.product.id}`}
                    className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.product.name}
                      </p>

                      <p className="truncate text-xs text-muted-foreground">
                        {item.warehouse.code}
                        {" · "}
                        {item.product.sku}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-warning">
                        {item.quantity}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        reorder {item.reorderPoint}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>

            <CardDescription>
              Latest inventory movements across your organization.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stock movements yet.
              </p>
            ) : (
              <div className="space-y-3">
                {movements.slice(0, 5).map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {movement.product.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {movement.type}
                        {" · "}
                        {movement.warehouse.code}
                      </p>
                    </div>

                    <p className="font-mono text-sm font-medium">
                      {movement.delta}
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
