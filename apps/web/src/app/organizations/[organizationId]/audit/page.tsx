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

import { getAuditLogs } from "@/features/analytics/api/get-audit-logs";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function AuditPage({ params }: Props) {
  const { organizationId } = await params;

  const audit = await getAuditLogs(organizationId, 100);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Append-only record of important operational actions."
      />

      {audit.items.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed bg-muted/20">
          <div className="text-center">
            <p className="text-sm font-medium">No audit events yet</p>

            <p className="mt-1 text-sm text-muted-foreground">
              New warehouse and order operations will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>

                <TableHead>Action</TableHead>

                <TableHead>Entity</TableHead>

                <TableHead>User</TableHead>

                <TableHead>Entity ID</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {audit.items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{entry.action}</Badge>
                  </TableCell>

                  <TableCell>{entry.entityType}</TableCell>

                  <TableCell>{entry.actorUser?.email ?? "System"}</TableCell>

                  <TableCell className="max-w-48 truncate font-mono text-xs text-muted-foreground">
                    {entry.entityId ?? "—"}
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
