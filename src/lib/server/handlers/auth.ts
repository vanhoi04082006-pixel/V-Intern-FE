/** Auth: login / register / me / logout. */

import type { User } from "../types";
import { findUserByEmail, findUserById, getStore, pushAudit, recordActivity } from "../store";
import { nowIso, randomId, randomToken } from "../util";
import { ApiErr, badRequest, route, type RouteDef, unauthorized, type Ctx } from "./common";

const ROLE_PERMISSIONS: Record<User["role"], string[]> = {
  intern: [
    "workspace:view",
    "recruitment:manage",
    "tasks:view",
    "tasks:self-update",
    "submissions:create",
    "mentor:use",
    "outcomes:view",
  ],
  instructor: [
    "sessions:view",
    "sessions:manage",
    "tasks:manage",
    "evaluations:manage",
    "candidates:view",
    "reports:view",
    "performance:view",
  ],
  admin: ["admin:all", "users:manage", "templates:manage", "system:manage", "reports:view", "sessions:view", "tasks:manage"],
};

export function publicUser(u: User): Record<string, unknown> {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    permissions: ROLE_PERMISSIONS[u.role] ?? [],
    avatarColor: u.avatarColor,
  };
}

async function login(ctx: Ctx): Promise<unknown> {
  const email = typeof ctx.body?.email === "string" ? ctx.body.email.trim().toLowerCase() : "";
  const password = typeof ctx.body?.password === "string" ? ctx.body.password : "";
  if (!email || !password) throw unauthorized("Email hoặc mật khẩu không đúng.");
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    throw new ApiErr(401, "Email hoặc mật khẩu không chính xác.", "INVALID_CREDENTIALS");
  }
  if (user.status === "locked") {
    throw new ApiErr(401, "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.", "ACCOUNT_LOCKED");
  }
  const store = getStore();
  const token = randomToken();
  store.tokens[token] = user.id;
  user.lastLoginAt = nowIso();
  pushAudit(user.displayName, "LOGIN", `Phiên đăng nhập ${user.id}`);
  recordActivity("auth", "LOGIN", user.displayName, `Đăng nhập thành công (${user.email}).`);
  return { accessToken: token, user: publicUser(user) };
}

async function register(ctx: Ctx): Promise<unknown> {
  const fullName = typeof ctx.body?.fullName === "string" ? ctx.body.fullName.trim() : "";
  const email = typeof ctx.body?.email === "string" ? ctx.body.email.trim().toLowerCase() : "";
  const password = typeof ctx.body?.password === "string" ? ctx.body.password : "";
  const acceptedTerms = ctx.body?.acceptedTerms === true;

  const details: string[] = [];
  if (fullName.length < 2) details.push("fullName: Họ tên tối thiểu 2 ký tự");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) details.push("email: Email không hợp lệ");
  if (password.length < 8) details.push("password: Mật khẩu tối thiểu 8 ký tự");
  if (!acceptedTerms) details.push("acceptedTerms: Bạn phải đồng ý điều khoản sử dụng");
  if (details.length) throw badRequest("Thông tin đăng ký chưa hợp lệ.", details);

  const store = getStore();
  if (findUserByEmail(email)) {
    throw new ApiErr(409, "Email này đã được đăng ký tài khoản.", "EMAIL_EXISTS");
  }

  const id = randomId("usr");
  const user: User = {
    id,
    email,
    password,
    displayName: fullName,
    role: "intern",
    status: "active",
    avatarColor: "#10B981",
    joinedAt: nowIso(),
    lastLoginAt: null,
    studentId: null,
    university: null,
  };
  store.users.push(user);
  // Intern mới có recruitment profile not_started
  store.recruitment[id] = {
    userId: id,
    status: "not_started",
    selectedRole: null,
    attemptCount: 0,
    maxAttempts: 3,
    recruitedAt: null,
    nextEligibleAt: null,
  };
  pushAudit(fullName, "CREATE", `Đăng ký tài khoản mới ${id}`);
  recordActivity("auth", "REGISTER", fullName, `Đăng ký tài khoản mới (${email}) — chờ phỏng vấn đầu vào.`);
  return { registered: true };
}

async function me(ctx: Ctx): Promise<unknown> {
  if (!ctx.user) throw unauthorized();
  return publicUser(ctx.user);
}

async function logout(ctx: Ctx): Promise<unknown> {
  const store = getStore();
  const authHeader = ctx.req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  if (token && store.tokens[token]) {
    const userId = store.tokens[token];
    delete store.tokens[token];
    const u = findUserById(userId);
    if (u) pushAudit(u.displayName, "LOGIN", `Đăng xuất ${u.id}`);
  }
  return undefined; // 204
}

export const authRoutes: RouteDef[] = [
  route("POST", "/auth/login", "public", login),
  route("POST", "/auth/register", "public", register),
  route("GET", "/auth/me", "user", me),
  route("POST", "/auth/logout", "user", logout),
];
