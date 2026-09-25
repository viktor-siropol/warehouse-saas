"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { reserveSalesOrderAction } from "../actions";

import type { SalesOrderActionState, SalesOrderDetail } from "../types";

type Props = {
  organizationId: string;
  salesOrder: SalesOrderDetail;
};

const initialState: SalesOrderActionState = {
  error: null,
  success: null,
};

export function ReserveSalesOrderForm({ organizationId, salesOrder }: Props) {
  const reservableItems = salesOrder.items.filter(
    (item) => item.remainingToReserve !== "0",
  );

  const itemIds = reservableItems.map((item) => item.id);

  const action = reserveSalesOrderAction.bind(
    null,
    organizationId,
    salesOrder.id,
    itemIds,
  );

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {reservableItems.map((item) => (
        <div
          key={item.id}
          className="grid items-end gap-3 rounded-md border p-3 md:grid-cols-[1fr_160px]"
        >
          <div>
            <p className="text-sm font-medium">{item.product.name}</p>

            <p className="font-mono text-xs text-muted-foreground">
              {item.product.sku}
              {" · need "}
              {item.remainingToReserve}
              {" · available "}
              {item.warehouseAvailableQuantity}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Reserve</Label>

            <Input name={`reserve-${item.id}`} placeholder="0.000" />
          </div>
        </div>
      ))}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button disabled={pending || reservableItems.length === 0}>
        {pending ? "Reserving..." : "Reserve stock"}
      </Button>
    </form>
  );
}
