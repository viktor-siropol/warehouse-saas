"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import type { Product } from "@/features/products/types";

import { addPurchaseOrderItemAction } from "../actions";

import type { ProcurementActionState } from "../types";

type Props = {
  organizationId: string;

  purchaseOrderId: string;

  products: Product[];
};

const initialState: ProcurementActionState = {
  error: null,
  success: null,
};

export function AddPurchaseOrderItemForm({
  organizationId,
  purchaseOrderId,
  products,
}: Props) {
  const action = addPurchaseOrderItemAction.bind(
    null,
    organizationId,
    purchaseOrderId,
  );

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-4">
      <div className="space-y-2">
        <Label>Product</Label>

        <select
          name="productId"
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Select product</option>

          {products
            .filter((product) => product.isActive)
            .map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku}
                {" — "}
                {product.name}
              </option>
            ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Quantity</Label>

        <Input name="orderedQuantity" placeholder="10.000" required />
      </div>

      <div className="space-y-2">
        <Label>Unit cost</Label>

        <Input name="unitCost" placeholder="99.99" required />
      </div>

      <div className="flex items-end">
        <Button className="w-full" disabled={pending}>
          {pending ? "Adding..." : "Add item"}
        </Button>
      </div>

      {state.error && (
        <p className="text-sm text-destructive md:col-span-4">{state.error}</p>
      )}

      {state.success && (
        <p className="text-sm text-success md:col-span-4">{state.success}</p>
      )}
    </form>
  );
}
