"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SubmitEvent } from "react";
import { useEffect, useState } from "react";

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minRating, setMinRating] = useState(
    searchParams.get("minRating") || ""
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
     * Keep the form fields synchronized with URL changes, including back/forward
     * navigation. These values come from Next.js rather than another React state.
     */
    setSearch(searchParams.get("search") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setMinRating(searchParams.get("minRating") || "");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  function applyFilters(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    if (minPrice) {
      params.set("minPrice", minPrice);
    } else {
      params.delete("minPrice");
    }

    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    } else {
      params.delete("maxPrice");
    }

    if (minRating) {
      params.set("minRating", minRating);
    } else {
      params.delete("minRating");
    }

    const queryString = params.toString();

    router.push(queryString ? `/products?${queryString}` : "/products");
  }

  function clearFilters(): void {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("search");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("minRating");
    params.delete("deals");

    const queryString = params.toString();

    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");

    router.push(queryString ? `/products?${queryString}` : "/products");
  }

  return (
    <form
      onSubmit={applyFilters}
      className="mb-6 rounded-ui border border-border bg-surface p-4 shadow-sm sm:p-6"
    >
      <fieldset>
        <legend className="px-1 text-lg font-semibold text-foreground">
          Filter products
        </legend>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="product-search"
              className="mb-1.5 block text-sm font-semibold text-foreground"
            >
              Search
            </label>
            <input
              id="product-search"
              name="search"
              type="search"
              placeholder="Search by product name"
              autoComplete="off"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="store-field min-h-11 w-full rounded-ui border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted"
            />
          </div>

          <div>
            <label
              htmlFor="minimum-price"
              className="mb-1.5 block text-sm font-semibold text-foreground"
            >
              Minimum price
            </label>
            <input
              id="minimum-price"
              name="minPrice"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="$0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="store-field min-h-11 w-full rounded-ui border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted"
            />
          </div>

          <div>
            <label
              htmlFor="maximum-price"
              className="mb-1.5 block text-sm font-semibold text-foreground"
            >
              Maximum price
            </label>
            <input
              id="maximum-price"
              name="maxPrice"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="Any price"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="store-field min-h-11 w-full rounded-ui border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-11 w-fit cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
            <span className="relative grid size-5 shrink-0 place-items-center">
              <input
                type="checkbox"
                name="minRating"
                value="4"
                checked={minRating === "4"}
                onChange={(event) => {
                  setMinRating(event.target.checked ? "4" : "");
                }}
                className="peer size-5 appearance-none rounded border border-muted bg-surface checked:border-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="pointer-events-none absolute hidden size-4 text-brand-600 peer-checked:block"
              >
                <path
                  d="m5 10 3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>4 stars and above</span>
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-ui border border-border bg-surface px-5 py-2.5 font-semibold text-foreground hover:border-brand-500 hover:text-brand-700"
            >
              Clear filters
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card"
            >
              Apply filters
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
