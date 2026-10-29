// handlers/tasks.ts — tasks, comments, history, spec, submissions, code reviews
import { db } from "../data";
import { json, err, notFound, noContent, paginate, nowIso, nid, userName, matches, isTrue } from "../lib";
import type { Ctx } from "../lib";

const OPEN = ["todo", "doing", "review"];

function canViewAll(user: any): boolean {
  return user.permissions.includes("*") || user.permissions.includes("tasks.view");
}

function taskDto(t: any) {
  return {
    id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
    storyPoints: t.storyPoints, dueDate: t.dueDate, version: t.version, projectId: t.projectId,
    sprintId: t.sprintId, assigneeId: t.assigneeId,
    assignee: t.assigneeId ? { displayName: userName(t.assigneeId) } : null,
    createdAt: t.createdAt,
  };
}

export function listTasks(ctx: Ctx): Response {
  const user = ctx.user!;
  const sp = ctx.url.searchParams;
  let items = db.tasks.filter((t) => !t.deleted);

  if (!canViewAll(user)) items = items.filter((t) => t.assigneeId === user.id); // interns: own tasks only
  if (isTrue(sp.get("mine"))) items = items.filter((t) => t.assigneeId === user.id);

  const search = sp.get("search") ?? undefined;
  items = items.filter((t) =>
    (!search || matches(t.title, search) || matches(t.description, search)) &&
    (!sp.get("projectId") || t.projectId === sp.get("projectId")) &&
    (!sp.get("sprintId") || t.sprintId === sp.get("sprintId")) &&
    (!sp.get("assigneeId") || t.assigneeId === sp.get("assigneeId")) &&
    (!sp.get("status") || t.status === sp.get("status")) &&
    (!sp.get("priority") || t.priority === sp.get("priority")));
  const sessionId = sp.get("sessionId");
  if (sessionId) {
    const sprintIds = new Set(db.sprints.filter((s) => s.sessionId === sessionId).map((s) => s.id));
    items = items.filter((t) => t.sprintId && sprintIds.has(t.sprintId));
  }
  return json(paginate(items.map(taskDto), ctx.url));
}

export function getTask(ctx: Ctx): Response {
  const user = ctx.user!;
  const t = db.tasks.find((x) => x.id === ctx.params.id && !x.deleted);
  if (!t) return notFound();
  if (!canViewAll(user) && t.assigneeId !== user.id) return err(403, "FORBIDDEN", "Bạn không có quyền xem nhiệm vụ này.");
  return json(taskDto(t));
}

export function createTask(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.title || !b.projectId) return err(400, "VALIDATION_ERROR", "Thiếu tiêu đề hoặc projectId của nhiệm vụ.");
  const t = {
    id: nid("t"), title: String(b.title), description: String(b.description ?? ""),
    status: "todo", priority: b.priority ?? "medium", storyPoints: b.storyPoints ?? 3,
    dueDate: b.dueDate ?? null, version: 1, projectId: String(b.projectId),
    sprintId: b.sprintId ?? null, assigneeId: b.assigneeId ?? null, progress: 0,
    createdAt: nowIso(), completedAt: null,
  };
  db.tasks.push(t);
  return json(taskDto(t), 201);
}

export function patchTask(ctx: Ctx): Response {
  const t = db.tasks.find((x) => x.id === ctx.params.id && !x.deleted);
  if (!t) return notFound();
  const b = ctx.body || {};
  if (b.expectedVersion !== undefined && b.expectedVersion !== t.version) {
    return err(409, "VERSION_CONFLICT", "Nhiệm vụ đã bị người khác cập nhật. Vui lòng tải lại trang.");
  }
  const prevStatus = t.status;
  for (const k of ["title", "description", "status", "priority", "storyPoints", "dueDate", "projectId", "sprintId", "assigneeId", "progress"]) {
    if (b[k] !== undefined) (t as any)[k] = b[k];
  }
  if (b.status === "done") { t.completedAt = nowIso(); t.progress = 100; }
  if (b.status && b.status !== prevStatus) {
    db.taskHistory.push({ id: nid("th"), taskId: t.id, fromStatus: prevStatus, toStatus: t.status, actorName: ctx.user!.displayName, createdAt: nowIso(), note: b.note ?? null });
  }
  t.version += 1;
  return json(taskDto(t));
}

export function deleteTask(ctx: Ctx): Response {
  const t = db.tasks.find((x) => x.id === ctx.params.id);
  if (!t) return notFound();
  t.deleted = true; // soft delete
  return noContent();
}

