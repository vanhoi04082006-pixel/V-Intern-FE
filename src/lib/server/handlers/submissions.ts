/** Submissions & AI code review: nộp bài, withdraw, review instructor, code-reviews lazy 4s. */

import type { CodeReview, CodeReviewResult, Submission, Task } from "../types";
import { getStore, notifyUser, pushAudit, pushTimeline } from "../store";
import { clamp, hashString, nowIso, randomHex, randomId } from "../util";
import { badRequest, conflict, forbidden, notFound, route, type RouteDef, type Ctx } from "./common";

const REVIEW_DELAY_MS = 4000;
const PASS_SCORE = 70;

function submissionPublic(s: Submission): Record<string, unknown> {
  return {
    id: s.id,
    taskId: s.taskId,
    internId: s.internId,
    internName: s.internName,
    prUrl: s.prUrl,
    summary: s.summary,
    status: s.status,
    score: s.score,
    feedback: s.feedback,
    headSha: s.headSha,
    submittedAt: s.submittedAt,
  };
}

function reviewPublic(c: CodeReview): Record<string, unknown> {
  return {
    id: c.id,
    submissionId: c.submissionId,
    status: c.status,
    model: c.model,
    result: c.result,
    evidence: c.evidence,
    scoredAt: c.scoredAt,
  };
}

function getSubmission(ctx: Ctx, id: string): Submission {
  const s = ctx.store.submissions.find((x) => x.id === id);
  if (!s) throw notFound("Không tìm thấy bài nộp.");
  return s;
}

function getTask(ctx: Ctx, id: string): Task {
  const t = ctx.store.tasks.find((x) => x.id === id || x.code === id);
  if (!t) throw notFound("Không tìm thấy nhiệm vụ.");
  return t;
}

/* ----------------------- Sinh kết quả AI review ----------------------- */

const FINDING_POOL: { file: string; line: number; message: string; severity: "warning" | "error" | "info" }[] = [
  { file: "src/components/Cart.tsx", line: 42, message: "Nên useMemo cho tổng tiền thay vì tính trực tiếp trong render.", severity: "warning" },
  { file: "src/components/Cart.tsx", line: 87, message: "Nút xóa sản phẩm nên có confirm để tránh bấm nhầm.", severity: "info" },
  { file: "src/lib/cart/store.ts", line: 33, message: "Hàm updateQty nên hủy request cũ khi đổi số lượng liên tục.", severity: "warning" },
  { file: "src/app/(shop)/gio-hang/page.tsx", line: 18, message: "Thiếu skeleton loading khi đang tải giỏ hàng.", severity: "info" },
  { file: "src/components/ProductCard.tsx", line: 55, message: "Dùng index làm key có thể gây lệch state khi lọc.", severity: "warning" },
  { file: "src/lib/format.ts", line: 12, message: "Hàm format tiền nên xử lý số âm và số 0 tường minh.", severity: "info" },
  { file: "src/components/Checkout/Step1.tsx", line: 88, message: "Trường số điện thoại chưa giới hạn ký tự nhập vào.", severity: "info" },
  { file: "src/lib/cart/sync.ts", line: 12, message: "Thiếu rollback state khi API trả lỗi 4xx.", severity: "error" },
  { file: "src/hooks/useCart.ts", line: 24, message: "Nên cleanup listener khi unmount để tránh memory leak.", severity: "warning" },
];

const LIMITATION_POOL = [
  "Chưa có test E2E cho luồng chính",
  "Chưa có test cho trường hợp lỗi mạng",
  "Chưa xử lý trường hợp API timeout",
  "Chưa có accessibility check đầy đủ (aria-label)",
];

