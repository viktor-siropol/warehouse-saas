export type DashboardSummary = {
  catalog: {
    activeProducts: number;

    activeWarehouses: number;
  };

  inventory: {
    onHand: string;

    reserved: string;

    available: string;

    inventoryPositions: number;

    lowStockPositions: number;
  };

  orders: {
    openPurchaseOrders: number;

    openSalesOrders: number;
  };

  recentMovements: Array<{
    id: string;

    type: string;

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
  }>;

  recentAudit: Array<{
    id: string;

    action: string;

    entityType: string;

    entityId: string | null;

    createdAt: string;

    actorUser: {
      id: string;

      email: string;

      firstName: string;

      lastName: string;
    } | null;
  }>;
};

export type InventoryWarehouseReport = {
  warehouseId: string;

  warehouseCode: string;

  warehouseName: string;

  productPositions: number;

  lowStockPositions: number;

  onHand: string;

  reserved: string;

  available: string;
};

export type MovementSummaryItem = {
  date: string;

  inbound: string;

  outbound: string;

  movementCount: number;
};

export type OrderStatusSummary = {
  purchaseOrders: Array<{
    status: string;

    count: number;
  }>;

  salesOrders: Array<{
    status: string;

    count: number;
  }>;
};

export type AuditLogItem = {
  id: string;

  action: string;

  entityType: string;

  entityId: string | null;

  metadata: unknown;

  createdAt: string;

  actorUser: {
    id: string;

    email: string;

    firstName: string;

    lastName: string;
  } | null;
};

export type AuditLogPage = {
  items: AuditLogItem[];

  nextCursor: string | null;
};
