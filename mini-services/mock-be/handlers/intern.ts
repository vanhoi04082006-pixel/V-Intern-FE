// handlers/intern.ts — everything under /intern/me/*
import { db } from "../data";
import { json, err, notFound, paginate, nowIso, nid, isPast, userName, matches } from "../lib";
import type { Ctx } from "../lib";
import { buildPdf } from "../pdf";

function myActiveAssignment(userId: string) {
  return db.assignments.find((a) => a.internId === userId && a.status === "active");
}

function myProject(userId: string) {
  const a = myActiveAssignment(userId);
  return a ? db.projects.find((p) => p.id === a.projectId) : undefined;
}

export function workspace(ctx: Ctx): Response {
  const user = ctx.user!;
  const project = myProject(user.id);
  const sprint = project ? db.sprints.find((s) => s.projectId === project.id && s.status === "active") : undefined;
  const myTasks = db.tasks.filter((t) => t.assigneeId === user.id && !t.deleted);
  const count = (s: string) => myTasks.filter((t) => t.status === s).length;
  const focused = myTasks.find((t) => t.status === "doing") || null;
  return json({
    identity: { userId: user.id, displayName: user.displayName, email: user.email },
    project: project ? { id: project.id, name: project.name, code: project.code } : null,
    sprint: sprint ? { id: sprint.id, name: sprint.name, code: sprint.code, status: sprint.status, endDate: sprint.endDate } : null,
    taskSummary: { todo: count("todo"), doing: count("doing"), review: count("review"), done: count("done") },
    focusedTask: focused ? { id: focused.id, title: focused.title, status: focused.status, dueDate: focused.dueDate } : null,
  });
}

export function myProjectDetail(ctx: Ctx): Response {
  const project = myProject(ctx.user!.id);
  if (!project) return json({ project: null });
  return json({ ...project });
}

function boardPayload(sprint: any) {
  const tasks = db.tasks.filter((t) => t.sprintId === sprint.id && !t.deleted);
  const columns = (["todo", "doing", "review", "done"] as const).map((status) => ({
    status, count: tasks.filter((t) => t.status === status).length,
  }));
  return {
    sprint: {
      id: sprint.id, name: sprint.name, goal: sprint.goal,
      startDate: sprint.startDate, endDate: sprint.endDate, status: sprint.status,
    },
    columns,
    tasks: tasks.map((t) => ({
      id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
      storyPoints: t.storyPoints, dueDate: t.dueDate, version: t.version, progress: t.progress,
    })),
  };
}

export function currentSprintBoard(ctx: Ctx): Response {
  const project = myProject(ctx.user!.id);
  const sprint = project ? db.sprints.find((s) => s.projectId === project.id && s.status === "active") : undefined;
  if (!sprint) return err(404, "NO_ACTIVE_SPRINT", "Hiện tại chưa có sprint nào đang diễn ra.");
  return json(boardPayload(sprint));
}

export function sprintBoardById(ctx: Ctx): Response {
  const sprint = db.sprints.find((s) => s.id === ctx.params.id);
  if (!sprint) return notFound();
  return json(boardPayload(sprint));
}

export function mySprints(ctx: Ctx): Response {
  const project = myProject(ctx.user!.id);
  const sprints = project ? db.sprints.filter((s) => s.projectId === project.id) : [];
  const rows = sprints.map((s) => ({
    id: s.id, code: s.code, name: s.name, goal: s.goal, status: s.status, startDate: s.startDate, endDate: s.endDate,
  }));
  return json(paginate(rows, ctx.url));
}

