import Link from "next/link";

type OrganizationPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { organizationId } = await params;

  return (
    <main>
      <h1>Organization</h1>

      <nav>
        <ul>
          <li>
            <Link href={`/organizations/${organizationId}/products`}>
              Products
            </Link>
          </li>

          <li>
            <Link href={`/organizations/${organizationId}/warehouses`}>
              Warehouses
            </Link>
          </li>

          <li>
            <Link href={`/organizations/${organizationId}/inventory/low-stock`}>
              Low stock
            </Link>
          </li>

          <li>
            <Link href={`/organizations/${organizationId}/stock-movements`}>
              Stock movement history
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
