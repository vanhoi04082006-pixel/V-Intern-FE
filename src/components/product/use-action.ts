"use client";
import { useRef, useState } from "react";
export function useAction(onSuccess?: () => void) {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  return {
    busy,
    error,
    clearError() { setError(undefined); },
    async run(action: () => Promise<unknown>) {
      if (inFlight.current) return false;
      inFlight.current = true;
      setBusy(true);
      setError(undefined);
      try {
        await action();
        onSuccess?.();
        return true;
      } catch (e) {
        setError(e);
        return false;
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
  };
}
