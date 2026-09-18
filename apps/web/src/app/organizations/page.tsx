import Link from "next/link";

import { logoutAction } from "@/features/auth/actions";

import { getCurrentUser } from "@/features/auth/get-current-user";

export default async function OrganizationsPage() {
  const user = await getCurrentUser();

  return (
    <main>
      <h1>Your organizations</h1>

      <p>Signed in as {user.email}</p>

      {user.memberships.length === 0 ? (
        <p>You do not belong to any organization.</p>
      ) : (
        <ul>
          {user.memberships.map((membership) => (
            <li key={membership.id}>
              <Link
                href={`/organizations/${membership.organization.id}/products`}
                prefetch={false}
              >
                {membership.organization.name}
              </Link>

              {" — "}

              {membership.role}
            </li>
          ))}
        </ul>
      )}

      <form action={logoutAction}>
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
