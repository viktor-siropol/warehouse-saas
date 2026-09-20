export type InventoryProduct = {
  id: string;
  sku: string;
  name: string;

  category: {
    id: string;
    name: string;
  };
};

export type InventoryItem = {
  product: InventoryProduct;
  quantity: string;
  reorderPoint: string;
  updatedAt: string | null;
};

export type WarehouseInventory = {
  warehouse: {
    id: string;
    name: string;
    code: string;
    address: string | null;
  };

  items: InventoryItem[];
};

export type LowStockItem = {
  quantity: string;
  reorderPoint: string;
  updatedAt: string;

  product: InventoryProduct;

  warehouse: {
    id: string;
    code: string;
    name: string;
  };
};

export type StockMovement = {
  id: string;
  operationId: string | null;

  type: "RECEIPT" | "ISSUE" | "ADJUSTMENT" | "TRANSFER_IN" | "TRANSFER_OUT";

  delta: string;
  note: string | null;
  createdAt: string;

  product: {
    id: string;
    sku: string;
    name: string;
  };

  warehouse: {
    id: string;
    code: string;
    name: string;
  };

  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type InventoryActionState = {
  error: string | null;
  success: string | null;
};
