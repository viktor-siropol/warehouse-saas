"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import type { Customer } from "@/features/customers/types";

import type { Warehouse } from "@/features/warehouses/types";

import { createSalesOrderAction } from "../actions";

import type { SalesOrderActionState } from "../types";

type Props = {
  organizationId: string;
  customers: Customer[];
  warehouses: Warehouse[];
};

const initialState: SalesOrderActionState = {
  error: null,
  success: null,
};

export function CreateSalesOrderForm({
  organizationId,
  customers,
  warehouses,
}: Props) {
  const action = createSalesOrderAction.bind(null, organizationId);

  const [state, formAction, pending] = useActionState(action, initialState);

  const activeCustomers = customers.filter((customer) => customer.isActive);

  const activeWarehouses = warehouses.filter((warehouse) => warehouse.isActive);

  return (
    <form
      action={formAction}
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <div className="space-y-2">
        <Label>Customer</Label>

        <select
          name="customerId"
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Select customer</option>

          {activeCustomers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.code}
              {" — "}
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Fulfillment warehouse</Label>

        <select
          name="warehouseId"
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Select warehouse</option>

          {activeWarehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code}
              {" — "}
              {warehouse.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Currency</Label>

        <Input name="currency" defaultValue="USD" maxLength={3} required />
      </div>

      <div className="space-y-2">
        <Label>Note</Label>

        <Input name="note" placeholder="Optional note" />
      </div>

      {state.error && (
        <p className="text-sm text-destructive md:col-span-2 xl:col-span-4">
          {state.error}
        </p>
      )}

      <div className="md:col-span-2 xl:col-span-4">
        <Button disabled={pending}>
          {pending ? "Creating..." : "Create draft"}
        </Button>
      </div>
    </form>
  );
}
