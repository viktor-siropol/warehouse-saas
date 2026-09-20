"use server";

import { revalidatePath } from "next/cache";

import { ApiError, authenticatedApiFetch } from "@/lib/api/server-api";

import type { InventoryActionState } from "./types";

function errorState(error: unknown): InventoryActionState {
  return {
    error:
      error instanceof ApiError ? error.message : "Unexpected inventory error",

    success: null,
  };
}

function revalidateInventory(organizationId: string, warehouseId: string) {
  revalidatePath(
    `/organizations/${organizationId}/warehouses/${warehouseId}/inventory`,
  );

  revalidatePath(`/organizations/${organizationId}/inventory/low-stock`);

  revalidatePath(`/organizations/${organizationId}/stock-movements`);
}

export async function receiveStockAction(
  organizationId: string,
  warehouseId: string,
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/warehouses/${warehouseId}/inventory/receipts`,
      {
        method: "POST",

        body: JSON.stringify({
          productId: String(formData.get("productId") ?? ""),

          quantity: String(formData.get("quantity") ?? ""),

          note: String(formData.get("note") ?? "").trim() || undefined,
        }),
      },
    );

    revalidateInventory(organizationId, warehouseId);

    return {
      error: null,
      success: "Stock received successfully",
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function issueStockAction(
  organizationId: string,
  warehouseId: string,
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/warehouses/${warehouseId}/inventory/issues`,
      {
        method: "POST",

        body: JSON.stringify({
          productId: String(formData.get("productId") ?? ""),

          quantity: String(formData.get("quantity") ?? ""),

          note: String(formData.get("note") ?? "").trim() || undefined,
        }),
      },
    );

    revalidateInventory(organizationId, warehouseId);

    return {
      error: null,
      success: "Stock issued successfully",
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function adjustStockAction(
  organizationId: string,
  warehouseId: string,
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/warehouses/${warehouseId}/inventory/adjustments`,
      {
        method: "POST",

        body: JSON.stringify({
          productId: String(formData.get("productId") ?? ""),

          delta: String(formData.get("delta") ?? ""),

          note: String(formData.get("note") ?? ""),
        }),
      },
    );

    revalidateInventory(organizationId, warehouseId);

    return {
      error: null,
      success: "Stock adjusted successfully",
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function transferStockAction(
  organizationId: string,
  fromWarehouseId: string,
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const toWarehouseId = String(formData.get("toWarehouseId") ?? "");

  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/inventory/transfers`,
      {
        method: "POST",

        body: JSON.stringify({
          productId: String(formData.get("productId") ?? ""),

          fromWarehouseId,

          toWarehouseId,

          quantity: String(formData.get("quantity") ?? ""),

          note: String(formData.get("note") ?? "").trim() || undefined,
        }),
      },
    );

    revalidateInventory(organizationId, fromWarehouseId);

    revalidatePath(
      `/organizations/${organizationId}/warehouses/${toWarehouseId}/inventory`,
    );

    return {
      error: null,
      success: "Stock transferred successfully",
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function setReorderPointAction(
  organizationId: string,
  warehouseId: string,
  productId: string,
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/warehouses/${warehouseId}/inventory/${productId}/reorder-point`,
      {
        method: "PATCH",

        body: JSON.stringify({
          reorderPoint: String(formData.get("reorderPoint") ?? ""),
        }),
      },
    );

    revalidateInventory(organizationId, warehouseId);

    return {
      error: null,
      success: "Reorder point updated",
    };
  } catch (error) {
    return errorState(error);
  }
}
