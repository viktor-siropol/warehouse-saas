import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type {
  DataJobDetail,
  DataJobsPage,
  ProductImportTemplate,
} from "../types";

export function getDataJobs(
  organizationId: string,

  limit: number = 50,
): Promise<DataJobsPage> {
  return authenticatedApiFetch<DataJobsPage>(
    `/organizations/${organizationId}/data-jobs?limit=${limit}`,
  );
}

export function getDataJob(
  organizationId: string,

  jobId: string,
): Promise<DataJobDetail> {
  return authenticatedApiFetch<DataJobDetail>(
    `/organizations/${organizationId}/data-jobs/${jobId}`,
  );
}

export function getProductImportTemplate(
  organizationId: string,
): Promise<ProductImportTemplate> {
  return authenticatedApiFetch<ProductImportTemplate>(
    `/organizations/${organizationId}/data-jobs/products/import-template`,
  );
}
