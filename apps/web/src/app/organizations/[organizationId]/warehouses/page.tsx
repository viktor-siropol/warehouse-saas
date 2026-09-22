import Link from "next/link";

import { ArrowRight, Warehouse } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getCurrentUser } from "@/features/auth/get-current-user";

import { getWarehouses } from "@/features/warehouses/api/get-warehouses";

import { CreateWarehouseForm } from "@/features/warehouses/components/create-warehouse-form";

import { WarehouseStatusButton } from "@/features/warehouses/components/warehouse-status-button";

type WarehousesPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function WarehousesPage({ params }: WarehousesPageProps) {
  const { organizationId } = await params;

  const [warehouses, user] = await Promise.all([
    getWarehouses(organizationId),

    getCurrentUser(),
  ]);

  const membership = user.memberships.find(
    (item) => item.organization.id === organizationId,
  );

  const canManage = membership !== undefined && membership.role !== "WORKER";

  return (
    <>
      <PageHeader
        title="Warehouses"
        description="Manage physical warehouse locations and access their inventory."
      />

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create warehouse</CardTitle>
          </CardHeader>

          <CardContent>
            <CreateWarehouseForm organizationId={organizationId} />
          </CardContent>
        </Card>
      )}

      {warehouses.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 text-center">
          <Warehouse className="mb-3 size-8 text-muted-foreground" />

          <p className="font-medium">No warehouses yet</p>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create a warehouse to start tracking inventory at a physical
            location.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {warehouse.name}
                    </CardTitle>

                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {warehouse.code}
                    </p>
                  </div>

                  <Badge variant={warehouse.isActive ? "secondary" : "outline"}>
                    {warehouse.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between gap-5">
                <p className="text-sm text-muted-foreground">
                  {warehouse.address ?? "No address provided"}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {warehouse.isActive && (
                    <Button asChild size="sm">
                      <Link
                        href={`/organizations/${organizationId}/warehouses/${warehouse.id}/inventory`}
                      >
                        Open inventory
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  )}

                  {canManage && (
                    <WarehouseStatusButton
                      organizationId={organizationId}
                      warehouseId={warehouse.id}
                      isActive={warehouse.isActive}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
