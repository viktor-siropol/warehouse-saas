"use client";

import { useActionState } from "react";

import {
  adjustStockAction,
  issueStockAction,
  receiveStockAction,
  transferStockAction,
} from "../actions";

import type { InventoryActionState, InventoryItem } from "../types";

import type { Warehouse } from "@/features/warehouses/types";

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
      {state.error && <p role="alert">{state.error}</p>}

      {state.success && <p>{state.success}</p>}
    </>
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
    <section>
      <h2>Stock operations</h2>

      <form action={receiveFormAction}>
        <h3>Receipt</h3>

        <ProductSelect items={items} />

        <input name="quantity" placeholder="10.000" required />

        <input name="note" placeholder="Supplier delivery" maxLength={500} />

        <button disabled={receivePending}>
          {receivePending ? "Receiving..." : "Receive stock"}
        </button>

        <Status state={receiveState} />
      </form>

      <form action={issueFormAction}>
        <h3>Issue</h3>

        <ProductSelect items={items} />

        <input name="quantity" placeholder="2.000" required />

        <input name="note" placeholder="Customer shipment" maxLength={500} />

        <button disabled={issuePending}>
          {issuePending ? "Issuing..." : "Issue stock"}
        </button>

        <Status state={issueState} />
      </form>

      {canAdjust && (
        <form action={adjustmentFormAction}>
          <h3>Adjustment</h3>

          <ProductSelect items={items} />

          <input name="delta" placeholder="-1.000 or 2.000" required />

          <input
            name="note"
            placeholder="Reason for adjustment"
            minLength={3}
            maxLength={500}
            required
          />

          <button disabled={adjustmentPending}>
            {adjustmentPending ? "Adjusting..." : "Adjust stock"}
          </button>

          <Status state={adjustmentState} />
        </form>
      )}

      <form action={transferFormAction}>
        <h3>Transfer</h3>

        <ProductSelect items={items} />

        <label>Destination warehouse</label>

        <select name="toWarehouseId" required>
          <option value="">Select warehouse</option>

          {activeDestinations.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code}
              {" — "}
              {warehouse.name}
            </option>
          ))}
        </select>

        <input name="quantity" placeholder="1.000" required />

        <input name="note" placeholder="Transfer reason" maxLength={500} />

        <button disabled={transferPending || activeDestinations.length === 0}>
          {transferPending ? "Transferring..." : "Transfer stock"}
        </button>

        <Status state={transferState} />
      </form>
    </section>
  );
}

function ProductSelect({ items }: { items: InventoryItem[] }) {
  return (
    <>
      <label>Product</label>

      <select name="productId" required>
        <option value="">Select product</option>

        {items.map((item) => (
          <option key={item.product.id} value={item.product.id}>
            {item.product.sku}
            {" — "}
            {item.product.name}
          </option>
        ))}
      </select>
    </>
  );
}
