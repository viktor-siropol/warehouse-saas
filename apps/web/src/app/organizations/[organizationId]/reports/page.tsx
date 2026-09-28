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

import {
  getInventoryWarehouseReport,
  getMovementSummary,
  getOrderStatusSummary,
} from "@/features/analytics/api/get-reports";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function ReportsPage({ params }: Props) {
  const { organizationId } = await params;

  const [inventory, movements, orderStatuses] = await Promise.all([
    getInventoryWarehouseReport(organizationId),

    getMovementSummary(organizationId, 30),

    getOrderStatusSummary(organizationId),
  ]);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Operational inventory, movement and order summaries."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory by warehouse</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>

                <TableHead className="text-right">Products</TableHead>

                <TableHead className="text-right">On hand</TableHead>

                <TableHead className="text-right">Reserved</TableHead>

                <TableHead className="text-right">Available</TableHead>

                <TableHead className="text-right">Low stock</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {inventory.map((row) => (
                <TableRow key={row.warehouseId}>
                  <TableCell>
                    <p className="font-medium">{row.warehouseName}</p>

                    <p className="font-mono text-xs text-muted-foreground">
                      {row.warehouseCode}
                    </p>
                  </TableCell>

                  <TableCell className="text-right">
                    {row.productPositions}
                  </TableCell>

                  <TableCell className="text-right font-mono">
                    {row.onHand}
                  </TableCell>

                  <TableCell className="text-right font-mono">
                    {row.reserved}
                  </TableCell>

                  <TableCell className="text-right font-mono">
                    {row.available}
                  </TableCell>

                  <TableCell className="text-right">
                    {row.lowStockPositions > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-warning/30 bg-warning/10 text-warning"
                      >
                        {row.lowStockPositions}
                      </Badge>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Stock movement — last 30 days
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>

                  <TableHead className="text-right">Inbound</TableHead>

                  <TableHead className="text-right">Outbound</TableHead>

                  <TableHead className="text-right">Operations</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {movements.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="font-mono text-xs">
                      {row.date}
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      {row.inbound}
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      {row.outbound}
                    </TableCell>

                    <TableCell className="text-right">
                      {row.movementCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order statuses</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium">Purchase orders</p>

              <div className="space-y-2">
                {orderStatuses.purchaseOrders.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between gap-3"
                  >
                    <Badge variant="outline">{item.status}</Badge>

                    <span className="font-mono text-sm">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium">Sales orders</p>

              <div className="space-y-2">
                {orderStatuses.salesOrders.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between gap-3"
                  >
                    <Badge variant="outline">{item.status}</Badge>

                    <span className="font-mono text-sm">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
