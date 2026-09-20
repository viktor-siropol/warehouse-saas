"use client";

import { useActionState } from "react";

import { setWarehouseActiveAction } from "../actions";

import type { WarehouseActionState } from "../types";

type WarehouseStatusButtonProps = {
  organizationId: string;
  warehouseId: string;
  isActive: boolean;
};

const initialState: WarehouseActionState = {
  error: null,
  success: null,
};

export function WarehouseStatusButton({
  organizationId,
  warehouseId,
  isActive,
}: WarehouseStatusButtonProps) {
  const action = setWarehouseActiveAction.bind(
    null,
    organizationId,
    warehouseId,
    !isActive,
  );

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div>
      <form action={formAction}>
        <button type="submit" disabled={pending}>
          {pending ? "Updating..." : isActive ? "Deactivate" : "Activate"}
        </button>
      </form>

      {state.error && <p role="alert">{state.error}</p>}

      {state.success && <p>{state.success}</p>}
    </div>
  );
}
