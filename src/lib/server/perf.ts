/**
 * Tính toán hiệu suất thực tập sinh từ dữ liệu thật trong store
 * (tasks, submissions, evaluations, assignments) — dùng chung cho
 * outcomes (intern), performance (instructor), evaluations ai-suggestions,
 * reports snapshot.
 */

import type { Store, Task } from "./types";

export interface PerformanceMetrics {
  totalTaskCount: number;
  completedTaskCount: number;
  taskCompletionRate: number;
  committedStoryPoints: number;
  completedStoryPoints: number;
  storyPointCompletionRate: number;
  onTimeCompletionRate: number;
  overdueOpenTaskCount: number;
  averageEvaluationScore: number | null;
  finalizedEvaluationCount: number;
  activeSprintProgress: number | null;
}

function rate(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function isOverdueOpen(t: Task): boolean {
  return t.status !== "done" && t.dueDate != null && new Date(t.dueDate).getTime() < Date.now();
}

/** Task hoàn thành đúng hạn: doneAt không vượt quá dueDate (+1h dung sai giờ). */
export function isDoneOnTime(t: Task): boolean {
  if (t.status !== "done" || !t.doneAt || !t.dueDate) return false;
  return new Date(t.doneAt).getTime() <= new Date(t.dueDate).getTime() + 3600000;
}

export function computePerformance(store: Store, userId: string): PerformanceMetrics {
  const tasks = store.tasks.filter((t) => t.assigneeId === userId);
  const done = tasks.filter((t) => t.status === "done");
  const onTime = done.filter(isDoneOnTime);

  const committed = tasks.reduce((a, t) => a + t.storyPoints, 0);
  const completedSp = done.reduce((a, t) => a + t.storyPoints, 0);

  const finalized = store.evaluations.filter((e) => e.internId === userId && e.status === "finalized");
  const averageEvaluationScore = finalized.length
    ? Math.round(finalized.reduce((a, e) => a + (e.overallScore ?? 0), 0) / finalized.length)
    : null;

  // Sprint active (hoặc sprint mới nhất) của session mà intern đang tham gia
  let activeSprintProgress: number | null = null;
  const assignment = store.assignments.find((a) => a.internId === userId && a.status === "active");
  if (assignment) {
    const sprints = store.sprints
      .filter((s) => s.sessionId === assignment.sessionId)
      .sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
    const target = sprints.find((s) => s.status === "active") ?? sprints[sprints.length - 1];
    if (target) {
      const st = store.tasks.filter((t) => t.sprintId === target.id);
      if (st.length) activeSprintProgress = Math.round(st.reduce((a, t) => a + t.progress, 0) / st.length);
    }
  }

  return {
    totalTaskCount: tasks.length,
    completedTaskCount: done.length,
    taskCompletionRate: rate(done.length, tasks.length),
    committedStoryPoints: committed,
    completedStoryPoints: completedSp,
    storyPointCompletionRate: rate(completedSp, committed),
    onTimeCompletionRate: rate(onTime.length, done.length),
    overdueOpenTaskCount: tasks.filter(isOverdueOpen).length,
    averageEvaluationScore,
    finalizedEvaluationCount: finalized.length,
    activeSprintProgress,
  };
}

/** Xu hướng 6 tháng gần nhất: số task tạo mới / hoàn thành theo tháng. */
export function computeTrend(store: Store, userId: string): { month: string; created: number; completed: number }[] {
  const tasks = store.tasks.filter((t) => t.assigneeId === userId);
  const now = new Date();
  const out: { month: string; created: number; completed: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
    out.push({
      month: `${new Date(start).getFullYear()}-${String(new Date(start).getMonth() + 1).padStart(2, "0")}`,
      created: tasks.filter((t) => {
        const x = new Date(t.createdAt).getTime();
        return x >= start && x < end;
      }).length,
      completed: tasks.filter((t) => {
        if (!t.doneAt) return false;
        const x = new Date(t.doneAt).getTime();
        return x >= start && x < end;
      }).length,
    });
  }
  return out;
}

/** Bài nộp mới nhất của một task (kèm thông tin review AI + mentor đã gộp). */
export function submissionInfoOf(store: Store, taskId: string): Record<string, unknown> | null {
  const subs = store.submissions.filter((s) => s.taskId === taskId);
  if (!subs.length) return null;
  const sub = subs[subs.length - 1];
  const review = store.codeReviews
    .filter((c) => c.submissionId === sub.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  return {
    id: sub.id,
    status: sub.status,
    prUrl: sub.prUrl,
    aiScore: review?.result?.score ?? null,
    aiSummary: review?.result?.summary ?? null,
    instructorScore: sub.score,
    instructorFeedback: sub.feedback,
    submittedAt: sub.submittedAt,
  };
}
