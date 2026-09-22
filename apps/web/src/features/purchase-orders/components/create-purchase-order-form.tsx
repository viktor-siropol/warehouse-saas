"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import type { Supplier } from "@/features/suppliers/types";

import type { Warehouse } from "@/features/warehouses/types";

import { createPurchaseOrderAction } from "../actions";

import type { ProcurementActionState } from "../types";

type Props = {
  organizationId: string;

  suppliers: Supplier[];

  warehouses: Warehouse[];
};

const initialState: ProcurementActionState = {
  error: null,
  success: null,
};

export function CreatePurchaseOrderForm({
  organizationId,
  suppliers,
  warehouses,
}: Props) {
  const action = createPurchaseOrderAction.bind(null, organizationId);

  const [state, formAction, pending] = useActionState(action, initialState);

  const activeSuppliers = suppliers.filter((supplier) => supplier.isActive);

  const activeWarehouses = warehouses.filter((warehouse) => warehouse.isActive);

  return (
    <form
      action={formAction}
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <div className="space-y-2">
        <Label>Supplier</Label>

        <select
          name="supplierId"
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Select supplier</option>

          {activeSuppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.code}
              {" — "}
              {supplier.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Destination warehouse</Label>

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
