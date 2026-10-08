"use client";
import { useEffect, useState } from "react";
/** Callers provide a stable callback. Abort on navigation/filter change; never retain another resource's data. */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{
    source?: typeof load;
    revision?: number;
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
          setState({ source: load, revision, data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ source: load, revision, error, loading: false });
      });
    return () => controller.abort();
  }, [load, revision]);
  const current =
    state.source === load && state.revision === revision
      ? state
      : { loading: true };
  return {
    data: current.data,
    error: current.error,
    loading: current.loading,
    reload: () => setRevision((x) => x + 1),
  };
}