export function myPerformance(ctx: Ctx): Response {
  const user = ctx.user!;
  const tasks = db.tasks.filter((t) => t.assigneeId === user.id && !t.deleted);
  const done = tasks.filter((t) => t.status === "done");
  const totalSp = tasks.reduce((s, t) => s + t.storyPoints, 0);
  const doneSp = done.reduce((s, t) => s + t.storyPoints, 0);
  const onTime = done.filter((t) => !t.completedAt || !t.dueDate || new Date(t.completedAt) <= new Date(t.dueDate)).length;
  const open = tasks.filter((t) => t.status !== "done");
  const finalized = db.evaluations.filter((e) => e.internId === user.id && e.status === "finalized" && typeof e.overallScore === "number");
  const avgEval = finalized.length ? +(finalized.reduce((s, e) => s + (e.overallScore as number), 0) / finalized.length).toFixed(2) : null;
  return json({
    taskCompletionRate: tasks.length ? +(done.length / tasks.length).toFixed(2) : 0,
    storyPointCompletionRate: totalSp ? +(doneSp / totalSp).toFixed(2) : 0,
    onTimeCompletionRate: done.length ? +(onTime / done.length).toFixed(2) : 0,
    overdueOpenTaskCount: open.filter((t) => isPast(t.dueDate)).length,
    averageEvaluationScore: avgEval,
    generatedAt: nowIso(),
  });
}

export function myEvaluations(ctx: Ctx): Response {
  const user = ctx.user!;
  const rows = db.evaluations
    .filter((e) => e.internId === user.id && e.status === "finalized")
    .map((e) => {
      const cycle = db.evaluationCycles.find((c) => c.id === e.cycleId);
      const critById = new Map((cycle?.criteria ?? []).map((c) => [c.id, c]));
      return {
        id: e.id,
        cycleName: cycle?.name ?? "",
        status: e.status,
        overallScore: e.overallScore,
        summary: e.summary,
        finalizedAt: e.finalizedAt ?? null,
        criteria: e.scores.map((s) => {
          const c = critById.get(s.criterionId);
          return {
            code: c?.code ?? s.criterionId, name: c?.name ?? "", weight: c?.weight ?? 0,
            score: s.score, maxScore: c?.maxScore ?? 10, comment: s.comment,
          };
        }),
      };
    });
  return json(paginate(rows, ctx.url));
}

export function myKpi(ctx: Ctx): Response {
  const user = ctx.user!;
  const rows = db.kpiResults
    .filter((r) => r.userId === user.id)
    .map((r) => {
      const period = db.kpiPeriods.find((p) => p.id === r.periodId);
      return {
        id: r.id, periodName: period?.name ?? "", periodStatus: period?.status ?? "",
        totalScore: r.totalScore, rank: r.rank, components: r.components,
      };
    });
  return json(paginate(rows, ctx.url));
}

function salaryBalance(userId: string): number {
  return db.salaryEntries.filter((e) => e.userId === userId).reduce((s, e) => s + e.amount, 0);
}

function salaryEntryDto(e: any) {
  return { id: e.id, type: e.type, amount: e.amount, reason: e.reason, kpiPeriodName: e.kpiPeriodName, createdAt: e.createdAt };
}

export function myVirtualSalary(ctx: Ctx): Response {
  const user = ctx.user!;
  const entries = db.salaryEntries.filter((e) => e.userId === user.id).map(salaryEntryDto);
  return json({ balance: salaryBalance(user.id), entries });
}

export function myVirtualSalaryLedger(ctx: Ctx): Response {
  const entries = db.salaryEntries.filter((e) => e.userId === ctx.user!.id).map(salaryEntryDto);
  return json(paginate(entries, ctx.url));
}

export function myCertificates(ctx: Ctx): Response {
  const user = ctx.user!;
  const rows = db.certificates.filter((c) => c.userId === user.id).map((c) => ({
    id: c.id, certificateNumber: c.certificateNumber, status: c.status,
    projectName: db.projects.find((p) => p.id === c.projectId)?.name ?? null, issuedAt: c.issuedAt,
  }));
  return json(paginate(rows, ctx.url));
}

export function myCertificatePdf(ctx: Ctx): Response {
  const cert = db.certificates.find((c) => c.id === ctx.params.id && c.userId === ctx.user!.id);
  if (!cert) return notFound();
  const project = db.projects.find((p) => p.id === cert.projectId);
  const pdf = buildPdf("CHUNG CHI V-INTERN", [
    `Certificate No: ${cert.certificateNumber}`,
    `Holder: ${ctx.user!.displayName}`,
    `Role: ${cert.role}`,
    `Project: ${project?.code ?? ""} - ${project?.name ?? ""}`,
    `Status: ${cert.status}`,
    `Issued at: ${cert.issuedAt.slice(0, 10)}`,
    "This is a demo certificate generated by mock-be.",
  ]);
  return new Response(pdf as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${cert.certificateNumber}.pdf"`,
    },
  });
}

