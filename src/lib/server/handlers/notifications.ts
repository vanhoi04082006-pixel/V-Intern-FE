/** Notifications (đủ 3 role) + preferences. */

import type { AppNotificationRecord } from "../types";
import { NOTIFICATION_CATEGORIES } from "../seed/misc";
import { badRequest, notFound, pageOf, queryBool, route, type RouteDef, type Ctx } from "./common";

function notificationPublic(n: AppNotificationRecord): Record<string, unknown> {
  return {
    id: n.id,
    category: n.category,
    title: n.title,
    content: n.content,
    read: n.read,
    link: n.link,
    createdAt: n.createdAt,
  };
}

function preferencesOf(ctx: Ctx): Record<string, unknown>[] {
  return NOTIFICATION_CATEGORIES.map((category) => ({
    category,
    enabled: ctx.store.notificationPrefs[`${ctx.user!.id}:${category}`] ?? true,
  }));
}

async function listNotifications(ctx: Ctx): Promise<unknown> {
  let items = ctx.store.notifications
    .filter((n) => n.userId === ctx.user!.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (queryBool(ctx.query, "unread")) items = items.filter((n) => !n.read);
  const category = ctx.query.get("category");
  if (category) items = items.filter((n) => n.category === category);
  return pageOf(items.map(notificationPublic), ctx.query);
}

async function markRead(ctx: Ctx): Promise<unknown> {
  const n = ctx.store.notifications.find((x) => x.id === ctx.params.id && x.userId === ctx.user!.id);
  if (!n) throw notFound("Không tìm thấy thông báo.");
  if (!n.read) n.read = true;
  return { updated: 1 };
}

async function markAllRead(ctx: Ctx): Promise<unknown> {
  let updated = 0;
  for (const n of ctx.store.notifications) {
    if (n.userId === ctx.user!.id && !n.read) {
      n.read = true;
      updated += 1;
    }
  }
  return { updated };
}

async function getPreferences(ctx: Ctx): Promise<unknown> {
  return preferencesOf(ctx);
}

async function updatePreference(ctx: Ctx): Promise<unknown> {
  const category = typeof ctx.body?.category === "string" ? ctx.body.category : "";
  if (!NOTIFICATION_CATEGORIES.includes(category as (typeof NOTIFICATION_CATEGORIES)[number])) {
    throw badRequest("Nhóm thông báo không hợp lệ.", ["category: không tồn tại"]);
  }
  const enabled = ctx.body?.enabled === true;
  ctx.store.notificationPrefs[`${ctx.user!.id}:${category}`] = enabled;
  return preferencesOf(ctx);
}

export const notificationRoutes: RouteDef[] = [
  route("GET", "/notifications", "user", listNotifications),
  route("POST", "/notifications/:id/read", "user", markRead),
  route("POST", "/notifications/read-all", "user", markAllRead),
  route("GET", "/notifications/preferences", "user", getPreferences),
  route("PUT", "/notifications/preferences", "user", updatePreference),
];
