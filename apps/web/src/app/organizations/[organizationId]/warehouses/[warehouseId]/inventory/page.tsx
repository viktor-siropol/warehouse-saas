import { getCurrentUser } from "@/features/auth/get-current-user";

import { getWarehouseInventory } from "@/features/inventory/api/get-warehouse-inventory";

import { ReorderPointForm } from "@/features/inventory/components/reorder-point-form";

import { StockOperationForms } from "@/features/inventory/components/stock-operation-forms";

import { getWarehouses } from "@/features/warehouses/api/get-warehouses";

type InventoryPageProps = {
  params: Promise<{
    organizationId: string;
    warehouseId: string;
  }>;
};

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { organizationId, warehouseId } = await params;

  const [inventory, warehouses, user] = await Promise.all([
    getWarehouseInventory(organizationId, warehouseId),

    getWarehouses(organizationId),

    getCurrentUser(),
  ]);

  const membership = user.memberships.find(
    (item) => item.organization.id === organizationId,
  );

  const canManage = membership !== undefined && membership.role !== "WORKER";

  return (
    <main>
      <h1>
        {inventory.warehouse.code}
        {" — "}
        {inventory.warehouse.name}
      </h1>

      <StockOperationForms
        organizationId={organizationId}
        warehouseId={warehouseId}
        items={inventory.items}
        warehouses={warehouses}
        canAdjust={canManage}
      />

      <h2>Inventory</h2>

      <table>
        <thead>
          <tr>
            <th>SKU</th>

            <th>Product</th>

            <th>Category</th>

            <th>Quantity</th>

            <th>Reorder point</th>
          </tr>
        </thead>

        <tbody>
          {inventory.items.map((item) => (
            <tr key={item.product.id}>
              <td>{item.product.sku}</td>

              <td>{item.product.name}</td>

              <td>{item.product.category.name}</td>

              <td>{item.quantity}</td>

              <td>
                {canManage ? (
                  <ReorderPointForm
                    organizationId={organizationId}
                    warehouseId={warehouseId}
                    productId={item.product.id}
                    currentValue={item.reorderPoint}
                  />
                ) : (
                  item.reorderPoint
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
