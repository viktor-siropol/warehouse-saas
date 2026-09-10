import { getCategories } from "@/features/products/api/get-categories";
import { getProducts } from "@/features/products/api/get-products";
import { CreateProductForm } from "@/features/products/components/create-product-form";
import { ProductsTable } from "@/features/products/components/products-table";

type ProductsPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { organizationId } = await params;

  const [products, categories] = await Promise.all([
    getProducts(organizationId),
    getCategories(organizationId),
  ]);

  return (
    <main>
      <h1>Products</h1>

      <CreateProductForm
        organizationId={organizationId}
        categories={categories}
      />

      <ProductsTable products={products} />
    </main>
  );
}
