/** Tasks: list/filter/đ_detail/spec/comments, PATCH my (intern), managed (instructor/admin). */

import type { Task, TaskComment, TaskHistoryEntry, TaskPriority, TaskStatus } from "../types";
import { getStore, nextTaskCode, notifyUser } from "../store";
import { clamp, includesNoAccent, nowIso, randomId } from "../util";
import { badRequest, conflict, forbidden, notFound, pageOf, requireString, route, type RouteDef, type Ctx } from "./common";

const STATUSES: TaskStatus[] = ["todo", "doing", "review", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];
const PRIORITY_WEIGHT: Record<TaskPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const MY_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ["doing"],
  doing: ["review"],
  review: [],
  done: [],
};

export function taskPublic(t: Task): Record<string, unknown> {
  return {
    id: t.id,
    code: t.code,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    progress: t.progress,
    storyPoints: t.storyPoints,
    dueDate: t.dueDate,
    assigneeId: t.assigneeId,
    assigneeName: t.assigneeName,
    projectId: t.projectId,
    sprintId: t.sprintId,
    sprintCode: t.sprintCode,
    version: t.version,
    role: t.role,
    estimatedHours: t.estimatedHours,
    createdAt: t.createdAt,
  };
}

function getTask(ctx: Ctx, id: string): Task {
  const t = ctx.store.tasks.find((x) => x.id === id || x.code === id);
  if (!t) throw notFound("Không tìm thấy nhiệm vụ.");
  return t;
}

function historyOf(t: Task): TaskHistoryEntry[] {
  return getStore().taskHistory[t.id] ?? [];
}

function addHistory(t: Task, entry: TaskHistoryEntry): void {
  const hist = getStore().taskHistory[t.id] ?? (getStore().taskHistory[t.id] = []);
  hist.push(entry);
}

function commentsOf(t: Task): TaskComment[] {
  return getStore()
    .taskComments.filter((c) => c.taskId === t.id)
    .sort((a, b) => (a.at < b.at ? -1 : 1));
}

function pushTaskHistory(t: Task, from: Task["status"], to: Task["status"], changedBy: string, reason?: string | null): void {
  addHistory(t, { fromStatus: from, toStatus: to, changedBy, at: nowIso(), reason: reason ?? null });
}

function notifyInstructorsOf(ctx: Ctx, sessionId: string | null, title: string, content: string): void {
  if (!sessionId) return;
  const session = ctx.store.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  for (const insId of session.instructorIds) {
    notifyUser(insId, "task", title, content, null);
  }
}

/* ------------------------------- GET /tasks ------------------------------- */

async function listTasks(ctx: Ctx): Promise<unknown> {
  const q = ctx.query;
  let items = [...ctx.store.tasks];

  if (q.get("mine") === "true" || q.get("mine") === "1") {
    items = items.filter((t) => t.assigneeId === ctx.user!.id);
  }
  const projectId = q.get("projectId");
  if (projectId) items = items.filter((t) => t.projectId === projectId);
  const sprintId = q.get("sprintId");
  if (sprintId) items = items.filter((t) => t.sprintId === sprintId);
  const assigneeId = q.get("assigneeId");
  if (assigneeId) items = items.filter((t) => t.assigneeId === assigneeId);

  const status = q.get("status");
  if (status) items = items.filter((t) => t.status === status);
  const priority = q.get("priority");
  if (priority) items = items.filter((t) => t.priority === priority);

  const search = q.get("search")?.trim();
  if (search) {
    items = items.filter((t) => includesNoAccent(`${t.code} ${t.title} ${t.description}`, search));
  }

  const sortBy = q.get("sortBy") ?? "dueDate";
  const dir = q.get("sortOrder") === "desc" ? -1 : 1;
  items.sort((a, b) => {
    let r = 0;
    if (sortBy === "dueDate") {
      const da = a.dueDate ?? "9999";
      const db = b.dueDate ?? "9999";
      r = da < db ? -1 : da > db ? 1 : 0;
    } else if (sortBy === "priority") {
      r = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    } else if (sortBy === "status") {
      r = STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
    } else if (sortBy === "createdAt") {
      r = a.createdAt < b.createdAt ? -1 : 1;
    } else if (sortBy === "code") {
      r = a.code < b.code ? -1 : 1;
    } else if (sortBy === "title") {
      r = a.title.localeCompare(b.title, "vi");
    }
    return r * dir;
  });

  return pageOf(items.map(taskPublic), q);
}

