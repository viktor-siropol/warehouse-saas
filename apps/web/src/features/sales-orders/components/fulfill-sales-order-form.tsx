"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { fulfillSalesOrderAction } from "../actions";

import type { SalesOrderActionState, SalesOrderDetail } from "../types";

type Props = {
  organizationId: string;

  salesOrder: SalesOrderDetail;
};

const initialState: SalesOrderActionState = {
  error: null,
  success: null,
};

export function FulfillSalesOrderForm({ organizationId, salesOrder }: Props) {
  const fulfillableItems = salesOrder.items.filter(
    (item) => item.reservedQuantity !== "0",
  );

  const itemIds = fulfillableItems.map((item) => item.id);

  const action = fulfillSalesOrderAction.bind(
    null,
    organizationId,
    salesOrder.id,
    itemIds,
  );

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {fulfillableItems.map((item) => (
        <div
          key={item.id}
          className="grid items-end gap-3 rounded-md border p-3 md:grid-cols-[1fr_160px]"
        >
          <div>
            <p className="text-sm font-medium">{item.product.name}</p>

            <p className="font-mono text-xs text-muted-foreground">
              {item.product.sku}
              {" · reserved "}
              {item.reservedQuantity}
              {" · fulfilled "}
              {item.fulfilledQuantity}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Fulfill</Label>

            <Input name={`fulfill-${item.id}`} placeholder="0.000" />
          </div>
        </div>
      ))}

      <div className="space-y-2">
        <Label>Fulfillment note</Label>

        <Input name="note" placeholder="Optional shipping note" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button disabled={pending || fulfillableItems.length === 0}>
        {pending ? "Fulfilling..." : "Fulfill reserved stock"}
      </Button>
    </form>
  );
}
