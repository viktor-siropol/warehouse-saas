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

import { getSuppliers } from "@/features/suppliers/api/get-suppliers";

import { CreateSupplierForm } from "@/features/suppliers/components/create-supplier-form";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function SuppliersPage({ params }: Props) {
  const { organizationId } = await params;

  const [suppliers, user] = await Promise.all([
    getSuppliers(organizationId),

    getCurrentUser(),
  ]);

  const membership = user.memberships.find(
    (item) => item.organization.id === organizationId,
  );

  const canManage = membership !== undefined && membership.role !== "WORKER";

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Manage vendors used by your procurement workflow."
      />

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add supplier</CardTitle>
          </CardHeader>

          <CardContent>
            <CreateSupplierForm organizationId={organizationId} />
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>

              <TableHead>Supplier</TableHead>

              <TableHead>Contact</TableHead>

              <TableHead>Email</TableHead>

              <TableHead className="text-right">Purchase orders</TableHead>

              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-mono text-xs">
                  {supplier.code}
                </TableCell>

                <TableCell className="font-medium">{supplier.name}</TableCell>

                <TableCell>{supplier.contactName ?? "—"}</TableCell>

                <TableCell>{supplier.email ?? "—"}</TableCell>

                <TableCell className="text-right">
                  {supplier._count.purchaseOrders}
                </TableCell>

                <TableCell>
                  <Badge variant={supplier.isActive ? "secondary" : "outline"}>
                    {supplier.isActive ? "Active" : "Inactive"}
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