async function getTaskDetail(ctx: Ctx): Promise<unknown> {
  const t = getTask(ctx, ctx.params.id);
  const deps = t.dependencies
    .map((id) => ctx.store.tasks.find((x) => x.id === id))
    .filter((x): x is Task => !!x)
    .map((d) => ({ taskId: d.id, code: d.code, title: d.title, status: d.status }));
  return {
    ...taskPublic(t),
    dependencies: deps,
    comments: commentsOf(t).map(commentPublic),
    history: historyOf(t),
  };
}

function commentPublic(c: TaskComment): Record<string, unknown> {
  return { id: c.id, taskId: c.taskId, authorId: c.authorId, authorName: c.authorName, content: c.content, at: c.at };
}

/* --------------------------------- spec --------------------------------- */

async function getTaskSpec(ctx: Ctx): Promise<unknown> {
  const t = getTask(ctx, ctx.params.id);
  const spec =
    ctx.store.taskSpecs[t.id] ??
    {
      requirements: `${t.title}. ${t.description}`,
      role: t.role,
      dod: [
        "Code đúng chuẩn dự án, không lỗi build",
        "Có test cho logic chính",
        "Tự kiểm tra trên desktop và mobile",
        "Mô tả PR rõ ràng khi hoàn thành",
      ],
      documentation: "Xem README dự án và tài liệu trong /docs.",
      expectedOutput: "Pull request kèm mô tả ngắn và ảnh demo.",
      skillTags: [],
      complexity: (t.storyPoints <= 2 ? "easy" : t.storyPoints <= 4 ? "medium" : "hard") as "easy" | "medium" | "hard",
      estimatedHours: t.estimatedHours,
      blocked: t.dependencies.some((d) => ctx.store.tasks.find((x) => x.id === d)?.status !== "done"),
    };
  return spec;
}

/* ------------------------------- comments ------------------------------- */

async function listComments(ctx: Ctx): Promise<unknown> {
  const t = getTask(ctx, ctx.params.id);
  return pageOf(commentsOf(t).map(commentPublic), ctx.query);
}

async function postComment(ctx: Ctx): Promise<unknown> {
  const t = getTask(ctx, ctx.params.id);
  const content = requireString(ctx.body, "content", "Nội dung nhận xét");
  const comment: TaskComment = {
    id: randomId("cmt"),
    taskId: t.id,
    authorId: ctx.user!.id,
    authorName: ctx.user!.displayName,
    content,
    at: nowIso(),
  };
  ctx.store.taskComments.push(comment);
  if (t.assigneeId && t.assigneeId !== ctx.user!.id) {
    notifyUser(t.assigneeId, "task", `Có nhận xét mới trên ${t.code}`, `${ctx.user!.displayName}: "${content}"`, `#/intern/work/${t.code}`);
  }
  return commentPublic(comment);
}

/* ------------------------------ PATCH /my ------------------------------ */

async function patchMyTask(ctx: Ctx): Promise<unknown> {
  const t = getTask(ctx, ctx.params.id);
  if (t.assigneeId !== ctx.user!.id) {
    throw forbidden("Bạn chỉ được cập nhật nhiệm vụ được giao cho mình.");
  }

  const expectedVersion = ctx.body?.expectedVersion;
  if (typeof expectedVersion !== "number" || expectedVersion !== t.version) {
    throw conflict("Nhiệm vụ đã được cập nhật bởi người khác. Vui lòng tải lại trang.");
  }

  const body = ctx.body ?? {};

  let newStatus: TaskStatus | null = null;
  if (body.status != null) {
    if (typeof body.status !== "string" || !STATUSES.includes(body.status as TaskStatus)) {
      throw badRequest("Trạng thái không hợp lệ.", ["status: todo|doing|review|done"]);
    }
    newStatus = body.status as TaskStatus;
    if (newStatus === "done") {
      throw badRequest("Thực tập sinh không thể tự chuyển nhiệm vụ sang 'done' — hãy chuyển sang 'review' để mentor chốt.", ["status: không thể tự done"]);
    }
    if (newStatus !== t.status && !MY_TRANSITIONS[t.status].includes(newStatus)) {
      throw badRequest(`Không thể chuyển từ '${t.status}' sang '${newStatus}'. Luồng cho phép: todo → doing → review.`, [
        `status: ${t.status} → ${newStatus} không hợp lệ`,
      ]);
    }
  }

  let newProgress: number | null = null;
  if (body.progress != null) {
    if (typeof body.progress !== "number" || !Number.isFinite(body.progress)) {
      throw badRequest("Tiến độ phải là số 0-100.", ["progress: số 0-100"]);
    }
    newProgress = clamp(Math.round(body.progress), 0, 100);
  }

  const reason = typeof body.reason === "string" ? body.reason : null;

  const from = t.status;
  if (newStatus) t.status = newStatus;
  if (newProgress != null) t.progress = newProgress;
  if (newStatus === "review" && t.progress < 60) t.progress = Math.max(t.progress, 60);
  t.version += 1;
  t.updatedAt = nowIso();

  pushTaskHistory(t, from, t.status, ctx.user!.displayName, reason);
  if (t.status === "review") {
    notifyInstructorsOf(ctx, t.sprintId ? ctx.store.sprints.find((s) => s.id === t.sprintId)?.sessionId ?? null : null, `${t.code} chờ review`, `${ctx.user!.displayName} đã chuyển ${t.code} sang trạng thái review.`);
  }
  return { ...taskPublic(t) };
}

