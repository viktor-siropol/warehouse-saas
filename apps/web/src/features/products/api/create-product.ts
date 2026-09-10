import type { CreateProductInput, Product } from "../types";

export async function createProduct(
  organizationId: string,
  input: CreateProductInput,
): Promise<Product> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(
    `${apiUrl}/organizations/${organizationId}/products`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);

    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(", ")
      : (errorBody?.message ?? "Failed to create product");

    throw new Error(message);
  }

  return response.json() as Promise<Product>;
}
