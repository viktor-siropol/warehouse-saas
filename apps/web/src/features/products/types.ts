export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  organizationId: string;
  categoryId: string;
  sku: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: Category;
};

export type CreateProductInput = {
  categoryId: string;
  sku: string;
  name: string;
  description?: string;
};
