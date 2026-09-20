import { PageHeader } from "@/components/layout/page-header";

import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getCurrentUser } from "@/features/auth/get-current-user";

import { getWarehouseInventory } from "@/features/inventory/api/get-warehouse-inventory";

import { ReorderPointForm } from "@/features/inventory/components/reorder-point-form";

import { StockOperationForms } from "@/features/inventory/components/stock-operation-forms";

import { getWarehouses } from "@/features/warehouses/api/get-warehouses";

type InventoryPageProps = {
  params: Promise<{
    organizationId: string;

    warehouseId: string;
  }>;
};

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { organizationId, warehouseId } = await params;

  const [inventory, warehouses, user] = await Promise.all([
    getWarehouseInventory(organizationId, warehouseId),

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
        title={inventory.warehouse.name}
        description={`${inventory.warehouse.code} · Inventory operations and stock levels`}
        actions={<Badge variant="secondary">Active warehouse</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock operations</CardTitle>
        </CardHeader>

        <CardContent>
          <StockOperationForms
            organizationId={organizationId}
            warehouseId={warehouseId}
            items={inventory.items}
            warehouses={warehouses}
            canAdjust={canManage}
          />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Inventory</h2>

          <p className="text-sm text-muted-foreground">
            Current product quantities and reorder thresholds.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>

                <TableHead>Product</TableHead>

                <TableHead>Category</TableHead>

                <TableHead className="text-right">Quantity</TableHead>

                <TableHead className="w-56">Reorder point</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {inventory.items.map((item) => {
                const lowStock =
                  Number(item.reorderPoint) > 0 &&
                  Number(item.quantity) <= Number(item.reorderPoint);

                return (
                  <TableRow key={item.product.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {item.product.sku}
                    </TableCell>

                    <TableCell className="font-medium">
                      {item.product.name}
                    </TableCell>

                    <TableCell>{item.product.category.name}</TableCell>

                    <TableCell className="text-right font-mono">
                      <div className="flex items-center justify-end gap-2">
                        {item.quantity}

                        {lowStock && (
                          <Badge
                            variant="outline"
                            className="border-warning/30 bg-warning/10 text-warning"
                          >
                            Low
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {canManage ? (
                        <ReorderPointForm
                          organizationId={organizationId}
                          warehouseId={warehouseId}
                          productId={item.product.id}
                          currentValue={item.reorderPoint}
                        />
                      ) : (
                        <span className="font-mono">{item.reorderPoint}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}
