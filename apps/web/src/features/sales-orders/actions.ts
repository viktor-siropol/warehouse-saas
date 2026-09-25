"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import { ApiError, authenticatedApiFetch } from "@/lib/api/server-api";

import type { SalesOrderActionState } from "./types";

function errorState(error: unknown): SalesOrderActionState {
  return {
    error:
      error instanceof ApiError
        ? error.message
        : "Unexpected sales order error",

    success: null,
  };
}

function revalidateSalesOrder(organizationId: string, salesOrderId: string) {
  revalidatePath(`/organizations/${organizationId}/sales-orders`);

  revalidatePath(
    `/organizations/${organizationId}/sales-orders/${salesOrderId}`,
  );

  revalidatePath(`/organizations/${organizationId}/inventory/low-stock`);

  revalidatePath(`/organizations/${organizationId}/stock-movements`);
}

export async function createSalesOrderAction(
  organizationId: string,

  _previousState: SalesOrderActionState,

  formData: FormData,
): Promise<SalesOrderActionState> {
  let salesOrderId: string;

  try {
    const salesOrder = await authenticatedApiFetch<{
      id: string;
    }>(`/organizations/${organizationId}/sales-orders`, {
      method: "POST",

      body: JSON.stringify({
        customerId: String(formData.get("customerId") ?? ""),

        warehouseId: String(formData.get("warehouseId") ?? ""),

        currency: String(formData.get("currency") ?? ""),

        note: String(formData.get("note") ?? "").trim() || undefined,
      }),
    });

    salesOrderId = salesOrder.id;
  } catch (error) {
    return errorState(error);
  }

  redirect(`/organizations/${organizationId}/sales-orders/${salesOrderId}`);
}

export async function addSalesOrderItemAction(
  organizationId: string,
  salesOrderId: string,

  _previousState: SalesOrderActionState,

  formData: FormData,
): Promise<SalesOrderActionState> {
  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/sales-orders/${salesOrderId}/items`,
      {
        method: "POST",

        body: JSON.stringify({
          productId: String(formData.get("productId") ?? ""),

          orderedQuantity: String(formData.get("orderedQuantity") ?? ""),

          unitPrice: String(formData.get("unitPrice") ?? ""),
        }),
      },
    );

    revalidateSalesOrder(organizationId, salesOrderId);

    return {
      error: null,
      success: "Sales order item added",
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function confirmSalesOrderAction(
  organizationId: string,
  salesOrderId: string,
): Promise<void> {
  await authenticatedApiFetch(
    `/organizations/${organizationId}/sales-orders/${salesOrderId}/confirm`,
    {
      method: "POST",
    },
  );

  revalidateSalesOrder(organizationId, salesOrderId);
}

export async function cancelSalesOrderAction(
  organizationId: string,
  salesOrderId: string,
): Promise<void> {
  await authenticatedApiFetch(
    `/organizations/${organizationId}/sales-orders/${salesOrderId}/cancel`,
    {
      method: "POST",
    },
  );

  revalidateSalesOrder(organizationId, salesOrderId);
}

export async function reserveSalesOrderAction(
  organizationId: string,
  salesOrderId: string,
  itemIds: string[],

  _previousState: SalesOrderActionState,

  formData: FormData,
): Promise<SalesOrderActionState> {
  const items = itemIds
    .map((itemId) => ({
      salesOrderItemId: itemId,

      quantity: String(formData.get(`reserve-${itemId}`) ?? "").trim(),
    }))
    .filter((item) => item.quantity !== "");

  if (items.length === 0) {
    return {
      error: "Enter at least one reservation quantity",

      success: null,
    };
  }

  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/sales-orders/${salesOrderId}/reservations`,
      {
        method: "POST",

        body: JSON.stringify({
          items,
        }),
      },
    );

    revalidateSalesOrder(organizationId, salesOrderId);

    return {
      error: null,
      success: "Stock reserved successfully",
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function fulfillSalesOrderAction(
  organizationId: string,
  salesOrderId: string,
  itemIds: string[],

  _previousState: SalesOrderActionState,

  formData: FormData,
): Promise<SalesOrderActionState> {
  const items = itemIds
    .map((itemId) => ({
      salesOrderItemId: itemId,

      quantity: String(formData.get(`fulfill-${itemId}`) ?? "").trim(),
    }))
    .filter((item) => item.quantity !== "");

  if (items.length === 0) {
    return {
      error: "Enter at least one fulfillment quantity",

      success: null,
    };
  }

  try {
    await authenticatedApiFetch(
      `/organizations/${organizationId}/sales-orders/${salesOrderId}/fulfillments`,
      {
        method: "POST",

        body: JSON.stringify({
          items,

          note: String(formData.get("note") ?? "").trim() || undefined,
        }),
      },
    );

    revalidateSalesOrder(organizationId, salesOrderId);

    return {
      error: null,
      success: "Order fulfilled successfully",
    };
  } catch (error) {
    return errorState(error);
  }
}
