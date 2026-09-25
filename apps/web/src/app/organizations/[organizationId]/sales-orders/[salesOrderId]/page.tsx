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

import { getProducts } from "@/features/products/api/get-products";

import {
  cancelSalesOrderAction,
  confirmSalesOrderAction,
} from "@/features/sales-orders/actions";

import { getSalesOrder } from "@/features/sales-orders/api/get-sales-order";

import { AddSalesOrderItemForm } from "@/features/sales-orders/components/add-sales-order-item-form";

import { FulfillSalesOrderForm } from "@/features/sales-orders/components/fulfill-sales-order-form";

import { ReserveSalesOrderForm } from "@/features/sales-orders/components/reserve-sales-order-form";

type Props = {
  params: Promise<{
    organizationId: string;
    salesOrderId: string;
  }>;
};

export default async function SalesOrderPage({ params }: Props) {
  const { organizationId, salesOrderId } = await params;

  const [salesOrder, products, user] = await Promise.all([
    getSalesOrder(organizationId, salesOrderId),

    getProducts(organizationId),

    getCurrentUser(),
  ]);

  const membership = user.memberships.find(
    (item) => item.organization.id === organizationId,
  );

  const canManage = membership !== undefined && membership.role !== "WORKER";

  const canReserve = [
    "CONFIRMED",
    "PARTIALLY_RESERVED",
    "RESERVED",
    "PARTIALLY_FULFILLED",
  ].includes(salesOrder.status);

  const canFulfill = [
    "PARTIALLY_RESERVED",
    "RESERVED",
    "PARTIALLY_FULFILLED",
  ].includes(salesOrder.status);

  const canCancel =
    canManage &&
    ["DRAFT", "CONFIRMED", "PARTIALLY_RESERVED", "RESERVED"].includes(
      salesOrder.status,
    );

  return (
    <>
      <PageHeader
        title={salesOrder.number}
        description={`${salesOrder.customerNameSnapshot} · ${salesOrder.warehouse.code}`}
        actions={<Badge variant="outline">{salesOrder.status}</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Customer</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="font-medium">{salesOrder.customerNameSnapshot}</p>

            <p className="font-mono text-xs text-muted-foreground">
              {salesOrder.customer.code}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fulfillment warehouse</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="font-medium">{salesOrder.warehouse.name}</p>

            <p className="font-mono text-xs text-muted-foreground">
              {salesOrder.warehouse.code}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ship to</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm">
              {salesOrder.shippingAddressSnapshot ?? "No shipping address"}
            </p>
          </CardContent>
        </Card>
      </div>

      {salesOrder.status === "DRAFT" && canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add item</CardTitle>
          </CardHeader>

          <CardContent>
            <AddSalesOrderItemForm
              organizationId={organizationId}
              salesOrderId={salesOrderId}
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

              <TableHead className="text-right">Reserved</TableHead>

              <TableHead className="text-right">Fulfilled</TableHead>

              <TableHead className="text-right">Warehouse available</TableHead>

              <TableHead className="text-right">Unit price</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {salesOrder.items.map((item) => (
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
                  {item.reservedQuantity}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {item.fulfilledQuantity}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {item.warehouseAvailableQuantity}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {item.unitPrice}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {salesOrder.status === "DRAFT" && canManage && (
        <div className="flex gap-2">
          <form
            action={confirmSalesOrderAction.bind(
              null,
              organizationId,
              salesOrderId,
            )}
          >
            <Button>Confirm order</Button>
          </form>

          <form
            action={cancelSalesOrderAction.bind(
              null,
              organizationId,
              salesOrderId,
            )}
          >
            <Button variant="outline">Cancel</Button>
          </form>
        </div>
      )}

      {canReserve && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reserve stock</CardTitle>
          </CardHeader>

          <CardContent>
            <ReserveSalesOrderForm
              organizationId={organizationId}
              salesOrder={salesOrder}
            />
          </CardContent>
        </Card>
      )}

      {canFulfill && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fulfill order</CardTitle>
          </CardHeader>

          <CardContent>
            <FulfillSalesOrderForm
              organizationId={organizationId}
              salesOrder={salesOrder}
            />
          </CardContent>
        </Card>
      )}

      {canCancel && salesOrder.status !== "DRAFT" && (
        <form
          action={cancelSalesOrderAction.bind(
            null,
            organizationId,
            salesOrderId,
          )}
        >
          <Button variant="outline">Cancel order</Button>
        </form>
      )}

      {salesOrder.fulfillments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fulfillment history</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {salesOrder.fulfillments.map((fulfillment) => (
              <div
                key={fulfillment.id}
                className="flex items-start justify-between gap-4 border-b pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(fulfillment.createdAt).toLocaleString()}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {fulfillment.fulfilledBy?.email ?? "System"}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {fulfillment.note ?? "—"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
