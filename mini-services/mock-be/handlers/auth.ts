// handlers/auth.ts — login / refresh / logout / me / register / change-password
import { db, INTERN_PERMS, type UserRec } from "../data";
import {
  json, err, noContent, nowIso, toAuthUser, signAccessToken, newRefreshToken, refreshTokens,
  getCookie, REFRESH_COOKIE, userFromBearer, nid,
} from "../lib";
import type { Ctx } from "../lib";

function loginPayload(u: UserRec): Record<string, any> {
  const auth = toAuthUser(u);
  return {
    accessToken: signAccessToken(u),
    user: {
      id: auth.id, email: auth.email, displayName: auth.displayName, status: auth.status,
      roles: auth.roles, permissions: auth.permissions, mustChangePassword: auth.mustChangePassword,
    },
  };
}

export function login(ctx: Ctx): Response {
  const { email, password } = ctx.body || {};
  if (!email || !password) return err(400, "VALIDATION_ERROR", "Vui lòng nhập email và mật khẩu.");
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.password !== password) {
    return err(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không chính xác.");
  }
  const token = newRefreshToken(user.id);
  return json(loginPayload(user), 200, { "Set-Cookie": `${REFRESH_COOKIE}=${token}; Path=/api/v1/auth; SameSite=Lax` });
}

export function refresh(ctx: Ctx): Response {
  const token = getCookie(ctx.req, REFRESH_COOKIE);
  if (!token) return err(401, "REFRESH_MISSING", "Không tìm thấy refresh token trong cookie.");
  const entry = refreshTokens.get(token);
  if (!entry) return err(401, "REFRESH_INVALID", "Refresh token không hợp lệ hoặc đã hết hạn.");
  const user = db.users.find((u) => u.id === entry.userId);
  if (!user) return err(401, "REFRESH_INVALID", "Refresh token không hợp lệ hoặc đã hết hạn.");
  refreshTokens.delete(token);
  const rotated = newRefreshToken(user.id);
  return json(loginPayload(user), 200, { "Set-Cookie": `${REFRESH_COOKIE}=${rotated}; Path=/api/v1/auth; SameSite=Lax` });
}

export function logout(_ctx: Ctx): Response {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": `${REFRESH_COOKIE}=; Path=/api/v1/auth; SameSite=Lax; Max-Age=0` },
  });
}

export function me(ctx: Ctx): Response {
  const res = userFromBearer(ctx.req);
  if (res.error) return err(401, res.error, "Phiên đăng nhập không hợp lệ.");
  const u = db.users.find((x) => x.id === res.user!.id)!;
  const auth = toAuthUser(u);
  return json({
    id: auth.id, email: auth.email, displayName: auth.displayName, status: auth.status,
    roles: auth.roles, permissions: auth.permissions, mustChangePassword: auth.mustChangePassword,
  });
}

export function register(ctx: Ctx): Response {
  const { fullName, email, password, acceptedTerms } = ctx.body || {};
  if (!fullName || !email || !password) {
    return err(400, "VALIDATION_ERROR", "Vui lòng điền đầy đủ họ tên, email và mật khẩu.");
  }
  if (acceptedTerms !== true) {
    return err(400, "TERMS_NOT_ACCEPTED", "Bạn cần đồng ý với điều khoản sử dụng.");
  }
  const exists = db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return err(409, "REGISTRATION_CONFLICT", "Email này đã được đăng ký.");
  const user: UserRec = {
    id: nid("u"), email: String(email), username: String(email).split("@")[0],
    displayName: String(fullName), password: String(password), status: "active",
    roles: ["intern"], permissions: [...INTERN_PERMS], createdAt: nowIso(),
  };
  db.users.push(user);
  db.recruitmentStates.push({
    userId: user.id, status: "not_started", selectedRole: null, attemptsUsed: 0,
    maxAttempts: 3, cooldownUntil: null, latestResult: null,
  });
  return json({ registered: true }, 201);
}

export function changePassword(ctx: Ctx): Response {
  const res = userFromBearer(ctx.req);
  if (res.error) return err(401, res.error, "Phiên đăng nhập không hợp lệ.");
  const { currentPassword, newPassword } = ctx.body || {};
  const u = db.users.find((x) => x.id === res.user!.id)!;
  if (!currentPassword || !newPassword || u.password !== currentPassword) {
    return err(400, "INVALID_CREDENTIALS", "Mật khẩu hiện tại không đúng.");
  }
  u.password = newPassword;
  u.mustChangePassword = false;
  return json({ changed: true });
}
