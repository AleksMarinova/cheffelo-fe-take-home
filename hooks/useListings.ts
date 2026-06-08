import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Listing } from "../types";
import {
  useGetFavoriteListingsInfiniteQuery,
  useGetListingsInfiniteQuery,
} from "../store/services/listings";
import { useGetFavoritesQuery } from "../store/services/favorites";

// Stable empty arg so a missing favorites set doesn't churn the query key.
const EMPTY_IDS: string[] = [];

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
   * attempt didn't fail. Applies to both the all-listings and favorites views.
   */
  canLoadMore: boolean;
  /** True while a next-page request is in flight. */
  isFetchingNextPage: boolean;
  /** True when the most recent `loadMore` failed; auto-loading is paused. */
  loadMoreFailed: boolean;
}

/**
 * Owns data-fetching for the listings view: listings + favorites, the favorites
 * filter, and the loading/error/empty states — keeping the component declarative.
 */
export const useListings = (favoritesOnly: boolean): UseListingsResult => {
  const { data: favorites, error: favoritesError } = useGetFavoritesQuery();

  // All listings: offset-paginated. Favorites: page through the favorited ids.
  // Only the active view's query runs.
  const allListingsQuery = useGetListingsInfiniteQuery(undefined, {
    skip: favoritesOnly,
  });
  const favoriteListingsQuery = useGetFavoriteListingsInfiniteQuery(
    favorites ?? EMPTY_IDS,
    { skip: !favoritesOnly || favorites === undefined || favorites.length === 0 },
  );

  const active = favoritesOnly ? favoriteListingsQuery : allListingsQuery;
  const {
    data,
    error: activeError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = active;

  // The hook has no next-page error flag, so track it from the trigger result.
  // A failure pauses auto-loading (stops the observer looping) until retry.
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  // Identity of the active query: stable for all-listings, the id list for
  // favorites. Used to scope the failure flag to the query it belongs to.
  const activeKey = favoritesOnly
    ? `favorites:${(favorites ?? EMPTY_IDS).join(",")}`
    : "all";
  const activeKeyRef = useRef(activeKey);
  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  // Reset the failure when the active query changes (mode or favorites switch),
  // during render rather than in an effect to avoid an extra commit.
  const [prevKey, setPrevKey] = useState(activeKey);
  if (prevKey !== activeKey) {
    setPrevKey(activeKey);
    setLoadMoreFailed(false);
  }

  const loadMore = useCallback(() => {
    setLoadMoreFailed(false);
    if (!hasNextPage || isFetchingNextPage) return;
    const keyAtStart = activeKeyRef.current;
    fetchNextPage().then((result) => {
      // Ignore a stale result from a query the user has since switched away from.
      if (result.isError && activeKeyRef.current === keyAtStart) {
        setLoadMoreFailed(true);
      }
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  // Flatten the loaded pages into one list.
  const visible = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  // Settled = first response in, or errored.
  const favoritesSettled = favorites !== undefined || Boolean(favoritesError);

  // Ready when the data needed for the active view has arrived. All-listings also
  // waits on favorites so cards don't flash "Add to favorites".
  const listingsReady = favoritesOnly
    ? favorites !== undefined && (favorites.length === 0 || data !== undefined)
    : data !== undefined && favoritesSettled;

  // Only error/load when there's nothing cached — don't blank a list on screen.
  const isError = favoritesOnly
    ? Boolean(favoritesError && !favorites) || Boolean(activeError && !data)
    : Boolean(activeError && !data);
  const isLoading = !isError && !listingsReady;

  const canLoadMore = Boolean(hasNextPage) && !loadMoreFailed;

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
