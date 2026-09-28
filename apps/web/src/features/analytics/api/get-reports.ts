import "server-only";

import { authenticatedApiFetch } from "@/lib/api/server-api";

import type {
  InventoryWarehouseReport,
  MovementSummaryItem,
  OrderStatusSummary,
} from "../types";

export function getInventoryWarehouseReport(
  organizationId: string,
): Promise<InventoryWarehouseReport[]> {
  return authenticatedApiFetch<InventoryWarehouseReport[]>(
    `/organizations/${organizationId}/reports/inventory-by-warehouse`,
  );
}

export function getMovementSummary(
  organizationId: string,

  days: number = 30,
): Promise<MovementSummaryItem[]> {
  return authenticatedApiFetch<MovementSummaryItem[]>(
    `/organizations/${organizationId}/reports/movement-summary?days=${days}`,
  );
}

export function getOrderStatusSummary(
  organizationId: string,
): Promise<OrderStatusSummary> {
  return authenticatedApiFetch<OrderStatusSummary>(
    `/organizations/${organizationId}/reports/order-status-summary`,
  );
}
