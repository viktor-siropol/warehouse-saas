"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { receivePurchaseOrderAction } from "../actions";

import type { ProcurementActionState, PurchaseOrderDetail } from "../types";

type Props = {
  organizationId: string;

  purchaseOrder: PurchaseOrderDetail;
};

const initialState: ProcurementActionState = {
  error: null,
  success: null,
};

export function ReceivePurchaseOrderForm({
  organizationId,
  purchaseOrder,
}: Props) {
  const receivableItems = purchaseOrder.items.filter(
    (item) => item.remainingQuantity !== "0",
  );

  const itemIds = receivableItems.map((item) => item.id);

  const action = receivePurchaseOrderAction.bind(
    null,
    organizationId,
    purchaseOrder.id,
    itemIds,
  );

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-3">
        {receivableItems.map((item) => (
          <div
            key={item.id}
            className="grid items-end gap-3 rounded-md border p-3 md:grid-cols-[1fr_180px]"
          >
            <div>
              <p className="text-sm font-medium">{item.product.name}</p>

              <p className="font-mono text-xs text-muted-foreground">
                {item.product.sku}
                {" · remaining "}
                {item.remainingQuantity}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Receive</Label>

              <Input name={`quantity-${item.id}`} placeholder="0.000" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Delivery note</Label>

        <Input name="note" placeholder="Optional receiving note" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button disabled={pending || receivableItems.length === 0}>
        {pending ? "Receiving..." : "Receive delivery"}
      </Button>
    </form>
  );
}
