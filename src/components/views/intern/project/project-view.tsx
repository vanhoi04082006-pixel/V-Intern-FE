"use client";

import * as React from "react";
import {
  ArrowRight,
  CalendarRange,
  FolderGit2,
  Rocket,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { navigate } from "@/lib/client/router";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import {
  sprintApi,
  taskApi,
  workspaceApi,
  type AssignmentResource,
  type Task,
} from "@/lib/client/api";
import { ViewFrame } from "@/components/shared/view";
import {
  AnimatedProgressBar,
  Empty,
  KeyValue,
  PageHeader,
  Panel,
  PanelHeader,
  UserAvatar,
} from "@/components/shared/primitives";
import { RoleBadge, SessionStatusBadge } from "@/components/shared/badges";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Chip, SprintStatusBadge } from "../shared";

/* ------------------------- Dữ liệu dự án (ghép từ API) ------------------------- */

interface ProjectSprintRow {
  key: string;
  code: string;
  name: string;
  status: "active" | "done" | "upcoming";
  progress: number;
  taskTotal: number;
  taskDone: number;
  startDate: string | null;
  endDate: string | null;
}

interface MyProjectData {
  role: string;
  assignedAt: string;
  project: AssignmentResource;
  session: AssignmentResource;
  currentSprint: { code: string; name: string; goal: string; progress: number } | null;
  sprints: ProjectSprintRow[];
  members: { name: string; role: string }[];
  totals: { taskTotal: number; taskDone: number };
}

/** "SPR-01" → "Sprint 1" (tên đầy đủ chỉ có ở sprint hiện tại). */
function sprintNameOfCode(code: string): string {
  const m = code.match(/^SPR-(\d+)$/i);
  return m ? `Sprint ${parseInt(m[1], 10)}` : code;
}

async function loadMyProject(): Promise<MyProjectData | null> {
  const ws = await workspaceApi.my();
  if (!ws.assignment) return null;
  const { assignment } = ws;

  const [board, tasksRes] = await Promise.all([
    sprintApi.myBoard().catch(() => null),
    taskApi.list({ projectId: assignment.project.id, pageSize: 200 }),
  ]);
  const tasks = tasksRes.data;

  // Gom task theo sprint
  const groups = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = t.sprintId ?? t.sprintCode ?? "none";
    const arr = groups.get(key);
    if (arr) arr.push(t);
    else groups.set(key, [t]);
  }
  const currentId = board?.sprint?.id ?? null;
  const sprints: ProjectSprintRow[] = [...groups.entries()]
    .map(([key, items]) => {
      const code = items[0]?.sprintCode ?? "—";
      const isCurrent = currentId != null && key === currentId;
      const taskDone = items.filter((t) => t.status === "done").length;
      const computed = items.length > 0 ? Math.round((taskDone / items.length) * 100) : 0;
      return {
        key,
        code,
        name: isCurrent && board?.sprint ? board.sprint.name : sprintNameOfCode(code),
        status: (isCurrent
          ? "active"
          : items.length > 0 && taskDone === items.length
            ? "done"
            : "upcoming") as ProjectSprintRow["status"],
        progress: isCurrent && board?.sprint ? board.sprint.progress : computed,
        taskTotal: items.length,
        taskDone,
        startDate: isCurrent && board?.sprint ? board.sprint.startDate : null,
        endDate: isCurrent && board?.sprint ? board.sprint.endDate : null,
      };
    })
    .sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));

  // Thành viên = người được giao task trong dự án
  const memberMap = new Map<string, Set<string>>();
  for (const t of tasks) {
    if (!t.assigneeName) continue;
    const roles = memberMap.get(t.assigneeName);
    if (roles) roles.add(t.role);
    else memberMap.set(t.assigneeName, new Set([t.role]));
  }
  const members = [...memberMap.entries()]
    .map(([name, roles]) => ({ name, role: [...roles][0] ?? "intern" }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));

  return {
    role: assignment.role,
    assignedAt: assignment.assignedAt,
    project: assignment.project,
    session: assignment.session,
    currentSprint: board?.sprint
      ? {
          code: board.sprint.code,
          name: board.sprint.name,
          goal: board.sprint.goal,
          progress: board.sprint.progress,
        }
      : null,
    sprints,
    members,
    totals: {
      taskTotal: tasks.length,
      taskDone: tasks.filter((t) => t.status === "done").length,
    },
  };
}

/* ---------------------------------- View ---------------------------------- */