function generateReviewResult(sub: Submission, task: Task): { result: CodeReviewResult; evidence: NonNullable<CodeReview["evidence"]> } {
  const h = hashString(sub.id + sub.prUrl);
  const summaryBonus = clamp(Math.floor(sub.summary.trim().length / 60), 0, 8);
  const base = clamp(52 + (h % 34) + summaryBonus, 40, 96);
  const rubricKeys = ["functional", "quality", "testing", "errors", "security", "dod"] as const;
  const rubric = {} as Record<(typeof rubricKeys)[number], number>;
  rubricKeys.forEach((k, i) => {
    rubric[k] = clamp(base + ((hashString(sub.id + k) % 13) - 6), 35, 100);
  });
  const score = Math.round(rubricKeys.reduce((acc, k) => acc + rubric[k], 0) / rubricKeys.length);

  const findings = [
    FINDING_POOL[h % FINDING_POOL.length],
    FINDING_POOL[(h + 3) % FINDING_POOL.length],
    ...(base < 60 ? [FINDING_POOL[(h + 6) % FINDING_POOL.length]] : []),
  ].filter((f, i, arr) => arr.findIndex((x) => x.message === f.message) === i);

  const passedTests = 4 + (h % 9);
  return {
    result: {
      score,
      rubric,
      summary:
        score >= 75
          ? `Bài nộp ${task.code} đạt chất lượng tốt: chức năng chính hoạt động, code rõ ràng. AI đề xuất ${score}/100 — chờ mentor xác nhận.`
          : `Bài nộp ${task.code} hoạt động được ở luồng chính nhưng còn ${findings.filter((f) => f.severity !== "info").length} điểm nên sửa. AI đề xuất ${score}/100 — chờ mentor xác nhận.`,
      limitations: [LIMITATION_POOL[h % LIMITATION_POOL.length], ...(score < 65 ? [LIMITATION_POOL[(h + 2) % LIMITATION_POOL.length]] : [])],
      findings,
    },
    evidence: {
      complete: true,
      trustedTests: {
        status: "passed",
        passed: passedTests,
        failed: 0,
        executionTimeMs: 3000 + (h % 3000),
        checks: [
          { name: "build", passed: true, log: "✓ Compiled successfully" },
          { name: "lint", passed: true, log: "✓ No ESLint warnings or errors" },
          { name: "test", passed: true, log: `✓ ${passedTests} passed, 0 failed` },
        ],
      },
    },
  };
}

/** Lazy-complete: review đang running sau 4s thì sinh kết quả. */
function maybeCompleteReview(c: CodeReview): void {
  if (c.status !== "running") return;
  if (Date.now() - new Date(c.createdAt).getTime() < REVIEW_DELAY_MS) return;
  const sub = getStoreSubmission(c.submissionId);
  const task = sub ? getStoreTask(sub.taskId) : undefined;
  if (!sub || !task) {
    c.status = "needs_changes";
    return;
  }
  const { result, evidence } = generateReviewResult(sub, task);
  c.result = result;
  c.evidence = evidence;
  c.status = "awaiting_instructor";
  c.scoredAt = nowIso();
  // thông báo cho intern
  notifyUser(
    sub.internId,
    "task",
    `AI đã review bài nộp ${task.code}: ${result.score}/100`,
    `Kết quả sơ bộ ${result.score}/100 — chờ mentor chốt. ${result.findings.length} phát hiện cần xem lại.`,
    `#/intern/work/${task.code}`
  );
}

// helpers tra store trực tiếp
function getStoreSubmission(id: string): Submission | undefined {
  return getStore().submissions.find((s) => s.id === id);
}
function getStoreTask(id: string): Task | undefined {
  return getStore().tasks.find((t) => t.id === id);
}

/* ------------------------------- handlers ------------------------------- */

async function listTaskSubmissions(ctx: Ctx): Promise<unknown> {
  const task = getTask(ctx, ctx.params.taskId);
  const items = ctx.store.submissions
    .filter((s) => s.taskId === task.id)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
    .map(submissionPublic);
  return { data: items };
}

