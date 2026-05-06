import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | Error | null;
}

interface FetchOptions {
  enabled?: boolean;
  lazy?: boolean;
}

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = [], { enabled = true, lazy = false }: FetchOptions = {}) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: enabled && !lazy,
    error: null,
  });

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled || (lazy && tick === 0)) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    setState({ data: null, loading: true, error: null });

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, tick]);

  return { ...state, refetch };
}
