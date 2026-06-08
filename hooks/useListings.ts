import { useCallback, useMemo, useState } from "react";

import { Listing } from "../types";
import {
  useGetListingsByIdsQuery,
  useGetListingsInfiniteQuery,
} from "../store/services/listings";
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
  /** Loads the next page of listings; clears a prior load-more failure. */
  loadMore: () => void;
  /**
   * True while it's worth loading another page: more pages remain and the last
   * attempt didn't fail. Always false in favorites view, which isn't paginated.
   */
  canLoadMore: boolean;
  /** True while a next-page request is in flight. */
  isFetchingNextPage: boolean;
  /** True when the most recent `loadMore` failed; auto-loading is paused. */
  loadMoreFailed: boolean;
}

/**
 * Owns the data-fetching for the listings view: listings + favorites, the
 * derived favorites filter, and the loading/error/empty states. Keeps the
 * consuming component declarative and free of query wiring.
 */
export const useListings = (favoritesOnly: boolean): UseListingsResult => {
  // All-listings view: paginated infinite query. Skipped in favorites mode,
  // which fetches its bounded set directly instead of scrolling to find them.
  const {
    data: listings,
    error: listingsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetListingsInfiniteQuery(undefined, { skip: favoritesOnly });

  const { data: favorites, error: favoritesError } = useGetFavoritesQuery();

  // Favorites view: fetch exactly the favorited listings by id in one request,
  // independent of how many paginated pages have loaded. Skipped until there are
  // favorite ids to resolve.
  const { data: favoriteListings, error: favoriteListingsError } =
    useGetListingsByIdsQuery(favorites ?? [], {
      skip: !favoritesOnly || favorites === undefined || favorites.length === 0,
    });

  // The React hook doesn't surface a next-page error flag, so track failures
  // from the trigger's resolved result. A failure pauses auto-loading until the
  // user retries, preventing the IntersectionObserver from looping on a broken
  // request.
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    setLoadMoreFailed(false);
    fetchNextPage().then((result) => {
      if (result.isError) setLoadMoreFailed(true);
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  // Flatten the accumulated pages into a single list for the all-listings view.
  const allListings = useMemo(
    () => listings?.pages.flatMap((page) => page.data) ?? [],
    [listings],
  );

  const visible = favoritesOnly ? (favoriteListings ?? []) : allListings;

  // RTK Query data is `undefined` until the first response; treat a query as
  // "settled" once it has data or has errored.
  const favoritesSettled = favorites !== undefined || Boolean(favoritesError);

  // Favorites view needs the listings-by-id response (or an empty favorites set
  // that needs no lookup). All-listings view needs the first page plus settled
  // favorites, so already-favorited cards don't flash "Add to favorites".
  const listingsReady = favoritesOnly
    ? favorites !== undefined &&
      (favorites.length === 0 || favoriteListings !== undefined)
    : listings !== undefined && favoritesSettled;

  // Surface error/loading only when there's no cached data to show — a failed
  // background refetch must not blank a list already on screen. A favorites-ids
  // failure on the all-listings view degrades to "no favorites", not an error.
  const isError = favoritesOnly
    ? Boolean(favoritesError && !favorites) ||
      Boolean(favoriteListingsError && !favoriteListings)
    : Boolean(listingsError && !listings);
  const isLoading = !isError && !listingsReady;

  const canLoadMore = hasNextPage && !loadMoreFailed;

  const isEmpty =
    !isError && !isLoading && favoritesOnly && visible.length === 0;

  return {
    listings: visible,
    favoriteIds,
    isLoading,
    isError,
    isEmpty,
    loadMore,
    canLoadMore,
    isFetchingNextPage,
    loadMoreFailed,
  };
};
