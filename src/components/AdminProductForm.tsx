"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import {
  PRODUCT_CATEGORY_MAX_LENGTH,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_IMAGE_URL_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  type ProductInputErrors,
  type ProductInputField,
} from "@/lib/product-input";

type ProductFormValues = Readonly<{
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: string;
  stockCount: string;
  discountPercent: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
}>;

const initialValues: ProductFormValues = {
  name: "",
  description: "",
  category: "",
  imageUrl: "",
  price: "",
  stockCount: "0",
  discountPercent: "0",
  isFeatured: false,
  isNew: false,
  isBestSeller: false,
};

const productFields: readonly ProductInputField[] = [
  "name",
  "description",
  "category",
  "imageUrl",
  "price",
  "stockCount",
  "discountPercent",
  "isFeatured",
  "isNew",
  "isBestSeller",
];

function readApiError(data: unknown): {
  message: string;
  fieldErrors: ProductInputErrors;
} {
  const fieldErrors: ProductInputErrors = {};

  if (typeof data === "object" && data !== null) {
    if (
      "fieldErrors" in data &&
      typeof data.fieldErrors === "object" &&
      data.fieldErrors !== null
    ) {
      for (const field of productFields) {
        const value = (data.fieldErrors as Record<string, unknown>)[field];

        if (typeof value === "string") {
          fieldErrors[field] = value;
        }
      }
    }

    if ("error" in data && typeof data.error === "string") {
      return {
        message: data.error,
        fieldErrors,
      };
    }
  }

  return {
    message: "Failed to create product.",
    fieldErrors,
  };
}

