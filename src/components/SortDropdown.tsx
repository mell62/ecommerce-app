"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

type SortDropdownProps = Readonly<{
  currentSort?: string;
}>;

export default function SortDropdown({ currentSort }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sort, setSort] = useState(currentSort || "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize the selected option with back/forward URL navigation.
    setSort(searchParams.get("sort") || "");
  }, [searchParams]);

  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    const selectedSort = event.currentTarget.value;

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
