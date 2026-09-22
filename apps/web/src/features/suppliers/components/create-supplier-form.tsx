"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { createSupplierAction } from "../actions";

import type { SupplierActionState } from "../types";

type Props = {
  organizationId: string;
};

const initialState: SupplierActionState = {
  error: null,
  success: null,
};

export function CreateSupplierForm({ organizationId }: Props) {
  const action = createSupplierAction.bind(null, organizationId);

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="supplier-code">Code</Label>

          <Input
            id="supplier-code"
            name="code"
            placeholder="APPLE-DIST"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier-name">Supplier name</Label>

          <Input
            id="supplier-name"
            name="name"
            placeholder="Apple Distribution"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier-contact">Contact</Label>

          <Input id="supplier-contact" name="contactName" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier-email">Email</Label>

          <Input id="supplier-email" name="email" type="email" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier-phone">Phone</Label>

          <Input id="supplier-phone" name="phone" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier-address">Address</Label>

          <Input id="supplier-address" name="address" />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button disabled={pending}>
        {pending ? "Creating..." : "Create supplier"}
      </Button>
    </form>
  );
}
