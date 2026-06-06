import { useMemo } from "react";

import { Listing } from "../types";
import { useGetListingsQuery } from "../store/services/listings";
import { useGetFavoritesQuery } from "../store/services/favorites";

export interface UseListingsResult {
  /** Listings to render — filtered to favorites when `favoritesOnly` is set. */
  listings: Listing[];
  /** Set of favorited listing IDs, for per-card `isFavorite` lookups. */
  favoriteIds: Set<string>;
  isLoading: boolean;
  isError: boolean;
  /** True once data has loaded but the favorites filter yields nothing. */
  isEmpty: boolean;
}

/**
 * Owns the data-fetching for the listings view: listings + favorites, the
 * derived favorites filter, and the loading/error/empty states. Keeps the
 * consuming component declarative and free of query wiring.
 */
export function useListings(favoritesOnly: boolean): UseListingsResult {
  const { data: listings, error: listingsError } = useGetListingsQuery();
  const { data: favorites, error: favoritesError } = useGetFavoritesQuery();

  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  const visible = useMemo(() => {
    if (!listings) return [];
    if (!favoritesOnly) return listings.data;
    return listings.data.filter((listing) => favoriteIds.has(listing.id));
  }, [listings, favoritesOnly, favoriteIds]);

  // RTK Query data is `undefined` until the first response; treat a query as
  // "settled" once it has data or has errored.
  const favoritesSettled = favorites !== undefined || Boolean(favoritesError);

  // Favorites are needed to label every card correctly, so wait for them to
  // settle before first paint even on the all-listings view — otherwise an
  // already-favorited card briefly shows "Add to favorites". The favorites
  // filter additionally needs the real data, not just a settled state.
  const favoritesReady = favoritesOnly ? favorites !== undefined : favoritesSettled;
  const listingsReady = listings !== undefined;

  // Surface error/loading only when there's no cached data to show — a failed
  // background refetch must not blank a list already on screen. A favorites
  // failure on the all-listings view degrades to "no favorites", not an error.
  const isError =
    Boolean(listingsError && !listings) ||
    Boolean(favoritesOnly && favoritesError && !favorites);
  const isLoading = !isError && (!listingsReady || !favoritesReady);
  const isEmpty =
    !isError && !isLoading && favoritesOnly && visible.length === 0;

  return {
    listings: visible,
    favoriteIds,
    isLoading,
    isError,
    isEmpty,
  };
}
