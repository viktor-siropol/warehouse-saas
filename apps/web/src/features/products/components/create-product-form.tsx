"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { createProduct } from "../api/create-product";
import type { Category } from "../types";

type CreateProductFormProps = {
  organizationId: string;
  categories: Category[];
};

export function CreateProductForm({
  organizationId,
  categories,
}: CreateProductFormProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await createProduct(organizationId, {
        categoryId: String(formData.get("categoryId")),

        sku: String(formData.get("sku")),

        name: String(formData.get("name")),

        description: String(formData.get("description") ?? "") || undefined,
      });

      form.reset();

      setSuccess("Product created successfully");

      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="sku">SKU</label>

        <input id="sku" name="sku" type="text" required />
      </div>

      <div>
        <label htmlFor="name">Name</label>

        <input id="name" name="name" type="text" required />
      </div>

      <div>
        <label htmlFor="categoryId">Category</label>

        <select id="categoryId" name="categoryId" required>
          <option value="">Select category</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description">Description</label>

        <textarea id="description" name="description" />
      </div>

      {error && <p role="alert">{error}</p>}

      {success && <p>{success}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create product"}
      </button>
    </form>
  );
}
