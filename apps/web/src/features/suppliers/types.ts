export type Supplier = {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  _count: {
    purchaseOrders: number;
  };
};

export type SupplierActionState = {
  error: string | null;
  success: string | null;
};
