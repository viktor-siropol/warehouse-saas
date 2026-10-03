import Link from "next/link";

import { Download, FileSpreadsheet, Upload } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { createProductExportJobAction } from "@/features/data-jobs/actions";

import {
  getDataJobs,
  getProductImportTemplate,
} from "@/features/data-jobs/api/get-data-jobs";

import { DataJobsAutoRefresh } from "@/features/data-jobs/components/data-jobs-auto-refresh";

import { DownloadCsvButton } from "@/features/data-jobs/components/download-csv-button";

import { ProductImportForm } from "@/features/data-jobs/components/product-import-form";

type Props = {
  params: Promise<{
    organizationId: string;
  }>;
};

function getTypeLabel(type: "PRODUCT_IMPORT" | "PRODUCT_EXPORT"): string {
  return type === "PRODUCT_IMPORT" ? "Product import" : "Product export";
}

export default async function DataJobsPage({ params }: Props) {
  const { organizationId } = await params;

  const [jobs, template] = await Promise.all([
    getDataJobs(organizationId, 100),

    getProductImportTemplate(organizationId),
  ]);

  const hasActiveJobs = jobs.items.some(
    (job) => job.status === "PENDING" || job.status === "PROCESSING",
  );

  const createExportAction = createProductExportJobAction.bind(
    null,
    organizationId,
  );

  return (
    <>
      <PageHeader
        title="Data jobs"
        description="Asynchronous CSV imports, exports and bulk catalog operations."
      />

      <div className="flex justify-end">
        <DataJobsAutoRefresh enabled={hasActiveJobs} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="size-4" />
                  Product import
                </CardTitle>

                <CardDescription className="mt-1">
                  Create or update products from a CSV file in the background.
                </CardDescription>
              </div>

              <DownloadCsvButton
                fileName={template.fileName}
                csv={template.csv}
                label="Template"
              />
            </div>
          </CardHeader>

          <CardContent>
            <ProductImportForm organizationId={organizationId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="size-4" />
              Product export
            </CardTitle>

            <CardDescription>
              Generate a UTF-8 CSV snapshot of the current product catalog.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={createExportAction}>
              <Button type="submit">
                <Download className="size-4" />
                Create export
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="size-4" />
            Job history
          </CardTitle>

          <CardDescription>
            Import/export processing status and row-level results.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {jobs.items.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center border-t">
              <p className="text-sm text-muted-foreground">No data jobs yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>

                  <TableHead>Type</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead className="text-right">Progress</TableHead>

                  <TableHead className="text-right">Success</TableHead>

                  <TableHead className="text-right">Failed</TableHead>

                  <TableHead>User</TableHead>

                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {jobs.items.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString()}
                    </TableCell>

                    <TableCell>{getTypeLabel(job.type)}</TableCell>

                    <TableCell>
                      <Badge variant="outline">{job.status}</Badge>
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs">
                      {job.totalRows > 0
                        ? `${job.processedRows}/${job.totalRows}`
                        : "—"}
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      {job.successfulRows}
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      {job.failedRows}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {job.createdBy.email}
                    </TableCell>

                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/organizations/${organizationId}/data-jobs/${job.id}`}
                        >
                          Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
