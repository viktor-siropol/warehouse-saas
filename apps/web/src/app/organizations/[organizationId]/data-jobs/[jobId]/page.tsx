import Link from "next/link";

import { ArrowLeft, FileWarning } from "lucide-react";

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

import { getDataJob } from "@/features/data-jobs/api/get-data-jobs";

import { DataJobsAutoRefresh } from "@/features/data-jobs/components/data-jobs-auto-refresh";

import { DownloadCsvButton } from "@/features/data-jobs/components/download-csv-button";

type Props = {
  params: Promise<{
    organizationId: string;

    jobId: string;
  }>;
};

export default async function DataJobDetailPage({ params }: Props) {
  const { organizationId, jobId } = await params;

  const job = await getDataJob(organizationId, jobId);

  const active = job.status === "PENDING" || job.status === "PROCESSING";

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/organizations/${organizationId}/data-jobs`}>
            <ArrowLeft className="size-4" />
            Data jobs
          </Link>
        </Button>

        <DataJobsAutoRefresh enabled={active} />
      </div>

      <PageHeader
        title={
          job.type === "PRODUCT_IMPORT" ? "Product import" : "Product export"
        }
        description={`Job ${job.id}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Badge variant="outline">{job.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total rows
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-semibold">{job.totalRows}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Successful
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-semibold">{job.successfulRows}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-2xl font-semibold">{job.failedRows}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
            <span className="text-muted-foreground">Type</span>

            <span>{job.type}</span>
          </div>

          <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
            <span className="text-muted-foreground">Created by</span>

            <span>{job.createdBy.email}</span>
          </div>

          <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
            <span className="text-muted-foreground">Attempts</span>

            <span>{job.attempts}</span>
          </div>

          <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
            <span className="text-muted-foreground">Input</span>

            <span>{job.inputFileName ?? "—"}</span>
          </div>

          <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
            <span className="text-muted-foreground">Output</span>

            <span>{job.outputFileName ?? "—"}</span>
          </div>

          <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
            <span className="text-muted-foreground">Created</span>

            <span>{new Date(job.createdAt).toLocaleString()}</span>
          </div>

          <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
            <span className="text-muted-foreground">Completed</span>

            <span>
              {job.completedAt
                ? new Date(job.completedAt).toLocaleString()
                : "—"}
            </span>
          </div>

          {job.outputFileName && job.outputText ? (
            <div className="pt-3">
              <DownloadCsvButton
                fileName={job.outputFileName}
                csv={job.outputText}
                label="Download export"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {job.lastError ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileWarning className="size-4" />
              Processing error
            </CardTitle>
          </CardHeader>

          <CardContent>
            <pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word rounded-md bg-muted p-3 text-xs">
              {job.lastError}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      {job.errors.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Row errors</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Row</TableHead>

                  <TableHead>Code</TableHead>

                  <TableHead>Message</TableHead>

                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {job.errors.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell className="font-mono">
                      {error.rowNumber}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">{error.code}</Badge>
                    </TableCell>

                    <TableCell>{error.message}</TableCell>

                    <TableCell className="max-w-96">
                      <pre className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {JSON.stringify(error.rowData)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
