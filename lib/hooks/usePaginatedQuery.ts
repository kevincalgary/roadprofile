import { useCallback, useEffect, useState } from 'react';

interface PageResult<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Generic cursor-paginated list with pull-to-refresh, "load more" pagination,
 * loading/refreshing/error states. Used by the feed, timeline, comments,
 * notifications, and messages screens.
 */
export function usePaginatedQuery<T>(fetchPage: (cursor?: string) => Promise<PageResult<T>>, deps: unknown[] = []) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage();
      setItems(result.items);
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const result = await fetchPage();
      setItems(result.items);
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const result = await fetchPage(cursor);
      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore, fetchPage]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { items, setItems, loading, refreshing, loadingMore, hasMore, error, refresh, loadMore, reload: load };
}

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
