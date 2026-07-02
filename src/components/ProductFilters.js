"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
  }, [searchParams]);

  function applyFilters(event) {
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

    const queryString = params.toString();

    router.push(queryString ? `/products?${queryString}` : "/products");
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("search");
    params.delete("minPrice");
    params.delete("maxPrice");

    const queryString = params.toString();

    setSearch("");
    setMinPrice("");
    setMaxPrice("");

    router.push(queryString ? `/products?${queryString}` : "/products");
  }

  return (
    <form onSubmit={applyFilters} className="mb-6 space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="border rounded px-4 py-2 flex-1"
        />

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Search
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          className="border rounded px-4 py-2"
        />

        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          className="border rounded px-4 py-2"
        />

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Apply
        </button>

        <button
          type="button"
          onClick={clearFilters}
          className="border px-4 py-2 rounded"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