/* ---------------- AI mentor ---------------- */

export function conversations(ctx: Ctx): Response {
  const rows = db.conversations
    .filter((c) => c.userId === ctx.user!.id)
    .filter((c) => matches(c.title, ctx.url.searchParams.get("q") ?? undefined))
    .map((c) => ({ id: c.id, title: c.title, status: c.status, createdAt: c.createdAt }));
  return json(paginate(rows, ctx.url));
}

export function createConversation(ctx: Ctx): Response {
  const conv = {
    id: nid("conv"), userId: ctx.user!.id, title: ctx.body?.title || "Cuộc trò chuyện mới",
    status: "active" as const, createdAt: nowIso(), messages: [],
  };
  db.conversations.unshift(conv);
  return json({ id: conv.id, title: conv.title, status: conv.status, createdAt: conv.createdAt }, 201);
}

export function getConversation(ctx: Ctx): Response {
  const conv = db.conversations.find((c) => c.id === ctx.params.id && c.userId === ctx.user!.id);
  if (!conv) return notFound();
  return json({ id: conv.id, title: conv.title, status: conv.status, messages: conv.messages });
}

export function postMessage(ctx: Ctx): Response {
  const conv = db.conversations.find((c) => c.id === ctx.params.id && c.userId === ctx.user!.id);
  if (!conv) return notFound();
  const content = String(ctx.body?.content ?? "").trim();
  if (!content) return err(400, "VALIDATION_ERROR", "Nội dung tin nhắn không được để trống.");
  const at = nowIso();
  conv.messages.push({ id: nid("m"), role: "user", content, createdAt: at });
  const reply = `Cảm ơn câu hỏi của bạn: "${content}". Gợi ý từ AI mentor: hãy chia nhỏ bài toán, làm phần lõi trước rồi kiểm thử bằng unit test. Nếu vẫn vướng, bạn có thể hỏi sâu hơn phần nào nhé!`;
  conv.messages.push({ id: nid("m"), role: "mentor", content: reply, createdAt: at });
  conv.status = "active";
  return json({ reply, messageCount: conv.messages.length });
}

export function archiveConversation(ctx: Ctx): Response {
  const conv = db.conversations.find((c) => c.id === ctx.params.id && c.userId === ctx.user!.id);
  if (!conv) return notFound();
  conv.status = "archived";
  return json({ id: conv.id, status: conv.status });
}

/* ---------------- AI recommendations ---------------- */

export function myRecommendations(ctx: Ctx): Response {
  const rec = db.aiRecommendations[ctx.user!.id];
  if (!rec) return err(404, "NOT_FOUND", "Chưa có gợi ý AI nào cho bạn.");
  return json(rec);
}

export function refreshRecommendations(ctx: Ctx): Response {
  const user = ctx.user!;
  const prev = db.aiRecommendations[user.id];
  const suffix = prev ? ` (cập nhật ${nowIso().slice(11, 16)} UTC)` : "";
  const rec = {
    id: prev?.id ?? nid("rec"), generatedAt: nowIso(),
    focusAreas: [
      "Tối ưu hiệu năng React cho bảng dữ liệu lớn",
      "Nâng cao chất lượng unit test",
      "Kỹ năng ước lượng story point",
    ],
    suggestions: [
      "Áp dụng phân trang phía server cho danh sách sách thay vì load toàn bộ.",
      "Viết test cho các nhánh lỗi trước khi code happy-path tiếp theo.",
      "Chia nhỏ PR dưới 400 dòng để mentor review nhanh hơn.",
      "Chuẩn bị trước 3 câu hỏi cho buổi daily meeting mỗi sáng.",
    ],
    encouragement: `Bạn đang tiến bộ đều đặn${suffix}. Duy trì phong độ này đến cuối sprint nhé!`,
  };
  db.aiRecommendations[user.id] = rec;
  return json(rec);
}

/* ---------------- Learning package ---------------- */

export function learningPackage(ctx: Ctx): Response {
  const pkg = db.learningPackages[ctx.params.id];
  if (!pkg) return notFound();
  return json(pkg);
}
