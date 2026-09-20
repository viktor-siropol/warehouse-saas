"use client";

import { useActionState } from "react";

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
    <form action={formAction}>
      <h2>Create warehouse</h2>

      <div>
        <label htmlFor="name">Name</label>

        <input id="name" name="name" minLength={2} maxLength={100} required />
      </div>

      <div>
        <label htmlFor="code">Code</label>

        <input
          id="code"
          name="code"
          minLength={2}
          maxLength={30}
          placeholder="KRK-02"
          required
        />
      </div>

      <div>
        <label htmlFor="address">Address</label>

        <input id="address" name="address" maxLength={300} />
      </div>

      {state.error && <p role="alert">{state.error}</p>}

      {state.success && <p>{state.success}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create warehouse"}
      </button>
    </form>
  );
}
