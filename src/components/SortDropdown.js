"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortDropdown({ currentSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(event) {
    const params = new URLSearchParams(searchParams.toString());

    const selectedSort = event.target.value;

    if (selectedSort) {
      params.set("sort", selectedSort);
    } else {
      params.delete("sort");
    }

    router.push(`/products?${params.toString()}`);
  }

  return (
    <select
      name="sort"
      defaultValue={currentSort || ""}
      onChange={handleChange}
      className="border rounded px-4 py-2 mb-6"
    >
      <option value="">Newest</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
    </select>
  );
}
