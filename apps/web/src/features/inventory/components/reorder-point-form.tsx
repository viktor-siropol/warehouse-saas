"use client";

import { useActionState } from "react";

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
    <form action={formAction}>
      <input name="reorderPoint" defaultValue={currentValue} required />

      <button disabled={pending}>{pending ? "Saving..." : "Save"}</button>

      {state.error && <p role="alert">{state.error}</p>}

      {state.success && <p>{state.success}</p>}
    </form>
  );
}
