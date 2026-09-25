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

import { CreateCustomerForm } from "@/features/customers/components/create-customer-form";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function CustomersPage({ params }: Props) {
  const { organizationId } = await params;

  const [customers, user] = await Promise.all([
    getCustomers(organizationId),

    getCurrentUser(),
  ]);

  const membership = user.memberships.find(
    (item) => item.organization.id === organizationId,
  );

  const canManage = membership !== undefined && membership.role !== "WORKER";

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage customers used by your sales and fulfillment workflow."
      />

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add customer</CardTitle>
          </CardHeader>

          <CardContent>
            <CreateCustomerForm organizationId={organizationId} />
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>

              <TableHead>Customer</TableHead>

              <TableHead>Contact</TableHead>

              <TableHead>Email</TableHead>

              <TableHead className="text-right">Orders</TableHead>

              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-mono text-xs">
                  {customer.code}
                </TableCell>

                <TableCell className="font-medium">{customer.name}</TableCell>

                <TableCell>{customer.contactName ?? "—"}</TableCell>

                <TableCell>{customer.email ?? "—"}</TableCell>

                <TableCell className="text-right">
                  {customer._count.salesOrders}
                </TableCell>

                <TableCell>
                  <Badge variant={customer.isActive ? "secondary" : "outline"}>
                    {customer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
