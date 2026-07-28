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
    <div className="flex min-h-11 items-center rounded-ui border border-border bg-surface shadow-sm focus-within:border-brand-500">
      <label
        htmlFor="product-sort"
        className="shrink-0 border-r border-border px-3 text-sm font-semibold text-muted"
      >
        Sort by
      </label>
      <select
        id="product-sort"
        name="sort"
        value={sort}
        onChange={handleChange}
        className="store-field min-h-11 w-36 rounded-ui border-0 bg-surface px-3 py-2 font-medium text-foreground lg:w-48"
      >
        <option value="">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>
    </div>
  );
}
