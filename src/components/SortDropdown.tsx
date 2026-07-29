"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";

type SortDropdownProps = Readonly<{
  currentSort?: string;
}>;

export default function SortDropdown({ currentSort }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectRef = useRef<HTMLSelectElement>(null);

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

  function openSortOptions(): void {
    const select = selectRef.current;

    if (!select) {
      return;
    }

    select.focus();

    try {
      select.showPicker();
    } catch {
      // Browsers without an available native picker still receive focus.
    }
  }

  return (
    <div className="store-select-control group flex min-h-11 cursor-pointer items-center rounded-ui border border-border bg-surface shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-border-hover">
      <label
        htmlFor="product-sort"
        onClick={(event) => {
          event.preventDefault();
          openSortOptions();
        }}
        className="flex min-h-11 shrink-0 cursor-pointer items-center border-r border-border px-3 text-sm font-semibold text-muted transition-colors duration-200 group-hover:text-brand-700"
      >
        Sort by
      </label>
      <div className="relative">
        <select
          ref={selectRef}
          id="product-sort"
          name="sort"
          value={sort}
          onChange={handleChange}
          className="min-h-11 w-40 cursor-pointer appearance-none rounded-ui border-0 bg-surface py-2 pl-3 pr-10 font-medium text-foreground focus-visible:outline-none lg:w-48"
        >
          <option value="">Newest first</option>
          <option value="price-asc">Price: Low to high</option>
          <option value="price-desc">Price: High to low</option>
        </select>

        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted transition-colors duration-200 group-hover:text-brand-700"
        >
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
