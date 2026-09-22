import { PageHeader } from "@/components/layout/page-header";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

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

import {
  cancelPurchaseOrderAction,
  submitPurchaseOrderAction,
} from "@/features/purchase-orders/actions";

import { getPurchaseOrder } from "@/features/purchase-orders/api/get-purchase-order";

import { AddPurchaseOrderItemForm } from "@/features/purchase-orders/components/add-purchase-order-item-form";

import { ReceivePurchaseOrderForm } from "@/features/purchase-orders/components/receive-purchase-order-form";

import { getProducts } from "@/features/products/api/get-products";

type Props = {
  params: Promise<{
    organizationId: string;

    purchaseOrderId: string;
  }>;
};

export default async function PurchaseOrderPage({ params }: Props) {
  const { organizationId, purchaseOrderId } = await params;

  const [purchaseOrder, products, user] = await Promise.all([
    getPurchaseOrder(organizationId, purchaseOrderId),

    getProducts(organizationId),

    getCurrentUser(),
  ]);

  const membership = user.memberships.find(
    (item) => item.organization.id === organizationId,
  );

  const canManage = membership !== undefined && membership.role !== "WORKER";

  const canReceive =
    purchaseOrder.status === "SUBMITTED" ||
    purchaseOrder.status === "PARTIALLY_RECEIVED";

  return (
    <>
      <PageHeader
        title={purchaseOrder.number}
        description={`${purchaseOrder.supplier.name} · ${purchaseOrder.warehouse.code}`}
        actions={<Badge variant="outline">{purchaseOrder.status}</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Supplier</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="font-medium">{purchaseOrder.supplier.name}</p>

            <p className="font-mono text-xs text-muted-foreground">
              {purchaseOrder.supplier.code}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Destination</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="font-medium">{purchaseOrder.warehouse.name}</p>

            <p className="font-mono text-xs text-muted-foreground">
              {purchaseOrder.warehouse.code}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Currency</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="font-mono font-medium">{purchaseOrder.currency}</p>
          </CardContent>
        </Card>
      </div>

      {purchaseOrder.status === "DRAFT" && canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add item</CardTitle>
          </CardHeader>

          <CardContent>
            <AddPurchaseOrderItemForm
              organizationId={organizationId}
              purchaseOrderId={purchaseOrderId}
              products={products}
            />
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>

              <TableHead>Product</TableHead>

              <TableHead className="text-right">Ordered</TableHead>

              <TableHead className="text-right">Received</TableHead>

              <TableHead className="text-right">Remaining</TableHead>

              <TableHead className="text-right">Unit cost</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {purchaseOrder.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">
                  {item.product.sku}
                </TableCell>

                <TableCell className="font-medium">
                  {item.product.name}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {item.orderedQuantity}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {item.receivedQuantity}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {item.remainingQuantity}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {item.unitCost}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {purchaseOrder.status === "DRAFT" && canManage && (
        <div className="flex gap-2">
          <form
            action={submitPurchaseOrderAction.bind(
              null,
              organizationId,
              purchaseOrderId,
            )}
          >
            <Button>Submit purchase order</Button>
          </form>

          <form
            action={cancelPurchaseOrderAction.bind(
              null,
              organizationId,
              purchaseOrderId,
            )}
          >
            <Button variant="outline">Cancel</Button>
          </form>
        </div>
      )}

      {purchaseOrder.status === "SUBMITTED" && canManage && (
        <form
          action={cancelPurchaseOrderAction.bind(
            null,
            organizationId,
            purchaseOrderId,
          )}
        >
          <Button variant="outline">Cancel order</Button>
        </form>
      )}

      {canReceive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receive delivery</CardTitle>
          </CardHeader>

          <CardContent>
            <ReceivePurchaseOrderForm
              organizationId={organizationId}
              purchaseOrder={purchaseOrder}
            />
          </CardContent>
        </Card>
      )}

      {purchaseOrder.receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receiving history</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {purchaseOrder.receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-start justify-between gap-4 border-b pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(receipt.createdAt).toLocaleString()}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {receipt.receivedBy?.email ?? "System"}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {receipt.note ?? "—"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
