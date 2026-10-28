/** Reports (instructor + admin): danh sách, tạo snapshot (dedupe 30s), chi tiết, CSV. */

import { NextResponse } from "next/server";
import type { ReportItem } from "../types";
import { computePerformance, isOverdueOpen } from "../perf";
import { nowIso, randomId } from "../util";
import { badRequest, notFound, route, type RouteDef, type Ctx } from "./common";

const KINDS: ReportItem["kind"][] = ["progress", "performance", "evaluation", "review", "risk"];

const KIND_TITLES: Record<ReportItem["kind"], string> = {
  progress: "Báo cáo tiến độ",
  performance: "Báo cáo hiệu suất",
  evaluation: "Tổng hợp đánh giá",
  review: "Chất lượng bài nộp",
  risk: "Rủi ro tiến độ",
};

function reportRow(r: ReportItem): Record<string, unknown> {
  return { id: r.id, kind: r.kind, title: r.title, scope: r.scope, createdAt: r.createdAt, authorName: r.authorName };
}

function getReport(ctx: Ctx, id: string): ReportItem {
  const r = ctx.store.reports.find((x) => x.id === id);
  if (!r) throw notFound("Không tìm thấy báo cáo.");
  return r;
}

function tasksOfSession(ctx: Ctx, sessionId: string) {
  const sprintIds = new Set(ctx.store.sprints.filter((s) => s.sessionId === sessionId).map((s) => s.id));
  const session = ctx.store.sessions.find((s) => s.id === sessionId);
  return ctx.store.tasks
    .filter((t) => sprintIds.has(t.sprintId ?? "") || (session && t.projectId === session.projectId && !t.sprintId))
    .sort((a, b) => (a.code < b.code ? -1 : 1));
}

function buildSnapshot(ctx: Ctx, report: ReportItem): Record<string, unknown> {
  const session = ctx.store.sessions.find((s) => s.id === report.sessionId) ?? ctx.store.sessions[0];
  const project = session ? ctx.store.projects.find((p) => p.id === session.projectId) : undefined;
  const tasks = session ? tasksOfSession(ctx, session.id) : [];
  const taskIds = new Set(tasks.map((t) => t.id));
  const submissions = ctx.store.submissions.filter((s) => taskIds.has(s.taskId));

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter(isOverdueOpen).length;
  const blocked = tasks.filter((t) => t.dependencies.some((d) => ctx.store.tasks.find((x) => x.id === d)?.status !== "done")).length;
  const unassigned = tasks.filter((t) => !t.assigneeId).length;
  const pendingReview = tasks.filter((t) => t.status === "review").length + submissions.filter((s) => s.status === "submitted").length;
  const reworkCount = submissions.filter((s) => s.status === "rework").length;

  const reasons: string[] = [];
  if (overdue > 0) reasons.push(`${overdue} nhiệm vụ trễ hạn chưa đóng`);
  if (unassigned > 0) reasons.push(`${unassigned} nhiệm vụ chưa gán người thực hiện`);
  if (pendingReview > 0) reasons.push(`${pendingReview} bài nộp/nhiệm vụ đang chờ duyệt`);
  if (reworkCount > 0) reasons.push(`${reworkCount} bài nộp bị yêu cầu làm lại`);
  if (blocked > 0) reasons.push(`${blocked} nhiệm vụ bị chặn bởi dependency`);
  const risk = overdue >= 2 || unassigned >= 2 ? "high" : overdue === 1 || pendingReview >= 3 || unassigned === 1 ? "medium" : "low";
  if (reasons.length === 0) reasons.push("Không có rủi ro nổi bật — tiến độ trong tầm kiểm soát");

  const members = ctx.store.assignments
    .filter((a) => a.sessionId === session?.id && a.status === "active")
    .map((a) => {
      const m = computePerformance(ctx.store, a.internId);
      const memberTaskIds = new Set(tasks.filter((t) => t.assigneeId === a.internId).map((t) => t.id));
      const memberSubs = ctx.store.submissions.filter((s) => memberTaskIds.has(s.taskId));
      return {
        displayName: a.internName,
        totalTaskCount: m.totalTaskCount,
        completedTaskCount: m.completedTaskCount,
        taskCompletionRate: m.taskCompletionRate,
        averageEvaluationScore: m.averageEvaluationScore,
        submissionCount: memberSubs.length,
        approvedCount: memberSubs.filter((s) => s.status === "approved").length,
        reworkCount: memberSubs.filter((s) => s.status === "rework").length,
      };
    });

  const timeline = session
    ? ctx.store.timelineEvents
        .filter((e) => e.sessionId === session.id)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((e) => ({ at: e.createdAt, action: e.action, summary: e.summary, actorName: e.actorName }))
    : [];

  return {
    id: report.id,
    kind: report.kind,
    title: report.title,
    createdAt: report.createdAt,
    projectName: project?.name ?? "—",
    scope: report.scope,
    summary: { total, completed, overdue, blocked, unassigned, risk, reasons },
    members,
    tasks: tasks.map((t) => ({
      code: t.code,
      title: t.title,
      status: t.status,
      assigneeName: t.assigneeName,
      priority: t.priority,
      dueDate: t.dueDate,
    })),
    timeline,
  };
}

