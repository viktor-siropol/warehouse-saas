"use server";

import { revalidatePath } from "next/cache";

import { ApiError, authenticatedApiFetch } from "@/lib/api/server-api";

import type { SupplierActionState } from "./types";

export async function createSupplierAction(
  organizationId: string,

  _previousState: SupplierActionState,

  formData: FormData,
): Promise<SupplierActionState> {
  const optional = (name: string) => {
    const value = String(formData.get(name) ?? "").trim();

    return value || undefined;
  };

  try {
    await authenticatedApiFetch(`/organizations/${organizationId}/suppliers`, {
      method: "POST",

      body: JSON.stringify({
        code: String(formData.get("code") ?? ""),

        name: String(formData.get("name") ?? ""),

        contactName: optional("contactName"),

        email: optional("email"),

        phone: optional("phone"),

        address: optional("address"),
      }),
    });

    revalidatePath(`/organizations/${organizationId}/suppliers`);

    return {
      error: null,
      success: "Supplier created successfully",
    };
  } catch (error) {
    return {
      error:
        error instanceof ApiError ? error.message : "Unexpected supplier error",

      success: null,
    };
  }
}
