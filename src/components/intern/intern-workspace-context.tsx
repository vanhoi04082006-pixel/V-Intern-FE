"use client";

import { createContext, useContext } from "react";
import type { InternWorkspace } from "@/lib/api/workspace";

export interface InternWorkspaceContextValue {
  workspace: InternWorkspace;
  reload: () => void;
  refreshing?: boolean;
}

/**
 * Workspace data loaded once by the persistent `/intern` shell.
 *
 * Page-level `InternEntry` wrappers read this context so a route change does
 * not mount a second guard/shell. When a page is rendered on its own (for
 * example in a unit test), the context is absent and `InternEntry` keeps its
 * standalone guard + shell behaviour.
 */
export const InternWorkspaceContext =
  createContext<InternWorkspaceContextValue | null>(null);

export function useInternWorkspaceContext() {
  return useContext(InternWorkspaceContext);
}
