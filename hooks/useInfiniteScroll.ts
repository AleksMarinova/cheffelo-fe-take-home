import { useCallback, useRef } from "react";

interface UseInfiniteScrollOptions {
  /** Whether intersections should trigger `onLoadMore`. */
  enabled: boolean;
  /** True while a load is in flight, to avoid stacking duplicate requests. */
  isFetching: boolean;
  /** Pre-fetch distance before the sentinel reaches the viewport edge. */
  rootMargin?: string;
}

/**
 * Calls `onLoadMore` when the sentinel element scrolls near the viewport.
 *
 * Returns a callback ref to attach to the sentinel. Using a callback ref (rather
 * than a `useRef` + effect) attaches the observer the moment the node mounts and
 * re-attaches on remount, so it stays correct regardless of when the sentinel
 * appears relative to data loading.
 */
export const useInfiniteScroll = <T extends Element>(
  onLoadMore: () => void,
  { enabled, isFetching, rootMargin = "200px" }: UseInfiniteScrollOptions,
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<T | null>(null);

  const reconnect = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    const node = nodeRef.current;
    if (!node || !enabled || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          onLoadMore();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    observerRef.current = observer;
  }, [enabled, isFetching, onLoadMore, rootMargin]);

  // `reconnect` changes identity whenever the options change, so React re-runs
  // this callback ref (null then node), re-observing with a fresh closure. It's
  // also called with null on unmount, which disconnects the observer.
  return useCallback(
    (node: T | null) => {
      nodeRef.current = node;
      reconnect();
    },
    [reconnect],
  );
};
