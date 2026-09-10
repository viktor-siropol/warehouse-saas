import type { Product } from "../types";

type ProductsTableProps = {
  products: Product[];
};

export function ProductsTable({ products }: ProductsTableProps) {
  if (products.length === 0) {
    return <p>No products yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Name</th>
          <th>Category</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.sku}</td>
            <td>{product.name}</td>
            <td>{product.category.name}</td>
            <td>{product.isActive ? "Active" : "Inactive"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
