import Link from "next/link";

import { getLowStock } from "@/features/inventory/api/get-low-stock";

type LowStockPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function LowStockPage({ params }: LowStockPageProps) {
  const { organizationId } = await params;

  const items = await getLowStock(organizationId);

  return (
    <main>
      <h1>Low stock</h1>

      {items.length === 0 ? (
        <p>No low-stock items.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Warehouse</th>

              <th>SKU</th>

              <th>Product</th>

              <th>Quantity</th>

              <th>Reorder point</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={`${item.warehouse.id}:${item.product.id}`}>
                <td>
                  <Link
                    href={`/organizations/${organizationId}/warehouses/${item.warehouse.id}/inventory`}
                  >
                    {item.warehouse.code}
                  </Link>
                </td>

                <td>{item.product.sku}</td>

                <td>{item.product.name}</td>

                <td>{item.quantity}</td>

                <td>{item.reorderPoint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
