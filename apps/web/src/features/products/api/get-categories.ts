import type { Category } from "../types";

export async function getCategories(
  organizationId: string,
): Promise<Category[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(
    `${apiUrl}/organizations/${organizationId}/categories`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load categories");
  }

  return response.json() as Promise<Category[]>;
}