const ALLOWED_MY_TRANSITIONS: Record<string, string[]> = { todo: ["doing"], doing: ["review"] };

export function patchMyTask(ctx: Ctx): Response {
  const user = ctx.user!;
  const t = db.tasks.find((x) => x.id === ctx.params.id && !x.deleted);
  if (!t) return notFound();
  if (t.assigneeId !== user.id) return err(403, "FORBIDDEN", "Chỉ người được phân công mới được cập nhật nhiệm vụ này.");
  const b = ctx.body || {};
  if (b.expectedVersion !== undefined && b.expectedVersion !== t.version) {
    return err(409, "VERSION_CONFLICT", "Nhiệm vụ đã bị người khác cập nhật. Vui lòng tải lại trang.");
  }
  if (b.status !== undefined) {
    const allowed = ALLOWED_MY_TRANSITIONS[t.status] ?? [];
    if (!allowed.includes(b.status)) {
      return err(400, "INVALID_TRANSITION", `Chỉ cho phép chuyển trạng thái todo → doing → review (hiện tại: ${t.status}).`);
    }
    db.taskHistory.push({ id: nid("th"), taskId: t.id, fromStatus: t.status, toStatus: b.status, actorName: user.displayName, createdAt: nowIso(), note: b.reason ?? null });
    t.status = b.status;
  }
  if (b.progress !== undefined) t.progress = b.progress;
  t.version += 1;
  return json(taskDto(t));
}

/* ---------------- comments / history / spec ---------------- */

export function listComments(ctx: Ctx): Response {
  const t = db.tasks.find((x) => x.id === ctx.params.id && !x.deleted);
  if (!t) return notFound();
  const rows = db.taskComments.filter((c) => c.taskId === t.id).map((c) => ({
    id: c.id, author: { displayName: userName(c.authorId) }, content: c.content, createdAt: c.createdAt,
  }));
  return json(paginate(rows, ctx.url));
}

export function createComment(ctx: Ctx): Response {
  const t = db.tasks.find((x) => x.id === ctx.params.id && !x.deleted);
  if (!t) return notFound();
  const content = String(ctx.body?.content ?? "").trim();
  if (!content) return err(400, "VALIDATION_ERROR", "Nội dung bình luận không được để trống.");
  const c = { id: nid("tc"), taskId: t.id, authorId: ctx.user!.id, content, createdAt: nowIso() };
  db.taskComments.push(c);
  return json({ id: c.id, author: { displayName: ctx.user!.displayName }, content: c.content, createdAt: c.createdAt }, 201);
}

export function taskHistory(ctx: Ctx): Response {
  const t = db.tasks.find((x) => x.id === ctx.params.id);
  if (!t) return notFound();
  const rows = db.taskHistory
    .filter((h) => h.taskId === t.id)
    .map((h) => ({ id: h.id, fromStatus: h.fromStatus, toStatus: h.toStatus, actorName: h.actorName, createdAt: h.createdAt, note: h.note }));
  return json(paginate(rows, ctx.url));
}

export function taskSpec(ctx: Ctx): Response {
  const t = db.tasks.find((x) => x.id === ctx.params.id && !x.deleted);
  if (!t) return notFound();
  const body =
    `<h3>Mục tiêu</h3><p>${t.description || t.title}</p>` +
    `<h3>Đầu ra mong đợi</h3><ul><li>Mã nguồn được đẩy lên nhánh feature kèm unit test.</li>` +
    `<li>Tài liệu ngắn mô tả cách sử dụng (nếu có UI/API mới).</li>` +
    `<li>PR mô tả rõ thay đổi và cách kiểm thử.</li></ul>` +
    `<h3>Ưu tiên & story point</h3><p>Độ ưu tiên: ${t.priority} — Story point: ${t.storyPoints}.</p>`;
  return json({ title: t.title, body });
}

/* ---------------- submissions ---------------- */

function submissionDto(s: any) {
  return {
    id: s.id, taskId: s.taskId, intern: { displayName: userName(s.internId) },
    prUrl: s.prUrl, ref: s.ref, summary: s.summary, status: s.status, version: s.version,
    submittedAt: s.submittedAt, reviewedAt: s.reviewedAt, score: s.score, feedback: s.feedback,
  };
}