/** /intern/project — tổng quan dự án, phiên thực tập, sprint và đội ngũ. */
export function ProjectView() {
  const res = useResource(loadMyProject, []);

  if (res.loading && !res.data) {
    return (
      <ViewFrame>
        <LoadingBlock variant="detail" rows={6} />
      </ViewFrame>
    );
  }
  if (res.error && !res.data) {
    return (
      <ViewFrame>
        <ErrorBlock error={res.error} onRetry={res.reload} />
      </ViewFrame>
    );
  }

  if (!res.data) {
    return (
      <ViewFrame>
        <PageHeader
          eyebrow="Dự án"
          title="Dự án của tôi"
          description="Thông tin dự án bạn đang thực tập."
        />
        <Panel>
          <Empty
            icon={<FolderGit2 className="size-5 icon" />}
            title="Bạn chưa được phân vào dự án nào"
            description="Sau khi trúng tuyển phỏng vấn AI, giảng viên sẽ phân bạn vào một dự án phù hợp với vai trò đã chọn."
          />
        </Panel>
      </ViewFrame>
    );
  }

  const data = res.data;
  const sessionProgress =
    data.totals.taskTotal > 0
      ? Math.round((data.totals.taskDone / data.totals.taskTotal) * 100)
      : 0;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Dự án của tôi"
        title={data.project.name}
        description="Toàn cảnh dự án, phiên thực tập, lộ trình sprint và đồng đội của bạn."
        actions={<SessionStatusBadge status={data.project.status} />}
      />

      {/* Hero dự án */}
      <Panel className="mb-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-brand/25 bg-brand/[0.08] px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-brand-bright">
            {data.project.code}
          </span>
          <RoleBadge role={data.role} />
          <span className="text-[11px] text-faint">
            Tham gia từ {formatDate(data.assignedAt)}
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-dim">
          {data.project.description}
        </p>
        {data.project.techStack?.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-faint">
              Công nghệ:
            </span>
            {data.project.techStack.map((tech) => (
              <Chip key={tech} tone="brand">
                {tech}
              </Chip>
            ))}
          </div>
        ) : null}
      </Panel>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
        {/* Cột trái: phiên thực tập + sprint */}
        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader
              title="Phiên thực tập"
              icon={<CalendarRange className="size-4 icon" />}
              description="Giai đoạn thực tập mà dự án này thuộc về."
            />
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-brand-bright/80">
                  {data.session.code}
                </span>
                <SessionStatusBadge status={data.session.status} />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-ink">
                {data.session.name}
              </h3>
              <dl className="grid grid-cols-2 gap-4">
                <KeyValue label="Bắt đầu">{formatDate(data.session.startDate ?? null)}</KeyValue>
                <KeyValue label="Kết thúc">{formatDate(data.session.endDate ?? null)}</KeyValue>
              </dl>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-dim">Tiến độ chung của phiên</span>
                  <span className="font-mono text-dim">
                    {data.totals.taskDone}/{data.totals.taskTotal} nhiệm vụ
                  </span>
                </div>
                <AnimatedProgressBar value={sessionProgress} showLabel />
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Lộ trình sprint"
              icon={<Rocket className="size-4 icon" />}
              description="Tiến độ theo từng sprint của dự án."
            />
            <div className="divide-y divide-line">
              {data.sprints.length === 0 ? (
                <p className="p-5 text-sm text-dim">Dự án chưa có sprint nào.</p>
              ) : (
                data.sprints.map((s) => (
                  <div key={s.key} className="space-y-2.5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-brand-bright/80">
                          {s.code}
                        </span>
                        <span className="truncate text-sm font-medium text-ink" title={s.name}>
                          {s.name}
                        </span>
                      </div>
                      <SprintStatusBadge status={s.status} />
                    </div>
                    <AnimatedProgressBar
                      value={s.progress}
                      showLabel
                      tone={s.status === "active" ? "brand" : "teal"}
                    />
                    <p className="text-[11px] text-faint">
                      {s.startDate && s.endDate
                        ? `${formatDate(s.startDate)} → ${formatDate(s.endDate)}`
                        : `Chưa có ngày cụ thể`}{" "}
                      · {s.taskDone}/{s.taskTotal} nhiệm vụ hoàn thành
                    </p>
                    {data.currentSprint && s.code === data.currentSprint.code ? (
                      <p className="rounded-lg border border-brand/20 bg-brand/[0.05] px-3 py-2 text-xs italic leading-relaxed text-dim">
                        Mục tiêu: {data.currentSprint.goal}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* Cột phải: thành viên + mentor CTA */}
        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader
              title="Đội ngũ dự án"
              icon={<Users className="size-4 icon" />}
              description={`${data.members.length} thành viên đang thực tập`}
            />
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {data.members.map((m) => (
                <div
                  key={m.name}
                  className="rounded-xl border border-line bg-deep/50 p-3 transition-colors hover:border-line-strong"
                >
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={m.name} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink" title={m.name}>
                        {m.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <RoleBadge role={m.role} />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-400">
                    <UserRound className="size-3 icon" /> Đang thực tập
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="relative overflow-hidden">
            <div
              className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-brand/10 blur-3xl"
              aria-hidden
            />
            <div className="p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand-bright">
                <Sparkles className="size-5 icon" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-ink">Mentor AI 24/7</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-dim">
                Kẹt ở task nào? Hỏi Mentor AI ngay — cố vấn kỹ thuật trả lời trong vài giây, kèm ví
                dụ code khi cần.
              </p>
              <Button
                onClick={() => navigate("/intern/mentor")}
                className="mt-4 w-full rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
              >
                Hỏi Mentor AI <ArrowRight className="size-3.5 icon" />
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </ViewFrame>
  );
}