export default function AdminProductForm() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<ProductInputErrors>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Key extends keyof ProductFormValues>(
    field: Key,
    value: ProductFormValues[Key]
  ): void {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setError("");
  }

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          price: Number(values.price),
          stockCount: Number(values.stockCount),
          discountPercent: Number(values.discountPercent),
        }),
      });
      const contentType = response.headers.get("content-type");
      const data: unknown = contentType?.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        const apiError = readApiError(data);
        setError(apiError.message);
        setFieldErrors(apiError.fieldErrors);
        return;
      }

      router.push("/admin/products?created=true");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "store-field mt-2 min-h-12 w-full rounded-ui border border-border bg-surface px-3.5 py-2.5 text-foreground shadow-sm placeholder:text-muted/70 hover:border-border-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70";

  return (
    <form
      aria-label="Create product"
      aria-busy={isSubmitting}
      onSubmit={handleSubmit}
      className="mt-8 space-y-8"
    >
      <section
        aria-labelledby="product-details-heading"
        className="rounded-ui border border-border bg-surface p-5 shadow-sm sm:p-6"
      >
        <h2
          id="product-details-heading"
          className="font-display text-xl font-semibold text-foreground"
        >
          Product details
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Add the customer-facing information shown throughout the catalog.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="product-name" className="text-sm font-semibold">
              Product name
            </label>
            <input
              id="product-name"
              name="name"
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              required
              maxLength={PRODUCT_NAME_MAX_LENGTH}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "product-name-error" : undefined}
              className={inputClassName}
              placeholder="Wireless headphones"
            />
            {fieldErrors.name && (
              <p id="product-name-error" className="mt-2 text-sm text-danger">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="product-description"
              className="text-sm font-semibold"
            >
              Description
            </label>
            <textarea
              id="product-description"
              name="description"
              value={values.description}
              onChange={(event) =>
                updateValue("description", event.target.value)
              }
              required
              rows={5}
              maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={`product-description-help${fieldErrors.description ? " product-description-error" : ""}`}
              className={`${inputClassName} resize-none`}
              placeholder="Describe the product's most useful features."
            />
            <div className="mt-2 flex justify-between gap-4 text-xs text-muted">
              <p id="product-description-help">
                Write clear, customer-focused product information.
              </p>
              <p className="shrink-0">
                {values.description.length.toLocaleString()} /{" "}
                {PRODUCT_DESCRIPTION_MAX_LENGTH.toLocaleString()}
              </p>
            </div>
            {fieldErrors.description && (
              <p
                id="product-description-error"
                className="mt-2 text-sm text-danger"
              >
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="product-category" className="text-sm font-semibold">
              Category
            </label>
            <input
              id="product-category"
              name="category"
              value={values.category}
              onChange={(event) => updateValue("category", event.target.value)}
              required
              maxLength={PRODUCT_CATEGORY_MAX_LENGTH}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.category)}
              aria-describedby={
                fieldErrors.category ? "product-category-error" : undefined
              }
              className={inputClassName}
              placeholder="Audio"
            />
            {fieldErrors.category && (
              <p
                id="product-category-error"
                className="mt-2 text-sm text-danger"
              >
                {fieldErrors.category}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="product-image" className="text-sm font-semibold">
              Image URL
            </label>
            <input
              id="product-image"
              name="imageUrl"
              type="text"
              value={values.imageUrl}
              onChange={(event) => updateValue("imageUrl", event.target.value)}
              required
              maxLength={PRODUCT_IMAGE_URL_MAX_LENGTH}
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.imageUrl)}
              aria-describedby={`product-image-help${fieldErrors.imageUrl ? " product-image-error" : ""}`}
              className={inputClassName}
              placeholder="/products/headphones.png"
            />
            <p id="product-image-help" className="mt-2 text-xs text-muted">
              Use a local image path or an images.unsplash.com HTTPS URL.
            </p>
            {fieldErrors.imageUrl && (
              <p id="product-image-error" className="mt-2 text-sm text-danger">
                {fieldErrors.imageUrl}
              </p>
            )}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="pricing-inventory-heading"
        className="rounded-ui border border-border bg-surface p-5 shadow-sm sm:p-6"
      >
        <h2
          id="pricing-inventory-heading"
          className="font-display text-xl font-semibold text-foreground"
        >
          Pricing and inventory
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Prices use US dollars. Stock cannot fall below zero.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {(
            [
              {
                field: "price",
                label: "Price",
                min: "0.01",
                step: "0.01",
                placeholder: "149.99",
              },
              {
                field: "stockCount",
                label: "Stock count",
                min: "0",
                step: "1",
                placeholder: "0",
              },
              {
                field: "discountPercent",
                label: "Discount percent",
                min: "0",
                max: "100",
                step: "1",
                placeholder: "0",
              },
            ] as const
          ).map(({ field, label, ...attributes }) => (
            <div key={field}>
              <label htmlFor={`product-${field}`} className="text-sm font-semibold">
                {label}
              </label>
              <input
                id={`product-${field}`}
                name={field}
                type="number"
                inputMode="decimal"
                value={values[field]}
                onChange={(event) => updateValue(field, event.target.value)}
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors[field])}
                aria-describedby={
                  fieldErrors[field] ? `product-${field}-error` : undefined
                }
                className={inputClassName}
                {...attributes}
              />
              {fieldErrors[field] && (
                <p
                  id={`product-${field}-error`}
                  className="mt-2 text-sm text-danger"
                >
                  {fieldErrors[field]}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <fieldset className="rounded-ui border border-border bg-surface p-5 shadow-sm sm:p-6">
        <legend className="px-1 font-display text-xl font-semibold text-foreground">
          Catalog placement
        </legend>
        <p className="mt-1 text-sm leading-6 text-muted">
          Choose the special collections where this product should appear.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["isFeatured", "Featured product"],
              ["isNew", "New arrival"],
              ["isBestSeller", "Best seller"],
            ] as const
          ).map(([field, label]) => (
            <label
              key={field}
              className="flex min-h-[var(--store-touch-target)] cursor-pointer items-center gap-3 rounded-ui border border-border px-4 py-3 text-sm font-semibold hover:border-border-hover"
            >
              <input
                type="checkbox"
                name={field}
                checked={values[field]}
                onChange={(event) => updateValue(field, event.target.checked)}
                disabled={isSubmitting}
                className="size-5 accent-brand-600"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p
          className="rounded-ui border border-danger/25 bg-danger/5 px-4 py-3 text-sm leading-6 text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isSubmitting && (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
            />
          )}
          {isSubmitting ? "Creating product..." : "Create product"}
        </button>
        <Link
          href="/admin/products"
          aria-disabled={isSubmitting}
          onClick={(event) => {
            if (isSubmitting) {
              event.preventDefault();
            }
          }}
          className="inline-flex min-h-12 items-center justify-center rounded-ui border border-border bg-surface px-5 py-2.5 font-semibold text-foreground shadow-sm hover:border-border-hover hover:text-brand-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