/* --------------------------- managed (instructor) --------------------------- */

async function createTask(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const title = requireString(ctx.body, "title", "Tiêu đề");
  const sprintId = typeof body.sprintId === "string" ? body.sprintId : null;
  const sprint = sprintId ? ctx.store.sprints.find((s) => s.id === sprintId) : null;
  if (sprintId && !sprint) throw badRequest("Sprint không tồn tại.", ["sprintId: không hợp lệ"]);

  // projectId tùy chọn (Task 2-b): ưu tiên projectId trong body, suy ra từ sprint,
  // fallback project đầu tiên để form tạo task đơn giản vẫn chạy được.
  let projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null;
  if (!projectId && sprint) projectId = sprint.projectId;
  if (!projectId) projectId = ctx.store.projects[0]?.id ?? null;
  if (!projectId) throw badRequest("Không xác định được dự án cho nhiệm vụ.", ["projectId: bắt buộc"]);
  const session = ctx.store.projects.find((p) => p.id === projectId);
  if (!session) throw badRequest("Dự án không tồn tại.", ["projectId: không hợp lệ"]);
  const assigneeId = typeof body.assigneeId === "string" && body.assigneeId ? body.assigneeId : null;
  const assignee = assigneeId ? ctx.store.users.find((u) => u.id === assigneeId) : null;
  if (assigneeId && !assignee) throw badRequest("Người thực hiện không tồn tại.", ["assigneeId: không hợp lệ"]);
  const priority = (typeof body.priority === "string" && PRIORITIES.includes(body.priority as TaskPriority) ? body.priority : "medium") as TaskPriority;
  const storyPoints = typeof body.storyPoints === "number" ? clamp(Math.round(body.storyPoints), 1, 13) : 3;
  const dueDate = typeof body.dueDate === "string" && body.dueDate ? body.dueDate : null;
  const role = typeof body.role === "string" ? body.role : "frontend";

  const task: Task = {
    id: randomId("tsk"),
    code: nextTaskCode(),
    title,
    description: typeof body.description === "string" ? body.description : "",
    status: "todo",
    priority,
    progress: 0,
    storyPoints,
    dueDate,
    assigneeId,
    assigneeName: assignee?.displayName ?? null,
    projectId,
    sprintId,
    sprintCode: sprint?.code ?? null,
    version: 1,
    role,
    estimatedHours: typeof body.estimatedHours === "number" ? body.estimatedHours : Math.round(storyPoints * 2.5),
    dependencies: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    doneAt: null,
  };
  ctx.store.tasks.push(task);
  pushTaskHistory(task, "todo", "todo", ctx.user!.displayName, "Tạo nhiệm vụ");
  if (assignee) {
    notifyUser(assignee.id, "task", `Được giao nhiệm vụ ${task.code} — ${task.title}`, `${ctx.user!.displayName} giao cho bạn nhiệm vụ mới${dueDate ? `, hạn ${dueDate.slice(0, 10)}` : ""}.`, `#/intern/work/${task.code}`);
  }
  return taskPublic(task);
}

