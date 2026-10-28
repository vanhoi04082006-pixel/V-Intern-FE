/** Profile: GET /users/me/profile (đủ 3 role). */

import { route, type RouteDef, type Ctx } from "./common";

const ROLE_LABELS: Record<string, string> = {
  intern: "Thực tập sinh",
  instructor: "Giảng viên",
  admin: "Quản trị viên",
};

async function myProfile(ctx: Ctx): Promise<unknown> {
  const u = ctx.user!;
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    roleLabel: ROLE_LABELS[u.role] ?? u.role,
    avatarColor: u.avatarColor,
    joinedAt: u.joinedAt,
    lastLoginAt: u.lastLoginAt,
    studentId: u.studentId ?? null,
    university: u.university ?? null,
  };
}

export const profileRoutes: RouteDef[] = [route("GET", "/users/me/profile", "user", myProfile)];
