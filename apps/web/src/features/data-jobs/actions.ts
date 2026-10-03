"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type { DataJobCreated } from "./types";

const MAX_PRODUCT_IMPORT_BYTES = 2 * 1024 * 1024;

export type ProductImportActionState = {
  status: "idle" | "success" | "error";

  message: string;

  jobId: string | null;
};

export async function createProductImportJobAction(
  organizationId: string,

  previousState: ProductImportActionState,

  formData: FormData,
): Promise<ProductImportActionState> {
  void previousState;

  const fileValue = formData.get("file");

  if (!(fileValue instanceof File)) {
    return {
      status: "error",

      message: "Select a CSV file.",

      jobId: null,
    };
  }

  if (fileValue.size === 0) {
    return {
      status: "error",

      message: "The selected CSV file is empty.",

      jobId: null,
    };
  }

  if (fileValue.size > MAX_PRODUCT_IMPORT_BYTES) {
    return {
      status: "error",

      message: "CSV file must not exceed 2 MiB.",

      jobId: null,
    };
  }

  if (fileValue.name.length > 255) {
    return {
      status: "error",

      message: "File name is too long.",

      jobId: null,
    };
  }

  if (!fileValue.name.toLowerCase().endsWith(".csv")) {
    return {
      status: "error",

      message: "Only .csv files are supported.",

      jobId: null,
    };
  }

  try {
    const csv = await fileValue.text();

    const job = await authenticatedApiFetch<DataJobCreated>(
      `/organizations/${organizationId}/data-jobs/products/import`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          fileName: fileValue.name,

          csv,
        }),
      },
    );

    revalidatePath(`/organizations/${organizationId}/data-jobs`);

    return {
      status: "success",

      message: "Import job created. Processing has started in the background.",

      jobId: job.id,
    };
  } catch (error) {
    return {
      status: "error",

      message:
        error instanceof Error
          ? error.message
          : "Could not create product import job.",

      jobId: null,
    };
  }
}

export async function createProductExportJobAction(
  organizationId: string,

  formData: FormData,
): Promise<void> {
  void formData;

  const job = await authenticatedApiFetch<DataJobCreated>(
    `/organizations/${organizationId}/data-jobs/products/export`,
    {
      method: "POST",
    },
  );

  revalidatePath(`/organizations/${organizationId}/data-jobs`);

  redirect(`/organizations/${organizationId}/data-jobs/${job.id}`);
}
