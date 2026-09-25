export type Customer = {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  shippingAddress: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  _count: {
    salesOrders: number;
  };
};

export type CustomerActionState = {
  error: string | null;
  success: string | null;
};
