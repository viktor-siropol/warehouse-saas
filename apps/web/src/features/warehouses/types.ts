export type Warehouse = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseActionState = {
  error: string | null;
  success: string | null;
};