async function createSubmission(ctx: Ctx): Promise<unknown> {
  const task = getTask(ctx, ctx.params.taskId);
  if (task.assigneeId !== ctx.user!.id) {
    throw forbidden("Chỉ người được giao nhiệm vụ mới được nộp bài.");
  }
  const prUrl = requireNonEmpty(ctx, "prUrl", "Link pull request");
  const summary = requireNonEmpty(ctx, "summary", "Tóm tắt thay đổi");
  if (!/^https?:\/\//.test(prUrl)) {
    throw badRequest("Link pull request không hợp lệ.", ["prUrl: phải bắt đầu bằng http(s)://"]);
  }
  if (task.status === "done") {
    throw conflict("Nhiệm vụ đã hoàn thành, không thể nộp thêm.");
  }

  const sub: Submission = {
    id: randomId("sub"),
    taskId: task.id,
    internId: ctx.user!.id,
    internName: ctx.user!.displayName,
    prUrl,
    summary,
    status: "submitted",
    score: null,
    feedback: null,
    headSha: randomHex(7),
    submittedAt: nowIso(),
    reviewedAt: null,
  };
  ctx.store.submissions.push(sub);

  // Tự động tạo code review status running
  const review: CodeReview = {
    id: randomId("cr"),
    submissionId: sub.id,
    status: "running",
    model: "gemini-2.0-flash",
    result: null,
    evidence: null,
    scoredAt: null,
    createdAt: nowIso(),
    instructorScores: null,
    instructorFeedback: null,
    overrideReason: null,
  };
  ctx.store.codeReviews.push(review);

  // Task → review
  const from = task.status;
  task.status = "review";
  if (task.progress < 60) task.progress = Math.max(task.progress, 60);
  task.version += 1;
  task.updatedAt = nowIso();
  (getStore().taskHistory[task.id] ?? (getStore().taskHistory[task.id] = [])).push({
    fromStatus: from,
    toStatus: "review",
    changedBy: ctx.user!.displayName,
    at: nowIso(),
    reason: "Nộp bài chờ đánh giá",
  });

  pushTimeline(
    getStore().sprints.find((s) => s.id === task.sprintId)?.sessionId ?? "ses_2025_01",
    "submission_submitted",
    `${ctx.user!.displayName} nộp bài ${task.code}, AI review đang chạy.`,
    ctx.user!.displayName
  );
  pushAudit(ctx.user!.displayName, "CREATE", `Nộp bài ${task.code} (${sub.id})`);
  ctx.store.aiRuns += 1;

  return submissionPublic(sub);
}

function requireNonEmpty(ctx: Ctx, field: string, label: string): string {
  const v = ctx.body?.[field];
  if (typeof v !== "string" || !v.trim()) {
    throw badRequest(`Trường "${label}" là bắt buộc.`, [`${field}: bắt buộc`]);
  }
  return v.trim();
}

async function withdrawSubmission(ctx: Ctx): Promise<unknown> {
  const sub = getSubmission(ctx, ctx.params.id);
  if (sub.internId !== ctx.user!.id) throw forbidden("Bạn chỉ có thể rút bài nộp của mình.");
  if (sub.status !== "submitted") {
    throw conflict(`Không thể rút bài nộp ở trạng thái '${sub.status}'.`);
  }
  sub.status = "withdrawn";
  const task = getStoreTask(sub.taskId);
  if (task && task.status === "review") {
    const from = task.status;
    task.status = "doing";
    task.version += 1;
    task.updatedAt = nowIso();
    (getStore().taskHistory[task.id] ?? (getStore().taskHistory[task.id] = [])).push({
      fromStatus: from,
      toStatus: "doing",
      changedBy: ctx.user!.displayName,
      at: nowIso(),
      reason: "Rút bài nộp",
    });
  }
  return submissionPublic(sub);
}

