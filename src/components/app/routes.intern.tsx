"use client";

/**
 * Registry tổng INTERN = intern-a (dashboard/onboarding) + intern-b
 * (work/sprint/project/mentor) + outcomes (kết quả + trang chung).
 * KHÔNG SỬA file này — các agent chỉ sửa routes.intern-a/b/outcomes.
 */
import type { RouteDefinition } from "./route-types";
import { internARoutes } from "./routes.intern-a";
import { internBRoutes } from "./routes.intern-b";
import { outcomeRoutes } from "./routes.outcomes";

/** Chỉ các pattern intern (loại pattern instructor/admin trong outcomes). */
const internOnly = outcomeRoutes.filter((r) => r.pattern.startsWith("/intern/"));

export const internRoutes: RouteDefinition[] = [
  ...internARoutes,
  ...internBRoutes,
  ...internOnly,
];

export { outcomeRoutes };
