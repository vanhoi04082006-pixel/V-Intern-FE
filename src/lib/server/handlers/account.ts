/**
 * Account (Task 2-b): đổi mật khẩu (mock — không đổi thật để demo luôn đăng nhập
 * được), GitHub invitation theo phiên (repository/members/reconcile/activity),
 * session sharing (yêu cầu — duyệt — snapshot chỉ đọc).
 */

import type { GithubRepoState, SessionShareRequest } from "../org-store";
import { getOrgStore } from "../org-store";
import { pushAudit, pushTimeline } from "../store";
import type { User } from "../types";
import { includesNoAccent, nowIso, randomId } from "../util";
import { badRequest, conflict, forbidden, notFound, pageOf, requireString, route, type Ctx, type RouteDef } from "./common";
import { taskPublic } from "./tasks";

/* --------------------------- Change password --------------------------- */

async function changePassword(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const currentPassword = body.currentPassword;
  if (typeof currentPassword !== "string" || currentPassword !== ctx.user!.password) {
    throw badRequest("Mật khẩu hiện tại không đúng.", ["currentPassword: không đúng"]);
  }
  const newPassword = body.newPassword;
  if (typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 72) {
    throw badRequest("Mật khẩu mới phải từ 12 đến 72 ký tự.", ["newPassword: 12–72 ký tự"]);
  }
  if (newPassword === currentPassword) {
    throw badRequest("Mật khẩu mới phải khác mật khẩu hiện tại.", ["newPassword: khác mật khẩu hiện tại"]);
  }
  // Mock: KHÔNG đổi thật mật khẩu demo (để mọi tài khoản demo luôn đăng nhập được),
  // chỉ ghi nhận lịch sử đổi mật khẩu.
  const org = getOrgStore();
  org.passwordChanges.push({ userId: ctx.user!.id, at: nowIso() });
  pushAudit(ctx.user!.displayName, "UPDATE", "Password (mock)");
  return {
    changed: true,
    changedAt: nowIso(),
    mockNote:
      "Backend mock không đổi thật mật khẩu — mọi tài khoản demo vẫn đăng nhập bằng mật khẩu dùng chung để demo liên tục.",
  };
}

/* ------------------------- GitHub invitation ------------------------- */

function defaultGithubState(ctx: Ctx, sessionId: string): GithubRepoState {
  const session = ctx.store.sessions.find((s) => s.id === sessionId);
  const project = session ? ctx.store.projects.find((p) => p.id === session.projectId) : undefined;
  const members = ctx.store.assignments
    .filter((a) => a.sessionId === sessionId && a.status === "active")
    .map((a) => ({
      userId: a.internId,
      name: a.internName,
      status: (ctx.store.github[a.internId]?.connected ? "pending" : "not_connected") as
        | "pending"
        | "not_connected",
      invitedAt: nowIso(),
    }));
  return {
    sessionId,
    repository: {
      owner: "vintern-labs",
      name: `${project ? project.code.toLowerCase().replace("prj-", "") : "project"}-${sessionId.replace(/_/g, "-")}`,
      status: "provisioning",
      url: "",
      webhookStatus: "pending",
    },
    members,
    reconciledCount: 0,
  };
}

function githubStateOf(ctx: Ctx, sessionId: string): GithubRepoState {
  const org = getOrgStore();
  if (!org.githubSessions[sessionId]) {
    org.githubSessions[sessionId] = defaultGithubState(ctx, sessionId);
  }
  return org.githubSessions[sessionId];
}

function getSession(ctx: Ctx, id: string) {
  const s = ctx.store.sessions.find((x) => x.id === id || x.code === id);
  if (!s) throw notFound("Không tìm thấy phiên thực tập.");
  return s;
}

async function githubInvitation(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const state = githubStateOf(ctx, session.id);
  return {
    session: { id: session.id, code: session.code, name: session.name },
    repository: {
      ...state.repository,
      fullName: `${state.repository.owner}/${state.repository.name}`,
    },
    members: state.members.map((m) => ({ ...m })),
    stats: {
      total: state.members.length,
      accepted: state.members.filter((m) => m.status === "accepted").length,
      pending: state.members.filter((m) => m.status === "pending").length,
      notConnected: state.members.filter((m) => m.status === "not_connected").length,
    },
  };
}