async function getCodeReviews(ctx: Ctx): Promise<unknown> {
  const sub = getSubmission(ctx, ctx.params.id);
  // intern chỉ xem review bài của mình; instructor/admin xem tất cả
  if (ctx.user!.role === "intern" && sub.internId !== ctx.user!.id) {
    throw forbidden("Bạn không có quyền xem review của bài nộp này.");
  }
  const reviews = ctx.store.codeReviews
    .filter((c) => c.submissionId === sub.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  for (const r of reviews) maybeCompleteReview(r);
  return { data: reviews.map(reviewPublic) };
}

async function rerunCodeReview(ctx: Ctx): Promise<unknown> {
  const sub = getSubmission(ctx, ctx.params.id);
  if (ctx.user!.role === "intern" && sub.internId !== ctx.user!.id) {
    throw forbidden("Bạn không có quyền chạy lại review của bài nộp này.");
  }
  if (sub.status === "withdrawn") throw conflict("Bài nộp đã rút, không thể review.");
  const review: CodeReview = {
    id: randomId("cr"),
    submissionId: sub.id,
    status: "running",
    model: "gemini-2.0-flash",
    result: null,
    evidence: null,
    scoredAt: null,
    createdAt: nowIso(),
    instructorScores: null,
    instructorFeedback: null,
    overrideReason: null,
  };
  ctx.store.codeReviews.push(review);
  ctx.store.aiRuns += 1;
  return reviewPublic(review);
}

async function instructorReview(ctx: Ctx): Promise<unknown> {
  const sub = getSubmission(ctx, ctx.params.id);
  if (sub.status !== "submitted") {
    throw conflict(`Bài nộp đang ở trạng thái '${sub.status}', không thể chốt đánh giá.`);
  }

  const scoresBody = (ctx.body?.scores ?? {}) as Record<string, unknown>;
  const keys = ["functional", "quality", "testing", "errors", "security", "dod"] as const;
  const missing = keys.filter((k) => typeof scoresBody[k] !== "number");
  if (missing.length) {
    throw badRequest("Điểm rubric chưa đủ.", missing.map((k) => `scores.${k}: số 0-100`));
  }
  for (const k of keys) {
    const v = scoresBody[k] as number;
    if (v < 0 || v > 100) throw badRequest(`Điểm ${k} phải từ 0 đến 100.`, [`scores.${k}: 0-100`]);
  }
  const feedback = typeof ctx.body?.feedback === "string" && ctx.body.feedback.trim() ? ctx.body.feedback.trim() : "";
  const overrideReason = typeof ctx.body?.overrideReason === "string" ? ctx.body.overrideReason : null;

  const rubric = {} as Record<(typeof keys)[number], number>;
  keys.forEach((k) => (rubric[k] = Math.round(scoresBody[k] as number)));
  const avg = Math.round(keys.reduce((acc, k) => acc + rubric[k], 0) / keys.length);
  const passed = avg >= PASS_SCORE;

  sub.status = passed ? "approved" : "rework";
  sub.score = avg;
  sub.feedback = feedback || (passed ? "Đạt yêu cầu." : "Cần làm lại theo nhận xét.");
  sub.reviewedAt = nowIso();

  const review =
    ctx.store.codeReviews
      .filter((c) => c.submissionId === sub.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] ?? null;
  if (review) {
    maybeCompleteReview(review);
    review.status = passed ? "passed" : "needs_changes";
    review.instructorScores = rubric;
    review.instructorFeedback = sub.feedback;
    review.overrideReason = overrideReason;
  }

  const task = getStoreTask(sub.taskId);
  if (task) {
    const from = task.status;
    task.status = passed ? "done" : "doing";
    if (passed) {
      task.progress = 100;
      task.doneAt = nowIso();
    }
    task.version += 1;
    task.updatedAt = nowIso();
    (getStore().taskHistory[task.id] ?? (getStore().taskHistory[task.id] = [])).push({
      fromStatus: from,
      toStatus: task.status,
      changedBy: ctx.user!.displayName,
      at: nowIso(),
      reason: passed ? `Duyệt bài nộp ${avg}/100` : `Yêu cầu làm lại (${avg}/100)`,
    });
    pushTimeline(
      getStore().sprints.find((s) => s.id === task.sprintId)?.sessionId ?? "ses_2025_01",
      passed ? "submission_approved" : "submission_rework",
      `${sub.internName} — ${task.code}: ${passed ? "duyệt" : "làm lại"} (${avg}/100).`,
      ctx.user!.displayName
    );
    notifyUser(
      sub.internId,
      "task",
      `${task.code}: ${passed ? "bài nộp được duyệt" : "cần làm lại"} (${avg}/100)`,
      passed
        ? `Mentor ${ctx.user!.displayName} đã duyệt bài nộp với ${avg}/100. Nhiệm vụ chuyển sang hoàn thành.`
        : `Mentor ${ctx.user!.displayName} yêu cầu làm lại với ${avg}/100. Vui lòng xem nhận xét và nộp lại.`,
      `#/intern/work/${task.code}`
    );
  }
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Chốt review bài nộp ${sub.id} → ${sub.status}`);

  return { submission: submissionPublic(sub), review: review ? reviewPublic(review) : null };
}

export const submissionRoutes: RouteDef[] = [
  route("GET", "/tasks/:taskId/submissions", "user", listTaskSubmissions),
  route("POST", "/tasks/:taskId/submissions", "intern", createSubmission),
  route("POST", "/submissions/:id/withdraw", "intern", withdrawSubmission),
  route("GET", "/submissions/:id/code-reviews", "user", getCodeReviews),
  route("POST", "/submissions/:id/code-reviews", "user", rerunCodeReview),
  route("POST", "/submissions/:id/review", ["instructor", "admin"], instructorReview),
];
