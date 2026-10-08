"use client";
import { useState } from "react";
export function useAction(onSuccess?: () => void) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  return {
    busy,
    error,
    async run(action: () => Promise<unknown>) {
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
        setBusy(false);
      }
    },
  };
}
