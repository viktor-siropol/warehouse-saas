"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { createCustomerAction } from "../actions";

import type { CustomerActionState } from "../types";

type Props = {
  organizationId: string;
};

const initialState: CustomerActionState = {
  error: null,
  success: null,
};

export function CreateCustomerForm({ organizationId }: Props) {
  const action = createCustomerAction.bind(null, organizationId);

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="customer-code">Code</Label>

          <Input
            id="customer-code"
            name="code"
            placeholder="CUSTOMER-001"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-name">Customer</Label>

          <Input
            id="customer-name"
            name="name"
            placeholder="Acme Retail"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-contact">Contact</Label>

          <Input id="customer-contact" name="contactName" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-email">Email</Label>

          <Input id="customer-email" name="email" type="email" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-phone">Phone</Label>

          <Input id="customer-phone" name="phone" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-address">Shipping address</Label>

          <Input id="customer-address" name="shippingAddress" />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button disabled={pending}>
        {pending ? "Creating..." : "Create customer"}
      </Button>
    </form>
  );
}
