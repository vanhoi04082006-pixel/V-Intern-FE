"use client";
import { useEffect, useState } from "react";
/**
 * Callers provide a stable callback. Abort on navigation/filter change; never
 * retain another resource's data. Reloads of the SAME resource keep the last
 * payload visible (stale-while-revalidate) so consumers do not unmount their
 * children — e.g. an in-flight action notice would otherwise be discarded.
 */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, refreshKey?: unknown) {
  const [state, setState] = useState<{
    source?: typeof load;
    revision?: number;
    refreshKey?: unknown;
    data?: T;
    error?: unknown;
    loading: boolean;
  }>({ loading: true });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ source: load, revision, refreshKey, data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ source: load, revision, refreshKey, error, loading: false });
      });
    return () => controller.abort();
  }, [load, revision, refreshKey]);
  // Same resource but a newer revision → keep data, mark loading.
  // A different resource → never reuse its payload.
  const sameResource = state.source === load;
  const current =
    sameResource && state.revision === revision && state.refreshKey === refreshKey
      ? state
      : {
          ...state,
          data: sameResource ? state.data : undefined,
          error: sameResource ? state.error : undefined,
          loading: true,
        };
  return {
    data: current.data,
    error: current.error,
    loading: current.loading,
    reload: () => setRevision((x) => x + 1),
  };
}
