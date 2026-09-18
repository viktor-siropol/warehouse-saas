"use server";

import { revalidatePath } from "next/cache";

import { ApiError, authenticatedApiFetch } from "@/lib/api/server-api";

import type { CreateProductInput } from "../types";

export type CreateProductActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export async function createProductAction(
  organizationId: string,
  input: CreateProductInput,
): Promise<CreateProductActionResult> {
  try {
    await authenticatedApiFetch(`/organizations/${organizationId}/products`, {
      method: "POST",

      body: JSON.stringify(input),
    });

    revalidatePath(`/organizations/${organizationId}/products`);

    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,

      error:
        error instanceof ApiError
          ? error.message
          : "Unexpected error while creating product",
    };
  }
}