async function listReports(ctx: Ctx): Promise<unknown> {
  const items = ctx.store.reports
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(reportRow);
  const counts = KINDS.map((kind) => ({ kind, count: ctx.store.reports.filter((r) => r.kind === kind).length }));
  return { items, counts };
}

async function createReport(ctx: Ctx): Promise<unknown> {
  const kind = typeof ctx.body?.kind === "string" ? (ctx.body.kind as ReportItem["kind"]) : null;
  if (!kind || !KINDS.includes(kind)) {
    throw badRequest("Loại báo cáo không hợp lệ.", ["kind: progress|performance|evaluation|review|risk"]);
  }
  const sessionId = typeof ctx.body?.sessionId === "string" && ctx.body.sessionId ? ctx.body.sessionId : ctx.store.sessions[0]?.id ?? null;
  const session = ctx.store.sessions.find((s) => s.id === sessionId || s.code === sessionId);
  const title =
    typeof ctx.body?.title === "string" && ctx.body.title.trim()
      ? ctx.body.title.trim()
      : `${KIND_TITLES[kind]} — ${session?.name ?? "Tổng quan"}`;

  // dedupe 30s: cùng kind + session + title
  const recent = ctx.store.reports.find(
    (r) => r.kind === kind && r.sessionId === (session?.id ?? null) && r.title === title && Date.now() - new Date(r.createdAt).getTime() < 30000
  );
  if (recent) return { id: recent.id, deduped: true };

  const report: ReportItem = {
    id: randomId("rep"),
    kind,
    title,
    scope: session ? `${session.code} · ${session.name}` : "Toàn hệ thống",
    sessionId: session?.id ?? null,
    createdAt: nowIso(),
    authorName: ctx.user!.displayName,
  };
  ctx.store.reports.unshift(report);
  return { id: report.id };
}

async function reportDetail(ctx: Ctx): Promise<unknown> {
  return buildSnapshot(ctx, getReport(ctx, ctx.params.id));
}

async function reportCsv(ctx: Ctx): Promise<unknown> {
  const report = getReport(ctx, ctx.params.id);
  const snapshot = buildSnapshot(ctx, report) as Record<string, unknown>;
  const summary = snapshot.summary as Record<string, unknown>;
  const members = snapshot.members as Record<string, unknown>[];
  const tasks = snapshot.tasks as Record<string, unknown>[];
  const timeline = snapshot.timeline as Record<string, unknown>[];

  const esc = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines: string[] = [];
  lines.push(esc(snapshot.title as string));
  lines.push(`Loại,${esc(snapshot.kind as string)}`);
  lines.push(`Dự án,${esc(snapshot.projectName as string)}`);
  lines.push(`Phạm vi,${esc(snapshot.scope as string)}`);
  lines.push(`Người tạo,${esc(report.authorName)}`);
  lines.push(`Ngày tạo,${esc(snapshot.createdAt as string)}`);
  lines.push("");
  lines.push("TỔNG QUAN");
  lines.push("Chỉ số,Giá trị");
  lines.push(`Tổng nhiệm vụ,${summary.total}`);
  lines.push(`Hoàn thành,${summary.completed}`);
  lines.push(`Trễ hạn (mở),${summary.overdue}`);
  lines.push(`Bị chặn,${summary.blocked}`);
  lines.push(`Chưa gán,${summary.unassigned}`);
  lines.push(`Mức rủi ro,${esc(summary.risk)}`);
  for (const r of summary.reasons as string[]) lines.push(`Lý do,${esc(r)}`);
  lines.push("");
  lines.push("THÀNH VIÊN");
  lines.push("Họ tên,Tổng task,Hoàn thành,Tỷ lệ hoàn thành (%),Điểm đánh giá,Bài nộp,Duyệt,Làm lại");
  for (const m of members) {
    lines.push(
      [
        m.displayName,
        m.totalTaskCount,
        m.completedTaskCount,
        m.taskCompletionRate,
        m.averageEvaluationScore ?? "",
        m.submissionCount,
        m.approvedCount,
        m.reworkCount,
      ]
        .map(esc)
        .join(",")
    );
  }
  lines.push("");
  lines.push("NHIỆM VỤ");
  lines.push("Mã,Tiêu đề,Trạng thái,Người thực hiện,Ưu tiên,Hạn");
  for (const t of tasks) {
    lines.push([t.code, t.title, t.status, t.assigneeName ?? "—", t.priority, (t.dueDate as string)?.slice(0, 10) ?? ""].map(esc).join(","));
  }
  lines.push("");
  lines.push("DÒNG THỜI GIAN");
  lines.push("Thời điểm,Hành động,Nội dung,Người thực hiện");
  for (const e of timeline) {
    lines.push([(e.at as string).slice(0, 16).replace("T", " "), e.action, e.summary, e.actorName].map(esc).join(","));
  }

  const csv = "\uFEFF" + lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report.id}-bao-cao.csv"`,
    },
  });
}

export const reportRoutes: RouteDef[] = [
  route("GET", "/reports", ["instructor", "admin"], listReports),
  route("POST", "/reports", ["instructor", "admin"], createReport),
  route("GET", "/reports/:id", ["instructor", "admin"], reportDetail),
  route("GET", "/reports/:id/csv", ["instructor", "admin"], reportCsv),
];
