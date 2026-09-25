export type SalesOrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PARTIALLY_RESERVED"
  | "RESERVED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "CANCELLED";

export type SalesOrderListItem = {
  id: string;
  number: string;
  status: SalesOrderStatus;
  currency: string;
  note: string | null;
  customerNameSnapshot: string;
  confirmedAt: string | null;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;

  customer: {
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
    fulfillments: number;
  };
};

export type SalesOrderDetail = {
  id: string;
  number: string;
  status: SalesOrderStatus;
  currency: string;
  note: string | null;
  customerNameSnapshot: string;
  shippingAddressSnapshot: string | null;

  confirmedAt: string | null;

  fulfilledAt: string | null;

  cancelledAt: string | null;

  createdAt: string;
  updatedAt: string;
  warehouseId: string;

  customer: {
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
    productId: string;

    orderedQuantity: string;

    reservedQuantity: string;

    fulfilledQuantity: string;

    remainingToReserve: string;

    remainingToFulfill: string;

    unitPrice: string;

    warehouseOnHandQuantity: string;

    warehouseReservedQuantity: string;

    warehouseAvailableQuantity: string;

    product: {
      id: string;
      sku: string;
      name: string;
    };
  }>;

  fulfillments: Array<{
    id: string;
    note: string | null;
    createdAt: string;

    fulfilledBy: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    } | null;
  }>;
};

export type SalesOrderActionState = {
  error: string | null;
  success: string | null;
};
