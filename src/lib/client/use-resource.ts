"use client";

import * as React from "react";

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  reload: () => void;
  setData: (updater: T | ((prev: T | null) => T | null)) => void;
}

/**
 * Hook tải dữ liệu phổ thông: hủy khi unmount, reload() tăng revision,
 * không gọi lại khi dependency không đổi.
 */
export function useResource<T>(
  load: () => Promise<T>,
  deps: React.DependencyList = []
): Resource<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown>(null);
  const [revision, setRevision] = React.useState(0);
  const loadRef = React.useRef(load);

  React.useEffect(() => {
    loadRef.current = load;
  }, [load]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadRef
      .current()
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [revision, ...deps]);

  const reload = React.useCallback(() => setRevision((r) => r + 1), []);
  const setDataSafe = React.useCallback(
    (updater: T | ((prev: T | null) => T | null)) =>
      setData((prev) =>
        typeof updater === "function" ? (updater as (p: T | null) => T | null)(prev) : updater
      ),
    []
  );

  return { data, loading, error, reload, setData: setDataSafe };
}

/** Wrapper cho hành động mutation: busy + error + toast. */
export function useAction(onSuccess?: () => void) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inFlight = React.useRef(false);

  const run = React.useCallback(
    async (fn: () => Promise<void>) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setBusy(true);
      setError(null);
      try {
        await fn();
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [onSuccess]
  );

  return { busy, error, setError, run };
}