async function reconcileGithub(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const state = githubStateOf(ctx, session.id);
  // Mỗi lần reconcile: pending → accepted; provisioning → ready.
  let updated = 0;
  for (const m of state.members) {
    if (m.status === "pending") {
      m.status = "accepted";
      updated += 1;
    }
  }
  if (state.repository.status === "provisioning") {
    state.repository.status = "ready";
    state.repository.url = `https://github.com/${state.repository.owner}/${state.repository.name}`;
    state.repository.webhookStatus = "healthy";
    updated += 1;
  }
  state.reconciledCount += 1;
  if (updated > 0) {
    pushTimeline(session.id, "github_reconciled", `Đối soát GitHub: ${updated} mục cập nhật (lời mời chấp nhận / repo sẵn sàng).`, ctx.user!.displayName);
  }
  return {
    repository: {
      ...state.repository,
      fullName: `${state.repository.owner}/${state.repository.name}`,
    },
    members: state.members.map((m) => ({ ...m })),
    updated,
    reconciledCount: state.reconciledCount,
    reconciledAt: nowIso(),
  };
}

async function githubActivity(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const items = getOrgStore()
    .githubActivity.filter((a) => a.sessionId === session.id)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map((a) => ({ id: a.id, action: a.action, pr: a.pr, branch: a.branch, headSha: a.headSha, at: a.at, actor: a.actor }));
  return pageOf(items, ctx.query);
}

/* --------------------------- Session sharing --------------------------- */

function shareRow(r: SessionShareRequest): Record<string, unknown> {
  return {
    id: r.id,
    requesterId: r.requesterId,
    requesterName: r.requesterName,
    ownerEmail: r.ownerEmail,
    ownerName: r.ownerName,
    reason: r.reason,
    status: r.status,
    sessionId: r.sessionId,
    sessionName: r.sessionName,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    decidedBy: r.decidedBy,
  };
}

async function listShareRequests(ctx: Ctx): Promise<unknown> {
  let items = [...getOrgStore().shareRequests];
  const q = ctx.query.get("q")?.trim();
  if (q) {
    items = items.filter((r) => includesNoAccent(`${r.requesterName} ${r.ownerName} ${r.reason} ${r.sessionName ?? ""}`, q));
  }
  const status = ctx.query.get("status");
  if (status) items = items.filter((r) => r.status === status);
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return pageOf(items.map(shareRow), ctx.query);
}

async function createShareRequest(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const ownerEmail = requireString(body, "ownerEmail", "Email người sở hữu phiên").toLowerCase();
  const reason = body.reason;
  if (typeof reason !== "string" || reason.trim().length < 10) {
    throw badRequest("Lý do phải tối thiểu 10 ký tự.", ["reason: ≥ 10 ký tự"]);
  }
  const owner = ctx.store.users.find((u) => u.email.toLowerCase() === ownerEmail);
  if (!owner) throw badRequest("Không tìm thấy người sở hữu phiên với email này.", ["ownerEmail: không tồn tại"]);
  if (owner.id === ctx.user!.id) {
    throw badRequest("Không thể gửi yêu cầu chia sẻ cho chính mình.", ["ownerEmail: trùng tài khoản của bạn"]);
  }
  const request: SessionShareRequest = {
    id: randomId("shr"),
    requesterId: ctx.user!.id,
    requesterName: ctx.user!.displayName,
    ownerEmail: owner.email,
    ownerName: owner.displayName,
    reason: reason.trim(),
    status: "pending",
    sessionId: null,
    sessionName: null,
    expiresAt: null,
    createdAt: nowIso(),
    decidedAt: null,
    decidedBy: null,
  };
  getOrgStore().shareRequests.push(request);
  return shareRow(request);
}

