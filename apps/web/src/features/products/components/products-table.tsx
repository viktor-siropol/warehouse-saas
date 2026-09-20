import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Product } from "../types";

type ProductsTableProps = {
  products: Product[];
};

export function ProductsTable({ products }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-sm font-medium">No products yet</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Create your first product to start managing inventory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>

            <TableHead>Product</TableHead>

            <TableHead>Category</TableHead>

            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-mono text-xs font-medium">
                {product.sku}
              </TableCell>

              <TableCell>
                <div>
                  <p className="font-medium">{product.name}</p>

                  {product.description && (
                    <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                      {product.description}
                    </p>
                  )}
                </div>
              </TableCell>

              <TableCell>{product.category.name}</TableCell>

              <TableCell>
                <Badge variant={product.isActive ? "secondary" : "outline"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
