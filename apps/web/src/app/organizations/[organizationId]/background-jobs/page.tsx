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

import { getBackgroundJobs } from "@/features/notifications/api/get-background-jobs";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function BackgroundJobsPage({ params }: Props) {
  const { organizationId } = await params;

  const jobs = await getBackgroundJobs(organizationId, 100);

  const statusOrder = [
    "PENDING",
    "PROCESSING",
    "PROCESSED",
    "DEAD_LETTER",
  ] as const;

  const countByStatus = new Map(
    jobs.statusCounts.map((item) => [item.status, item.count]),
  );

  return (
    <>
      <PageHeader
        title="Background jobs"
        description="Transactional outbox events and asynchronous processing state."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statusOrder.map((status) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {status}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">
                {countByStatus.get(status) ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.items.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed bg-muted/20">
          <p className="text-sm text-muted-foreground">No outbox events yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>

                <TableHead>Event</TableHead>

                <TableHead>Aggregate</TableHead>

                <TableHead>Status</TableHead>

                <TableHead className="text-right">Attempts</TableHead>

                <TableHead>Processed</TableHead>

                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {jobs.items.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    {job.eventType}
                  </TableCell>

                  <TableCell>
                    <p className="text-sm">{job.aggregateType}</p>

                    <p className="max-w-48 truncate font-mono text-xs text-muted-foreground">
                      {job.aggregateId ?? "—"}
                    </p>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{job.status}</Badge>
                  </TableCell>

                  <TableCell className="text-right font-mono">
                    {job.attempts}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {job.processedAt
                      ? new Date(job.processedAt).toLocaleString()
                      : "—"}
                  </TableCell>

                  <TableCell className="max-w-64 truncate text-xs text-muted-foreground">
                    {job.lastError ?? "—"}
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
