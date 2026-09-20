import { PackagePlus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <>
      <PageHeader
        title="Products"
        description="Manage the product catalog used across your warehouses."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackagePlus className="size-4" />
            Add product
          </CardTitle>
        </CardHeader>

        <CardContent>
          <CreateProductForm
            organizationId={organizationId}
            categories={categories}
          />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Product catalog</h2>

          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>

        <ProductsTable products={products} />
      </section>
    </>
  );
}
