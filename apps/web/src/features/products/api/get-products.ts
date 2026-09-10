import type { Product } from "../types";

export async function getProducts(organizationId: string): Promise<Product[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(
    `${apiUrl}/organizations/${organizationId}/products`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load products");
  }

  return response.json() as Promise<Product[]>;
}
