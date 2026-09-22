export type PurchaseOrderStatus =
  "DRAFT" | "SUBMITTED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

export type PurchaseOrderListItem = {
  id: string;
  number: string;
  status: PurchaseOrderStatus;
  currency: string;
  note: string | null;
  submittedAt: string | null;
  receivedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;

  supplier: {
    id: string;
    code: string;
    name: string;
  };

  warehouse: {
    id: string;
    code: string;
    name: string;
  };

  _count: {
    items: number;
    receipts: number;
  };
};

export type PurchaseOrderDetail = {
  id: string;
  number: string;
  status: PurchaseOrderStatus;
  currency: string;
  note: string | null;
  submittedAt: string | null;
  receivedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;

  supplier: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  };

  warehouse: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  };

  items: Array<{
    id: string;
    orderedQuantity: string;
    receivedQuantity: string;
    remainingQuantity: string;
    unitCost: string;

    product: {
      id: string;
      sku: string;
      name: string;
    };
  }>;

  receipts: Array<{
    id: string;
    note: string | null;
    createdAt: string;

    receivedBy: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    } | null;
  }>;
};

export type ProcurementActionState = {
  error: string | null;
  success: string | null;
};
