import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Listing } from "../types";
import {
  useGetFavoriteListingsInfiniteQuery,
  useGetListingsInfiniteQuery,
} from "../store/services/listings";
import { useGetFavoritesQuery } from "../store/services/favorites";

// Stable empty arg so a missing favorites set doesn't churn the query key.
const EMPTY_IDS: string[] = [];

// In favorites mode, show only currently-favorited listings. RTK retains the last
// successful page when the favorites query is skipped (e.g. after removing the last
// favorite), so trusting that data alone would leave a removed card on screen.
export const getVisibleListings = (
  pages: Listing[],
  favoritesOnly: boolean,
  favoriteIds: ReadonlySet<string>,
): Listing[] =>
  favoritesOnly ? pages.filter((listing) => favoriteIds.has(listing.id)) : pages;

// Layout effect on the client (runs in commit, before async callbacks can read
// the ref), plain effect on the server to avoid the SSR warning.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  useIsomorphicLayoutEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  // Reset the failure when the active query changes (mode or favorites switch),
  // during render rather than in an effect to avoid an extra commit.
  const [prevKey, setPrevKey] = useState(activeKey);
  if (prevKey !== activeKey) {
    setPrevKey(activeKey);
    setLoadMoreFailed(false);
  }

  // Synchronous in-flight guard: the IntersectionObserver can fire repeatedly
  // before `isFetchingNextPage` re-renders, so track in-flight requests per
  // active query (set before the request, cleared when it settles). Keying by
  // query — not a single boolean — lets a newly switched view load even while
  // the previous view's request is still pending.
  const inFlightKeysRef = useRef(new Set<string>());

  const loadMore = useCallback(() => {
    setLoadMoreFailed(false);
    // `activeKey` is captured directly (not via the ref) so the synchronous
    // guard always uses the current query — loadMore is recreated and the
    // observer reconnects whenever it changes.
    if (inFlightKeysRef.current.has(activeKey) || !hasNextPage) return;
    inFlightKeysRef.current.add(activeKey);
    fetchNextPage().then((result) => {
      inFlightKeysRef.current.delete(activeKey);
      // Ignore a stale result from a query the user has since switched away from.
      // The ref holds the latest key; it's settled by the time the request ends.
      if (result.isError && activeKeyRef.current === activeKey) {
        setLoadMoreFailed(true);
      }
    });
  }, [fetchNextPage, hasNextPage, activeKey]);

  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  // Flatten the loaded pages, filtering to current favorites in favorites mode.
  const visible = useMemo(() => {
    const pages = data?.pages.flatMap((page) => page.data) ?? [];
    return getVisibleListings(pages, favoritesOnly, favoriteIds);
  }, [data, favoritesOnly, favoriteIds]);

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
