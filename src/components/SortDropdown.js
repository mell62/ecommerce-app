"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SortDropdown({ currentSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sort, setSort] = useState(currentSort || "");

  useEffect(() => {
    setSort(searchParams.get("sort") || "");
  }, [searchParams]);

  function handleChange(event) {
    const selectedSort = event.target.value;

    setSort(selectedSort);

    const params = new URLSearchParams(searchParams.toString());

    if (selectedSort) {
      params.set("sort", selectedSort);
    } else {
      params.delete("sort");
    }

    const queryString = params.toString();

    router.push(queryString ? `/products?${queryString}` : "/products");
  }

  return (
    <select
      name="sort"
      value={sort}
      onChange={handleChange}
      className="border rounded px-4 py-2 mb-6"
    >
      <option value="">Newest</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
    </select>
  );
}
