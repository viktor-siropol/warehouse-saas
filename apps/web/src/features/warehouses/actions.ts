"use server";

import { revalidatePath } from "next/cache";

import { ApiError, authenticatedApiFetch } from "@/lib/api/server-api";

import type { WarehouseActionState } from "./types";

export async function createWarehouseAction(
  organizationId: string,
  _previousState: WarehouseActionState,
  formData: FormData,
): Promise<WarehouseActionState> {
  const name = String(formData.get("name") ?? "");

  const code = String(formData.get("code") ?? "");

  const rawAddress = String(formData.get("address") ?? "").trim();

  try {
    await authenticatedApiFetch(`/organizations/${organizationId}/warehouses`, {
      method: "POST",

      body: JSON.stringify({
        name,
        code,

        address: rawAddress || undefined,
      }),
    });

    revalidatePath(`/organizations/${organizationId}/warehouses`);

    return {
      error: null,
      success: "Warehouse created successfully",
    };
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Unexpected error while creating warehouse",

      success: null,
    };
  }
}

export async function setWarehouseActiveAction(
  organizationId: string,
  warehouseId: string,
  nextIsActive: boolean,
  _previousState: WarehouseActionState,
  _formData: FormData,
): Promise<WarehouseActionState> {
  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/warehouses/${warehouseId}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          isActive: nextIsActive,
        }),
      },
    );

    revalidatePath(`/organizations/${organizationId}/warehouses`);

    revalidatePath(`/organizations/${organizationId}/inventory/low-stock`);

    return {
      error: null,

      success: nextIsActive ? "Warehouse activated" : "Warehouse deactivated",
    };
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Unexpected warehouse update error",

      success: null,
    };
  }
}
