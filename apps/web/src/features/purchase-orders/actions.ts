"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import { ApiError, authenticatedApiFetch } from "@/lib/api/server-api";

import type { ProcurementActionState } from "./types";

export async function createPurchaseOrderAction(
  organizationId: string,

  _previousState: ProcurementActionState,

  formData: FormData,
): Promise<ProcurementActionState> {
  let purchaseOrderId: string;

  try {
    const purchaseOrder = await authenticatedApiFetch<{
      id: string;
    }>(`/organizations/${organizationId}/purchase-orders`, {
      method: "POST",

      body: JSON.stringify({
        supplierId: String(formData.get("supplierId") ?? ""),

        warehouseId: String(formData.get("warehouseId") ?? ""),

        currency: String(formData.get("currency") ?? ""),

        note: String(formData.get("note") ?? "").trim() || undefined,
      }),
    });

    purchaseOrderId = purchaseOrder.id;
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Unexpected purchase order error",

      success: null,
    };
  }

  redirect(
    `/organizations/${organizationId}/purchase-orders/${purchaseOrderId}`,
  );
}

export async function addPurchaseOrderItemAction(
  organizationId: string,

  purchaseOrderId: string,

  _previousState: ProcurementActionState,

  formData: FormData,
): Promise<ProcurementActionState> {
  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/purchase-orders/${purchaseOrderId}/items`,
      {
        method: "POST",

        body: JSON.stringify({
          productId: String(formData.get("productId") ?? ""),

          orderedQuantity: String(formData.get("orderedQuantity") ?? ""),

          unitCost: String(formData.get("unitCost") ?? ""),
        }),
      },
    );

    revalidatePath(
      `/organizations/${organizationId}/purchase-orders/${purchaseOrderId}`,
    );

    return {
      error: null,
      success: "Purchase order item added",
    };
  } catch (error) {
    return {
      error:
        error instanceof ApiError ? error.message : "Unexpected item error",

      success: null,
    };
  }
}

export async function submitPurchaseOrderAction(
  organizationId: string,

  purchaseOrderId: string,
): Promise<void> {
  await authenticatedApiFetch(
    `/organizations/${organizationId}/purchase-orders/${purchaseOrderId}/submit`,
    {
      method: "POST",
    },
  );

  revalidatePath(`/organizations/${organizationId}/purchase-orders`);

  revalidatePath(
    `/organizations/${organizationId}/purchase-orders/${purchaseOrderId}`,
  );
}

export async function cancelPurchaseOrderAction(
  organizationId: string,

  purchaseOrderId: string,
): Promise<void> {
  await authenticatedApiFetch(
    `/organizations/${organizationId}/purchase-orders/${purchaseOrderId}/cancel`,
    {
      method: "POST",
    },
  );

  revalidatePath(`/organizations/${organizationId}/purchase-orders`);

  revalidatePath(
    `/organizations/${organizationId}/purchase-orders/${purchaseOrderId}`,
  );
}

export async function receivePurchaseOrderAction(
  organizationId: string,

  purchaseOrderId: string,

  itemIds: string[],

  _previousState: ProcurementActionState,

  formData: FormData,
): Promise<ProcurementActionState> {
  const items = itemIds
    .map((itemId) => ({
      purchaseOrderItemId: itemId,

      quantity: String(formData.get(`quantity-${itemId}`) ?? "").trim(),
    }))
    .filter((item) => item.quantity !== "");

  if (items.length === 0) {
    return {
      error: "Enter at least one received quantity",

      success: null,
    };
  }

  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/purchase-orders/${purchaseOrderId}/receipts`,
      {
        method: "POST",

        body: JSON.stringify({
          items,

          note: String(formData.get("note") ?? "").trim() || undefined,
        }),
      },
    );

    revalidatePath(
      `/organizations/${organizationId}/purchase-orders/${purchaseOrderId}`,
    );

    revalidatePath(`/organizations/${organizationId}/purchase-orders`);

    revalidatePath(`/organizations/${organizationId}/inventory/low-stock`);

    revalidatePath(`/organizations/${organizationId}/stock-movements`);

    return {
      error: null,
      success: "Delivery received successfully",
    };
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Unexpected receiving error",

      success: null,
    };
  }
}
