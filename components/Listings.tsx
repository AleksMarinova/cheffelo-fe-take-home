"use client";

import React, { HTMLAttributes } from "react";
import { useSearchParams } from "next/navigation";

import { ListingCard } from "./ListingCard";
import { useListings } from "../hooks/useListings";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

interface ListingsProps extends HTMLAttributes<HTMLUListElement> {}

export const Listings = (props: ListingsProps) => {
  const favoritesOnly = useSearchParams().get("filter") === "favorites";
  const {
    listings,
    favoriteIds,
    isLoading,
    isError,
    isEmpty,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    loadMoreFailed,
  } = useListings(favoritesOnly);

  // The sentinel only exists in the DOM once we're past the loading/error/empty
  // early-returns below. Gate the observer on that same condition so it
  // re-attaches when the sentinel actually mounts — otherwise a fresh load where
  // `canLoadMore` flips true while still loading favorites would never observe.
  const showSentinel = !isError && !isLoading && !isEmpty && canLoadMore;

  const setSentinel = useInfiniteScroll<HTMLLIElement>(loadMore, {
    enabled: showSentinel,
    isFetching: isFetchingNextPage,
  });

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
      {canLoadMore && (
        <li
          ref={setSentinel}
          role="status"
          className="col-span-full min-h-px text-center"
        >
          {isFetchingNextPage ? "Loading more listings…" : null}
        </li>
      )}
      {loadMoreFailed && (
        <li role="alert" className="col-span-full text-center text-red-700">
          Couldn&apos;t load more listings.{" "}
          <button type="button" onClick={loadMore} className="underline">
            Try again
          </button>
        </li>
      )}
    </ul>
  );
};
