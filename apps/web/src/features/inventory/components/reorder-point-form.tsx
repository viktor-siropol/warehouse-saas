"use client";

import { useActionState } from "react";

import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { setReorderPointAction } from "../actions";

import type { InventoryActionState } from "../types";

type ReorderPointFormProps = {
  organizationId: string;
  warehouseId: string;
  productId: string;
  currentValue: string;
};

const initialState: InventoryActionState = {
  error: null,
  success: null,
};

export function ReorderPointForm({
  organizationId,
  warehouseId,
  productId,
  currentValue,
}: ReorderPointFormProps) {
  const action = setReorderPointAction.bind(
    null,
    organizationId,
    warehouseId,
    productId,
  );

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="space-y-1">
      <form action={formAction} className="flex items-center gap-2">
        <Input
          name="reorderPoint"
          defaultValue={currentValue}
          className="h-8 w-28 font-mono"
          required
        />

        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={pending}
          className="size-8"
          aria-label="Save reorder point"
        >
          <Save className="size-4" />
        </Button>
      </form>

      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}
