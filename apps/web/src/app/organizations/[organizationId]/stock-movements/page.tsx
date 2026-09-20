import { ArrowLeftRight } from "lucide-react";

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

import { getStockMovements } from "@/features/inventory/api/get-stock-movements";

type StockMovementsPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

function movementBadgeClass(type: string) {
  switch (type) {
    case "RECEIPT":
    case "TRANSFER_IN":
      return "border-success/30 bg-success/10 text-success";

    case "ISSUE":
    case "TRANSFER_OUT":
      return "border-info/30 bg-info/10 text-info";

    case "ADJUSTMENT":
      return "border-warning/30 bg-warning/10 text-warning";

    default:
      return "";
  }
}

export default async function StockMovementsPage({
  params,
}: StockMovementsPageProps) {
  const { organizationId } = await params;

  const movements = await getStockMovements(organizationId);

  return (
    <>
      <PageHeader
        title="Stock movements"
        description="Audit trail of inventory changes across all warehouse locations."
      />

      {movements.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 text-center">
          <ArrowLeftRight className="mb-3 size-8 text-muted-foreground" />

          <p className="font-medium">No movements yet</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Inventory receipts, issues, adjustments and transfers will appear
            here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>

                <TableHead>Warehouse</TableHead>

                <TableHead>Product</TableHead>

                <TableHead className="text-right">Delta</TableHead>

                <TableHead>Performed by</TableHead>

                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={movementBadgeClass(movement.type)}
                    >
                      {movement.type}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-medium">
                    {movement.warehouse.code}
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium">{movement.product.name}</p>

                      <p className="font-mono text-xs text-muted-foreground">
                        {movement.product.sku}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-right font-mono font-medium">
                    {movement.delta}
                  </TableCell>

                  <TableCell>
                    {movement.createdBy ? movement.createdBy.email : "System"}
                  </TableCell>

                  <TableCell className="max-w-72 truncate text-muted-foreground">
                    {movement.note ?? "—"}
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
