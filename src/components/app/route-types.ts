"use client";

import * as React from "react";
import { matchPath } from "@/lib/client/router";

export interface RouteDefinition {
  pattern: string;
  component: React.ComponentType<{ params: Record<string, string> }>;
}

export interface MatchedRoute {
  definition: RouteDefinition;
  params: Record<string, string>;
}

/** Tìm route khớp path đầu tiên (thứ tự khai báo quan trọng: cụ thể trước). */
export function matchRoutes(
  routes: RouteDefinition[],
  path: string
): MatchedRoute | null {
  for (const definition of routes) {
    const params = matchPath(definition.pattern, path);
    if (params) return { definition, params };
  }
  return null;
}
