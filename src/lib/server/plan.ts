import type { Plan, PlanDraftSprint, PlanDraftTask, ProjectTemplate } from "./types";
import { addDaysIso } from "./util";

/** Ngữ cảnh phiên dùng để sinh kế hoạch draft. */
export interface PlanSessionContext {
  id: string;
  startDate: string;
}

const MIN_TASKS_PER_SPRINT = 6;
const MAX_TASKS_PER_SPRINT = 8;

/**
 * Sinh bản kế hoạch draft từ blueprint template:
 * mỗi sprint 2 tuần, 6-8 task/key T1… với phụ thuộc dạng chuỗi so le,
 * dueDate tính từ ngày bắt đầu phiên, kèm milestones.
 */
export function buildPlanDraft(
  template: Pick<ProjectTemplate, "blueprint" | "name">,
  session: PlanSessionContext
): NonNullable<Plan["draft"]> {
  const sprints: PlanDraftSprint[] = [];
  let counter = 1;
  template.blueprint.sprints.forEach((bs, si) => {
    // gộp task blueprint + task đệm để mỗi sprint đủ 6-8 task
    const baseTasks = bs.tasks.slice(0, MAX_TASKS_PER_SPRINT);
    const roles = Array.from(new Set(bs.tasks.map((t) => t.role)));
    const padCount = Math.max(0, MIN_TASKS_PER_SPRINT - baseTasks.length);
    const padTasks = Array.from({ length: padCount }, (_, i) => ({
      title: `Sửa lỗi và tinh chỉnh sau demo ${bs.name.replace(/^Sprint \d+ — /, "")} (đợt ${i + 1})`,
      priority: "medium" as const,
      storyPoints: 2,
      role: roles[i % Math.max(1, roles.length)] ?? "fullstack",
    }));
    const allTasks = [...baseTasks, ...padTasks];

    const tasks: PlanDraftTask[] = [];
    let prevKey: string | null = null;
    allTasks.forEach((bt, ti) => {
      const key = `T${counter++}`;
      // Nửa sau task nối vào task trước đó (chuỗi so le, tự nhiên như AI sinh)
      const dependsOn: string[] = prevKey && ti % 2 === 1 ? [prevKey] : [];
      tasks.push({
        key,
        dependsOn,
        title: bt.title,
        description: `Triển khai "${bt.title}" theo blueprint dự án ${template.name} — vai trò gợi ý ${bt.role}.`,
        priority: bt.priority,
        storyPoints: bt.storyPoints,
        dueDate: addDaysIso(session.startDate, si * 14 + Math.min(3 + ti * 2, 13)),
        suggestedRole: bt.role,
      });
      prevKey = key;
    });
    sprints.push({ code: bs.code, name: bs.name, goal: bs.goal, tasks });
  });
  return { sprints, milestones: template.blueprint.milestones };
}
