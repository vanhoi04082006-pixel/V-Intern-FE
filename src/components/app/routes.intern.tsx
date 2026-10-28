"use client";

/**
 * Registry tổng INTERN = intern-a (dashboard/onboarding) + intern-b
 * (work/sprint/project/mentor) + outcomes (kết quả + trang chung)
 * + participation (kỷ luật cá nhân — task 3-a).
 * KHÔNG SỬA file này — các agent chỉ sửa routes.intern-a/b/outcomes.
 */
import type { RouteDefinition } from "./route-types";
import { internARoutes } from "./routes.intern-a";
import { internBRoutes } from "./routes.intern-b";
import { outcomeRoutes } from "./routes.outcomes";
import { InternParticipationView } from "@/components/views/intern/participation/participation-view";

/** Chỉ các pattern intern (loại pattern instructor/admin trong outcomes). */
const internOnly = outcomeRoutes.filter((r) => r.pattern.startsWith("/intern/"));

export const internRoutes: RouteDefinition[] = [
  ...internARoutes,
  ...internBRoutes,
  ...internOnly,
  { pattern: "/intern/participation", component: InternParticipationView },
];

export { outcomeRoutes };
