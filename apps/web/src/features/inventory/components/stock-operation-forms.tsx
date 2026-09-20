"use client";

import { useActionState } from "react";

import { ArrowRightLeft, Minus, Plus, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Warehouse } from "@/features/warehouses/types";

import {
  adjustStockAction,
  issueStockAction,
  receiveStockAction,
  transferStockAction,
} from "../actions";

import type { InventoryActionState, InventoryItem } from "../types";

type StockOperationFormsProps = {
  organizationId: string;
  warehouseId: string;
  items: InventoryItem[];
  warehouses: Warehouse[];
  canAdjust: boolean;
};

const initialState: InventoryActionState = {
  error: null,
  success: null,
};

function Status({ state }: { state: InventoryActionState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && <p className="text-sm text-success">{state.success}</p>}
    </>
  );
}

function ProductSelect({ items }: { items: InventoryItem[] }) {
  return (
    <div className="space-y-2">
      <Label>Product</Label>

      <select
        name="productId"
        required
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
      >
        <option value="">Select product</option>

        {items.map((item) => (
          <option key={item.product.id} value={item.product.id}>
            {item.product.sku}
            {" — "}
            {item.product.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function StockOperationForms({
  organizationId,
  warehouseId,
  items,
  warehouses,
  canAdjust,
}: StockOperationFormsProps) {
  const receiveAction = receiveStockAction.bind(
    null,
    organizationId,
    warehouseId,
  );

  const issueAction = issueStockAction.bind(null, organizationId, warehouseId);

  const adjustmentAction = adjustStockAction.bind(
    null,
    organizationId,
    warehouseId,
  );

  const transferAction = transferStockAction.bind(
    null,
    organizationId,
    warehouseId,
  );

  const [receiveState, receiveFormAction, receivePending] = useActionState(
    receiveAction,
    initialState,
  );

  const [issueState, issueFormAction, issuePending] = useActionState(
    issueAction,
    initialState,
  );

  const [adjustmentState, adjustmentFormAction, adjustmentPending] =
    useActionState(adjustmentAction, initialState);

  const [transferState, transferFormAction, transferPending] = useActionState(
    transferAction,
    initialState,
  );

  const activeDestinations = warehouses.filter(
    (warehouse) => warehouse.isActive && warehouse.id !== warehouseId,
  );

  return (
    <Tabs defaultValue="receipt" className="w-full">
      <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-4">
        <TabsTrigger value="receipt">
          <Plus className="size-4" />
          Receipt
        </TabsTrigger>

        <TabsTrigger value="issue">
          <Minus className="size-4" />
          Issue
        </TabsTrigger>

        <TabsTrigger value="transfer">
          <ArrowRightLeft className="size-4" />
          Transfer
        </TabsTrigger>

        {canAdjust && (
          <TabsTrigger value="adjustment">
            <SlidersHorizontal className="size-4" />
            Adjust
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="receipt">
        <form
          action={receiveFormAction}
          className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <ProductSelect items={items} />

          <div className="space-y-2">
            <Label>Quantity</Label>

            <Input name="quantity" placeholder="10.000" required />
          </div>

          <div className="space-y-2">
            <Label>Note</Label>

            <Input
              name="note"
              placeholder="Supplier delivery"
              maxLength={500}
            />
          </div>

          <div className="flex items-end">
            <Button className="w-full" disabled={receivePending}>
              {receivePending ? "Receiving..." : "Receive stock"}
            </Button>
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <Status state={receiveState} />
          </div>
        </form>
      </TabsContent>

      <TabsContent value="issue">
        <form
          action={issueFormAction}
          className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <ProductSelect items={items} />

          <div className="space-y-2">
            <Label>Quantity</Label>

            <Input name="quantity" placeholder="2.000" required />
          </div>

          <div className="space-y-2">
            <Label>Note</Label>

            <Input
              name="note"
              placeholder="Customer shipment"
              maxLength={500}
            />
          </div>

          <div className="flex items-end">
            <Button className="w-full" disabled={issuePending}>
              {issuePending ? "Issuing..." : "Issue stock"}
            </Button>
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <Status state={issueState} />
          </div>
        </form>
      </TabsContent>

      <TabsContent value="transfer">
        <form
          action={transferFormAction}
          className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <ProductSelect items={items} />

          <div className="space-y-2">
            <Label>Destination</Label>

            <select
              name="toWarehouseId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
            >
              <option value="">Select warehouse</option>

              {activeDestinations.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code}
                  {" — "}
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>

            <Input name="quantity" placeholder="1.000" required />
          </div>

          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={transferPending || activeDestinations.length === 0}
            >
              {transferPending ? "Transferring..." : "Transfer stock"}
            </Button>
          </div>

          <div className="space-y-2 md:col-span-2 xl:col-span-4">
            <Label>Note</Label>

            <Input
              name="note"
              placeholder="Optional transfer reason"
              maxLength={500}
            />
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <Status state={transferState} />
          </div>
        </form>
      </TabsContent>

      {canAdjust && (
        <TabsContent value="adjustment">
          <form
            action={adjustmentFormAction}
            className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <ProductSelect items={items} />

            <div className="space-y-2">
              <Label>Delta</Label>

              <Input name="delta" placeholder="-1.000 or 2.000" required />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>

              <Input
                name="note"
                placeholder="Physical count correction"
                minLength={3}
                maxLength={500}
                required
              />
            </div>

            <div className="flex items-end">
              <Button className="w-full" disabled={adjustmentPending}>
                {adjustmentPending ? "Adjusting..." : "Adjust stock"}
              </Button>
            </div>

            <div className="md:col-span-2 xl:col-span-4">
              <Status state={adjustmentState} />
            </div>
          </form>
        </TabsContent>
      )}
    </Tabs>
  );
}
