"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface FilterOption {
  href: string;
  label: string;
  isActive: (filter: string | null) => boolean;
}

const filters: FilterOption[] = [
  {
    href: "/listings",
    label: "All listings",
    isActive: (filter) => filter === null,
  },
  {
    href: "/listings?filter=favorites",
    label: "Favorites only",
    isActive: (filter) => filter === "favorites",
  },
];

export const FilterNav = () => {
  const filter = useSearchParams().get("filter");

  return (
    <nav aria-label="Listings filter" className="flex gap-4 mt-4">
      {filters.map(({ href, label, isActive }) => {
        const active = isActive(filter);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={active ? "filter-link-active" : "filter-link"}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};
