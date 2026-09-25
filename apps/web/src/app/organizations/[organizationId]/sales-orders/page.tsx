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

import { getCustomers } from "@/features/customers/api/get-customers";

import { getSalesOrders } from "@/features/sales-orders/api/get-sales-orders";

import { CreateSalesOrderForm } from "@/features/sales-orders/components/create-sales-order-form";

import { getWarehouses } from "@/features/warehouses/api/get-warehouses";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function SalesOrdersPage({ params }: Props) {
  const { organizationId } = await params;

  const [salesOrders, customers, warehouses, user] = await Promise.all([
    getSalesOrders(organizationId),

    getCustomers(organizationId),

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
        title="Sales orders"
        description="Create customer orders, reserve stock and track fulfillment."
      />

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New sales order</CardTitle>
          </CardHeader>

          <CardContent>
            <CreateSalesOrderForm
              organizationId={organizationId}
              customers={customers}
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

              <TableHead>Customer</TableHead>

              <TableHead>Warehouse</TableHead>

              <TableHead>Items</TableHead>

              <TableHead>Fulfillments</TableHead>

              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {salesOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link
                    href={`/organizations/${organizationId}/sales-orders/${order.id}`}
                    className="font-mono text-xs font-medium hover:underline"
                  >
                    {order.number}
                  </Link>
                </TableCell>

                <TableCell>{order.customerNameSnapshot}</TableCell>

                <TableCell>{order.warehouse.code}</TableCell>

                <TableCell>{order._count.items}</TableCell>

                <TableCell>{order._count.fulfillments}</TableCell>

                <TableCell>
                  <Badge variant="outline">{order.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
