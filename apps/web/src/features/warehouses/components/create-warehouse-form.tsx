"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { createWarehouseAction } from "../actions";

import type { WarehouseActionState } from "../types";

type CreateWarehouseFormProps = {
  organizationId: string;
};

const initialState: WarehouseActionState = {
  error: null,
  success: null,
};

export function CreateWarehouseForm({
  organizationId,
}: CreateWarehouseFormProps) {
  const action = createWarehouseAction.bind(null, organizationId);

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="warehouse-name">Name</Label>

          <Input
            id="warehouse-name"
            name="name"
            minLength={2}
            maxLength={100}
            placeholder="Kraków Main Warehouse"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="warehouse-code">Code</Label>

          <Input
            id="warehouse-code"
            name="code"
            minLength={2}
            maxLength={30}
            placeholder="KRK-01"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="warehouse-address">Address</Label>

          <Input
            id="warehouse-address"
            name="address"
            maxLength={300}
            placeholder="Kraków, Poland"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create warehouse"}
      </Button>
    </form>
  );
}