async function shareDecision(ctx: Ctx): Promise<unknown> {
  const org = getOrgStore();
  const request = org.shareRequests.find((r) => r.id === ctx.params.id);
  if (!request) throw notFound("Không tìm thấy yêu cầu chia sẻ.");
  const body = ctx.body ?? {};
  const decision = body.decision;
  if (decision !== "approve" && decision !== "deny" && decision !== "revoke") {
    throw badRequest("Quyết định phải là approve, deny hoặc revoke.", ["decision: approve|deny|revoke"]);
  }

  if (decision === "approve") {
    if (request.status !== "pending") {
      throw conflict(`Yêu cầu đã ở trạng thái '${request.status}' — không thể duyệt.`, "INVALID_STATUS_TRANSITION");
    }
    let sessionId = typeof body.sessionId === "string" && body.sessionId ? body.sessionId : null;
    if (!sessionId) {
      sessionId = ctx.store.sessions.find((s) => s.status === "active")?.id ?? ctx.store.sessions[0]?.id ?? null;
    }
    const session = ctx.store.sessions.find((s) => s.id === sessionId || s.code === sessionId);
    if (!session) throw badRequest("Phiên được chia sẻ không tồn tại.", ["sessionId: không hợp lệ"]);
    request.sessionId = session.id;
    request.sessionName = session.name;
    request.status = "approved";
    request.expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  } else if (decision === "deny") {
    if (request.status !== "pending") {
      throw conflict(`Yêu cầu đã ở trạng thái '${request.status}' — không thể từ chối.`, "INVALID_STATUS_TRANSITION");
    }
    request.status = "denied";
  } else {
    if (request.status !== "approved") {
      throw conflict(`Chỉ yêu cầu đã duyệt mới có thể thu hồi (hiện '${request.status}').`, "INVALID_STATUS_TRANSITION");
    }
    request.status = "revoked";
    request.expiresAt = null;
  }
  request.decidedAt = nowIso();
  request.decidedBy = ctx.user!.displayName;
  return shareRow(request);
}

async function shareSnapshot(ctx: Ctx): Promise<unknown> {
  const request = getOrgStore().shareRequests.find((r) => r.id === ctx.params.id);
  if (!request) throw notFound("Không tìm thấy yêu cầu chia sẻ.");
  if (request.status !== "approved") {
    throw forbidden("Snapshot chỉ đọc khả dụng sau khi yêu cầu chia sẻ được duyệt.");
  }
  if (request.expiresAt && new Date(request.expiresAt).getTime() < Date.now()) {
    throw forbidden("Quyền truy cập snapshot đã hết hạn.");
  }
  const session = ctx.store.sessions.find((s) => s.id === request.sessionId);
  if (!session) throw notFound("Phiên được chia sẻ không còn tồn tại.");
  const project = ctx.store.projects.find((p) => p.id === session.projectId);
  const members = ctx.store.assignments
    .filter((a) => a.sessionId === session.id)
    .map((a) => {
      const u = ctx.store.users.find((x) => x.id === a.internId);
      return {
        userId: a.internId,
        name: a.internName,
        email: u?.email ?? "",
        role: a.role,
        assignmentStatus: a.status,
      };
    });
  const sprintIds = new Set(ctx.store.sprints.filter((s) => s.sessionId === session.id).map((s) => s.id));
  const tasks = ctx.store.tasks
    .filter((t) => sprintIds.has(t.sprintId ?? "") || (t.projectId === session.projectId && !t.sprintId))
    .sort((a, b) => (a.code < b.code ? -1 : 1));

  return {
    share: { id: request.id, requesterName: request.requesterName, ownerName: request.ownerName, expiresAt: request.expiresAt },
    session: {
      id: session.id,
      code: session.code,
      name: session.name,
      status: session.status,
      startDate: session.startDate,
      endDate: session.endDate,
      description: session.description,
    },
    projects: project
      ? [{ id: project.id, code: project.code, name: project.name, description: project.description, status: project.status, techStack: project.techStack }]
      : [],
    members,
    tasks: pageOf(tasks.map((t) => taskPublic(t)), ctx.query),
    sprints: ctx.store.sprints
      .filter((s) => s.sessionId === session.id)
      .map((s) => ({ id: s.id, code: s.code, name: s.name, status: s.status, startDate: s.startDate, endDate: s.endDate })),
    generatedAt: nowIso(),
  };
}

/* ------------------------------- routes ------------------------------- */

const STAFF: User["role"][] = ["instructor", "admin"];

export const accountRoutes: RouteDef[] = [
  route("POST", "/auth/change-password", "user", changePassword),
  // Trang /github/invitation là đích từ email lời mời cho SINH VIÊN của phiên
  // (kèm giảng viên/admin phụ trách) — mọi user đã đăng nhập đều xem được.
  route("GET", "/sessions/:id/github", "user", githubInvitation),
  route("POST", "/sessions/:id/github/reconcile", "user", reconcileGithub),
  route("GET", "/sessions/:id/github/activity", "user", githubActivity),
  route("GET", "/session-sharing", STAFF, listShareRequests),
  route("POST", "/session-sharing", STAFF, createShareRequest),
  route("POST", "/session-sharing/:id/decision", STAFF, shareDecision),
  route("GET", "/session-sharing/:id/snapshot", STAFF, shareSnapshot),
];
