import { useCallback, useEffect, useRef, useState } from 'react';

type Fetcher<T> = () => Promise<T>;

export interface ResilientState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  updatedAt: number | null;
  refetch: () => Promise<void>;
}

/**
 * Runs a fetcher on mount, exposes loading/error/updatedAt state and a manual refetch.
 * Keeps last successful data across refetches so widgets don't blank on retry.
 */
export function useResilientFetch<T>(
  fetcher: Fetcher<T>,
  deps: unknown[] = [],
  opts: { auto?: boolean; refreshMs?: number } = {}
): ResilientState<T> {
  const { auto = true, refreshMs } = opts;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(auto);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (!mounted.current) return;
      setData(result);
      setUpdatedAt(Date.now());
    } catch (e: any) {
      if (!mounted.current) return;
      setError(e?.message || 'Something went wrong. Tap refresh to retry.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (auto) void run();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!refreshMs) return;
    const t = setInterval(() => void run(), refreshMs);
    return () => clearInterval(t);
  }, [refreshMs, run]);

  return { data, loading, error, updatedAt, refetch: run };
}

export function formatUpdatedAt(ts: number | null): string {
  if (!ts) return '—';
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `Updated ${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `Updated ${m}m ago`;
  const h = Math.floor(m / 60);
  return `Updated ${h}h ago`;
}
