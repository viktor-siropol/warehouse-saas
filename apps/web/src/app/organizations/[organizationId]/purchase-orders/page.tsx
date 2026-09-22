import Link from "next/link";

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

import { getPurchaseOrders } from "@/features/purchase-orders/api/get-purchase-orders";

import { CreatePurchaseOrderForm } from "@/features/purchase-orders/components/create-purchase-order-form";

import { getSuppliers } from "@/features/suppliers/api/get-suppliers";

import { getWarehouses } from "@/features/warehouses/api/get-warehouses";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function PurchaseOrdersPage({ params }: Props) {
  const { organizationId } = await params;

  const [purchaseOrders, suppliers, warehouses, user] = await Promise.all([
    getPurchaseOrders(organizationId),

    getSuppliers(organizationId),

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
        title="Purchase orders"
        description="Create procurement orders and track receiving progress."
      />

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New purchase order</CardTitle>
          </CardHeader>

          <CardContent>
            <CreatePurchaseOrderForm
              organizationId={organizationId}
              suppliers={suppliers}
              warehouses={warehouses}
            />
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>

              <TableHead>Supplier</TableHead>

              <TableHead>Warehouse</TableHead>

              <TableHead>Items</TableHead>

              <TableHead>Receipts</TableHead>

              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {purchaseOrders.map((purchaseOrder) => (
              <TableRow key={purchaseOrder.id}>
                <TableCell>
                  <Link
                    href={`/organizations/${organizationId}/purchase-orders/${purchaseOrder.id}`}
                    className="font-mono text-xs font-medium hover:underline"
                  >
                    {purchaseOrder.number}
                  </Link>
                </TableCell>

                <TableCell>{purchaseOrder.supplier.name}</TableCell>

                <TableCell>{purchaseOrder.warehouse.code}</TableCell>

                <TableCell>{purchaseOrder._count.items}</TableCell>

                <TableCell>{purchaseOrder._count.receipts}</TableCell>

                <TableCell>
                  <Badge variant="outline">{purchaseOrder.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
