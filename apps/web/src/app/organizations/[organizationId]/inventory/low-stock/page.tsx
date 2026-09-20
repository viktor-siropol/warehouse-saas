import Link from "next/link";

import { TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getLowStock } from "@/features/inventory/api/get-low-stock";

type LowStockPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function LowStockPage({ params }: LowStockPageProps) {
  const { organizationId } = await params;

  const items = await getLowStock(organizationId);

  return (
    <>
      <PageHeader
        title="Low stock"
        description="Products that reached or dropped below their configured reorder point."
      />

      {items.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 text-center">
          <TriangleAlert className="mb-3 size-8 text-muted-foreground" />

          <p className="font-medium">Inventory levels are healthy</p>

          <p className="mt-1 text-sm text-muted-foreground">
            No configured inventory item is currently below its reorder point.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>

                <TableHead>SKU</TableHead>

                <TableHead>Product</TableHead>

                <TableHead className="text-right">Quantity</TableHead>

                <TableHead className="text-right">Reorder point</TableHead>

                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((item) => (
                <TableRow key={`${item.warehouse.id}:${item.product.id}`}>
                  <TableCell>
                    <Link
                      href={`/organizations/${organizationId}/warehouses/${item.warehouse.id}/inventory`}
                      className="font-medium hover:underline"
                    >
                      {item.warehouse.code}
                    </Link>
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    {item.product.sku}
                  </TableCell>

                  <TableCell>{item.product.name}</TableCell>

                  <TableCell className="text-right font-mono">
                    {item.quantity}
                  </TableCell>

                  <TableCell className="text-right font-mono">
                    {item.reorderPoint}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-warning/30 bg-warning/10 text-warning"
                    >
                      Low stock
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