async function patchTask(ctx: Ctx): Promise<unknown> {
  const t = getTask(ctx, ctx.params.id);
  const body = ctx.body ?? {};

  // expectedVersion tùy chọn (Task 2-b): truyền thì phải khớp, sai → 409.
  if (body.expectedVersion != null) {
    if (typeof body.expectedVersion !== "number" || body.expectedVersion !== t.version) {
      throw conflict("Nhiệm vụ đã được cập nhật bởi người khác. Vui lòng tải lại trang.", "TASK_VERSION_CONFLICT");
    }
  }

  if (body.title != null) t.title = requireString(ctx.body, "title", "Tiêu đề");
  if (body.description != null && typeof body.description === "string") t.description = body.description;
  if (body.priority != null) {
    if (typeof body.priority !== "string" || !PRIORITIES.includes(body.priority as TaskPriority)) {
      throw badRequest("Ưu tiên không hợp lệ.", ["priority: low|medium|high|critical"]);
    }
    t.priority = body.priority as TaskPriority;
  }
  if (body.assigneeId !== undefined) {
    const aid = typeof body.assigneeId === "string" && body.assigneeId ? body.assigneeId : null;
    const u = aid ? ctx.store.users.find((x) => x.id === aid) : null;
    if (aid && !u) throw badRequest("Người thực hiện không tồn tại.", ["assigneeId: không hợp lệ"]);
    t.assigneeId = aid;
    t.assigneeName = u?.displayName ?? null;
  }
  if (body.storyPoints != null) {
    if (typeof body.storyPoints !== "number") throw badRequest("Story points phải là số.", ["storyPoints: số"]);
    t.storyPoints = clamp(Math.round(body.storyPoints), 1, 13);
  }
  if (body.dueDate !== undefined) {
    t.dueDate = typeof body.dueDate === "string" && body.dueDate ? body.dueDate : null;
  }
  if (body.progress != null) {
    if (typeof body.progress !== "number") throw badRequest("Tiến độ phải là số.", ["progress: số"]);
    t.progress = clamp(Math.round(body.progress), 0, 100);
  }
  if (body.role != null && typeof body.role === "string") t.role = body.role;

  const from = t.status;
  if (body.status != null) {
    if (typeof body.status !== "string" || !STATUSES.includes(body.status as TaskStatus)) {
      throw badRequest("Trạng thái không hợp lệ.", ["status: todo|doing|review|done"]);
    }
    t.status = body.status as TaskStatus;
    if (t.status === "done") {
      t.progress = 100;
      t.doneAt = nowIso();
    } else {
      t.doneAt = null;
    }
  }

  t.version += 1;
  t.updatedAt = nowIso();
  if (body.status != null && from !== t.status) {
    pushTaskHistory(t, from, t.status, ctx.user!.displayName, typeof body.reason === "string" ? body.reason : null);
  }
  return taskPublic(t);
}

async function deleteTask(ctx: Ctx): Promise<unknown> {
  const t = getTask(ctx, ctx.params.id);
  // Chỉ cho xóa khi chưa có bài nộp (Task 2-b).
  if (ctx.store.submissions.some((s) => s.taskId === t.id)) {
    throw conflict(
      "Nhiệm vụ đã có bài nộp — không thể xóa. Hãy xử lý bài nộp trước.",
      "TASK_HAS_SUBMISSIONS"
    );
  }
  ctx.store.tasks = ctx.store.tasks.filter((x) => x.id !== t.id);
  ctx.store.taskComments = ctx.store.taskComments.filter((c) => c.taskId !== t.id);
  delete ctx.store.taskSpecs[t.id];
  delete ctx.store.taskHistory[t.id];
  // gỡ dependency trỏ tới task này
  for (const other of ctx.store.tasks) {
    other.dependencies = other.dependencies.filter((d) => d !== t.id);
  }
  return { deleted: true, id: t.id };
}

/* ------------------------------- routes ------------------------------- */

export const taskRoutes: RouteDef[] = [
  route("GET", "/tasks", "user", listTasks),
  route("POST", "/tasks", ["instructor", "admin"], createTask),
  route("GET", "/tasks/:id", "user", getTaskDetail),
  route("PATCH", "/tasks/:id", ["instructor", "admin"], patchTask),
  route("DELETE", "/tasks/:id", ["instructor", "admin"], deleteTask),
  route("GET", "/tasks/:id/spec", "user", getTaskSpec),
  route("GET", "/tasks/:id/comments", "user", listComments),
  route("POST", "/tasks/:id/comments", "user", postComment),
  route("PATCH", "/tasks/:id/my", "intern", patchMyTask),
];
