import Link from "next/link";

import { getCurrentUser } from "@/features/auth/get-current-user";

import { getWarehouses } from "@/features/warehouses/api/get-warehouses";

import { CreateWarehouseForm } from "@/features/warehouses/components/create-warehouse-form";

import { WarehouseStatusButton } from "@/features/warehouses/components/warehouse-status-button";

type WarehousesPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function WarehousesPage({ params }: WarehousesPageProps) {
  const { organizationId } = await params;

  const [warehouses, user] = await Promise.all([
    getWarehouses(organizationId),

    getCurrentUser(),
  ]);

  const membership = user.memberships.find(
    (item) => item.organization.id === organizationId,
  );

  const canManage = membership?.role !== "WORKER" && membership !== undefined;

  return (
    <main>
      <h1>Warehouses</h1>

      {canManage && <CreateWarehouseForm organizationId={organizationId} />}

      <h2>Existing warehouses</h2>

      {warehouses.length === 0 ? (
        <p>No warehouses yet.</p>
      ) : (
        <ul>
          {warehouses.map((warehouse) => (
            <li key={warehouse.id}>
              <h3>
                {warehouse.code}
                {" — "}
                {warehouse.name}
              </h3>

              <p>Status: {warehouse.isActive ? "Active" : "Inactive"}</p>

              {warehouse.address && <p>{warehouse.address}</p>}

              {warehouse.isActive && (
                <Link
                  href={`/organizations/${organizationId}/warehouses/${warehouse.id}/inventory`}
                >
                  Open inventory
                </Link>
              )}

              {canManage && (
                <WarehouseStatusButton
                  organizationId={organizationId}
                  warehouseId={warehouse.id}
                  isActive={warehouse.isActive}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
