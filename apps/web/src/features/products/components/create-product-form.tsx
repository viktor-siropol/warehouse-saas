"use client";

import { useState } from "react";

import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

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

      setSuccess("Product created successfully.");
    } catch {
      setError("Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>

          <Input
            id="sku"
            name="sku"
            placeholder="IPH-17-BLK-256"
            required
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Product name</Label>

          <Input
            id="name"
            name="name"
            placeholder="iPhone 17"
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>

          <select
            id="categoryId"
            name="categoryId"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            <option value="">Select category</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>

          <Textarea
            id="description"
            name="description"
            placeholder="Optional product description"
            maxLength={2000}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {success && <p className="text-sm text-success">{success}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create product"}
      </Button>
    </form>
  );
}