const FINDINGS_POOL = [
  "Nên tách logic truy vấn CSDL sang lớp repository để dễ test.",
  "Thiếu xử lý lỗi cho các trường hợp đầu vào rỗng hoặc null.",
  "Đặt tên biến rõ nghĩa hơn, tránh viết tắt không cần thiết.",
  "Nên thêm index cho các cột dùng trong mệnh đề WHERE.",
  "Bổ sung log để dễ truy vết lỗi ở môi trường phát triển.",
  "Cân nhắc dùng transaction khi thao tác đồng thời nhiều bảng.",
  "Một số hàm quá dài, nên tách nhỏ theo trách nhiệm.",
  "Nên cache kết quả truy vấn lặp lại nhiều lần.",
];

function autoCodeReview(submissionId: string) {
  const n = db.codeReviews.length;
  const findings = [FINDINGS_POOL[n % FINDINGS_POOL.length], FINDINGS_POOL[(n + 3) % FINDINGS_POOL.length], FINDINGS_POOL[(n + 5) % FINDINGS_POOL.length]];
  const review = {
    id: nid("cr"), submissionId, source: "ai" as const, status: "completed",
    findings, score: +(6.5 + (n % 4) * 0.5).toFixed(1), createdAt: nowIso(),
  };
  db.codeReviews.push(review);
  return review;
}

export function listSubmissions(ctx: Ctx): Response {
  const t = db.tasks.find((x) => x.id === ctx.params.id);
  if (!t) return notFound();
  const rows = db.submissions.filter((s) => s.taskId === t.id).map(submissionDto);
  return json(paginate(rows, ctx.url));
}

export function createSubmission(ctx: Ctx): Response {
  const user = ctx.user!;
  const t = db.tasks.find((x) => x.id === ctx.params.id && !x.deleted);
  if (!t) return notFound();
  if (t.assigneeId !== user.id) return err(403, "FORBIDDEN", "Chỉ người được phân công mới được nộp bài cho nhiệm vụ này.");
  const b = ctx.body || {};
  if (!b.prUrl || !b.summary) return err(400, "VALIDATION_ERROR", "Cần có prUrl và summary khi nộp bài.");
  const s = {
    id: nid("sub"), taskId: t.id, internId: user.id, prUrl: String(b.prUrl),
    ref: b.ref ? String(b.ref) : "", summary: String(b.summary), status: "submitted" as const,
    version: b.version ?? 1, submittedAt: nowIso(), reviewedAt: null, score: null, feedback: null,
  };
  db.submissions.push(s);
  autoCodeReview(s.id);
  if (t.status !== "review") {
    db.taskHistory.push({ id: nid("th"), taskId: t.id, fromStatus: t.status, toStatus: "review", actorName: user.displayName, createdAt: nowIso(), note: "Nộp bài, chuyển sang review" });
    t.status = "review";
    t.version += 1;
  }
  return json(submissionDto(s), 201);
}

export function withdrawSubmission(ctx: Ctx): Response {
  const s = db.submissions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  if (s.internId !== ctx.user!.id) return err(403, "FORBIDDEN", "Bạn không có quyền rút bài nộp này.");
  if (s.status === "reviewed") return err(400, "ALREADY_REVIEWED", "Bài nộp đã được review, không thể rút.");
  s.status = "withdrawn";
  return json(submissionDto(s));
}

export function reviewSubmission(ctx: Ctx): Response {
  const s = db.submissions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const b = ctx.body || {};
  const rubric = b.rubric ?? {};
  const values = ["functional", "quality", "testing", "errors", "security", "dod"].map((k) => Number(rubric[k] ?? 0));
  const score = +((values.reduce((a, c) => a + c, 0) / values.length) * 2).toFixed(2); // 0-10
  s.score = Math.min(10, Math.max(0, score));
  s.feedback = b.feedback ? String(b.feedback) : s.feedback;
  s.status = "reviewed";
  s.reviewedAt = nowIso();
  s.version += 1;
  return json(submissionDto(s));
}

export function listCodeReviews(ctx: Ctx): Response {
  const s = db.submissions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const rows = db.codeReviews.filter((r) => r.submissionId === s.id).map((r) => ({
    id: r.id, source: r.source, status: r.status, findings: r.findings, score: r.score, createdAt: r.createdAt,
  }));
  return json(paginate(rows, ctx.url));
}

export function rerunCodeReview(ctx: Ctx): Response {
  const s = db.submissions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const review = autoCodeReview(s.id);
  return json({ id: review.id, source: review.source, status: review.status, findings: review.findings, score: review.score, createdAt: review.createdAt }, 201);
}
