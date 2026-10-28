"use client";

import { useCallback } from "react";
import { listPerformance } from "@/lib/api/management";
import { useResource } from "@/lib/api/use-resource";

/**
 * Shared directory of intern display names (userId → name) for admin finance
 * consoles. Loads up to 20 pages of 100 members; aborts with the resource.
 */
export function useInternNames() {
  return useResource(
    useCallback(async (signal: AbortSignal) => {
      const byId = new Map<string, string>();
      for (let page = 1; page <= 20; page++) {
        const result = await listPerformance(
          new URLSearchParams({ page: String(page), pageSize: "100" }),
          signal,
        );
        for (const member of result.items)
          byId.set(member.userId, member.displayName ?? member.userId);
        if (page * result.pageSize >= result.total) break;
      }
      return byId;
    }, []),
  );
}
