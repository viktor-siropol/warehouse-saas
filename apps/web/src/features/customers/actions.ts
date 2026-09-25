"use server";

import { revalidatePath } from "next/cache";

import { ApiError, authenticatedApiFetch } from "@/lib/api/server-api";

import type { CustomerActionState } from "./types";

export async function createCustomerAction(
  organizationId: string,

  _previousState: CustomerActionState,

  formData: FormData,
): Promise<CustomerActionState> {
  const optional = (name: string) => {
    const value = String(formData.get(name) ?? "").trim();

    return value || undefined;
  };

  try {
    await authenticatedApiFetch(`/organizations/${organizationId}/customers`, {
      method: "POST",

      body: JSON.stringify({
        code: String(formData.get("code") ?? ""),

        name: String(formData.get("name") ?? ""),

        contactName: optional("contactName"),

        email: optional("email"),

        phone: optional("phone"),

        shippingAddress: optional("shippingAddress"),
      }),
    });

    revalidatePath(`/organizations/${organizationId}/customers`);

    return {
      error: null,
      success: "Customer created successfully",
    };
  } catch (error) {
    return {
      error:
        error instanceof ApiError ? error.message : "Unexpected customer error",

      success: null,
    };
  }
}
