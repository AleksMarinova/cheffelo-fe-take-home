"use client";

import React, { HTMLAttributes } from "react";
import { useSearchParams } from "next/navigation";

import { ListingCard } from "./ListingCard";
import { useListings } from "../hooks/useListings";

interface ListingsProps extends HTMLAttributes<HTMLUListElement> {}

export const Listings = (props: ListingsProps) => {
  const favoritesOnly = useSearchParams().get("filter") === "favorites";
  const { listings, favoriteIds, isLoading, isError, isEmpty } =
    useListings(favoritesOnly);

  if (isError) {
    return (
      <p role="alert" className="text-red-700">
        Could not load listings. Please refresh and try again.
      </p>
    );
  }

  if (isLoading) {
    return <p aria-live="polite">Loading listings…</p>;
  }

  if (isEmpty) {
    return <p>You haven&apos;t favorited any listings yet.</p>;
  }

  return (
    <ul
      className="grid items-stretch grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      {...props}
    >
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isFavorite={favoriteIds.has(listing.id)}
        />
      ))}
    </ul>
  );
};
