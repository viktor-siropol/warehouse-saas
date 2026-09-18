"use client";

import { useState } from "react";

import type { FormEvent } from "react";

import { createProductAction } from "../actions/create-product";

import type { Category } from "../types";

type CreateProductFormProps = {
  organizationId: string;
  categories: Category[];
};

export function CreateProductForm({
  organizationId,
  categories,
}: CreateProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    const formData = new FormData(form);

    const description = String(formData.get("description") ?? "").trim();

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await createProductAction(organizationId, {
        categoryId: String(formData.get("categoryId") ?? ""),

        sku: String(formData.get("sku") ?? "").trim(),

        name: String(formData.get("name") ?? "").trim(),

        description: description || undefined,
      });

      if (!result.ok) {
        setError(result.error);

        return;
      }

      form.reset();

      setSuccess("Product created successfully");
    } catch {
      setError("Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create product</h2>

      <div>
        <label htmlFor="sku">SKU</label>

        <input id="sku" name="sku" required maxLength={100} />
      </div>

      <div>
        <label htmlFor="name">Name</label>

        <input id="name" name="name" required maxLength={200} />
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

        <textarea id="description" name="description" maxLength={2000} />
      </div>

      {error && <p role="alert">{error}</p>}

      {success && <p>{success}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create product"}
      </button>
    </form>
  );
}
