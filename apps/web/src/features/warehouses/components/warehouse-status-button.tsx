"use client";

import { useActionState } from "react";

import { Power } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <div className="space-y-2">
      <form action={formAction}>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          <Power className="size-4" />

          {pending ? "Updating..." : isActive ? "Deactivate" : "Activate"}
        </Button>
      </form>

      {state.error && (
        <p role="alert" className="max-w-64 text-xs text-destructive">
          {state.error}
        </p>
      )}

      {state.success && <p className="text-xs text-success">{state.success}</p>}
    </div>
  );
}
