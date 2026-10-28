import { CalendarDays, MoreVertical, Plus, SquareKanban } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  CardLinkAction,
  GhostIconButton,
  PriorityBadge,
  SectionCard,
  TaskAvatar,
} from "./intern-primitives";
import { INTERN_TONES } from "./intern-ui-tones";
import type { InternTask, InternWorkspaceState } from "./data/intern-mock-data";

/**
 * Task Board 4 cột (To Do / Doing / Review / Done) — snapshot Sprint 03.
 * Đếm trên header derive từ `tasks.length` (không hardcode). Không có
 * drag-and-drop (ngoài scope, không thêm dependency).
 * Tablet/mobile: các cột scroll ngang trong container, không vỡ layout.
 */
export function TaskBoard({
  columns,
}: {
  columns: Extract<
    InternWorkspaceState,
    { status: "active" }
  >["boardColumns"];
}) {
  return (
    <SectionCard
      id="task-board"
      icon={SquareKanban}
      tone="blue"
      title="Task Board"
      actions={<CardLinkAction label="Xem tất cả task" />}
      bodyClassName="p-0 sm:p-0"
    >
      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-full gap-4 px-4 py-4 sm:px-5 [width:max-content] xl:w-full">
          {columns.map((column) => {
            const toneStyle = INTERN_TONES[column.tone];

            return (
              <li
                key={column.id}
                className={cn(
                  "flex w-[260px] shrink-0 flex-col rounded-panel border p-3 xl:w-auto xl:min-w-0 xl:flex-1",
                  column.id === "todo"
                    ? "border-border bg-background"
                    : column.id === "doing"
                      ? "border-border bg-accent"
                      : column.id === "review"
                        ? "border-border bg-warning-subtle"
                        : "border-border bg-success-subtle"
                )}
                aria-label={`${column.title}, ${column.tasks.length} task`}
              >
                <div className="flex items-center justify-between gap-2 px-1 pb-3">
                  <h3 className="flex items-center gap-2 text-body font-bold text-foreground">
                    <span
                      aria-hidden="true"
                      className={cn("size-2 rounded-full", toneStyle.bar)}
                    />
                    {column.title}
                    <span className="rounded-full bg-card px-2 py-1 text-caption font-bold text-muted-foreground ring-1 ring-ring">
                      {column.tasks.length}
                    </span>
                  </h3>
                  <GhostIconButton label={`Thêm task vào ${column.title}`}>
                    <Plus className="size-4" />
                  </GhostIconButton>
                </div>

                <ul className="flex flex-col gap-3">
                  {column.tasks.map((task, taskIndex) => (
                    <li key={task.id}>
                      <TaskCard task={task} avatarIndex={taskIndex} />
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
    </SectionCard>
  );
}

/** Task card theo reference: ID + title + mô tả + badge + hạn + avatar. */
function TaskCard({ task, avatarIndex }: { task: InternTask; avatarIndex: number }) {
  const dueToneStyle = INTERN_TONES[task.dueTone];

  return (
    <article className="rounded-control border border-border bg-card p-3 shadow-app-xs">
      <div className="flex items-start justify-between gap-2">
        <p className="text-small font-bold tracking-tight text-foreground">
          {task.id}
        </p>
        <GhostIconButton label={`Tuỳ chọn task ${task.id}`} className="size-6">
          <MoreVertical className="size-3.5" />
        </GhostIconButton>
      </div>
      <p className="mt-1 text-body font-semibold leading-snug text-foreground">
        {task.title}
      </p>
      <p className="mt-1 line-clamp-2 text-caption leading-relaxed text-muted-foreground">
        {task.description}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-muted px-2 py-1 text-caption font-semibold text-muted-foreground">
          {task.points} pts
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p
          className={cn(
            "inline-flex min-w-0 items-center gap-2 text-caption font-medium",
            dueToneStyle.icon
          )}
        >
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{task.dueLabel}</span>
        </p>
        <TaskAvatar index={avatarIndex} className="size-6 text-caption" />
      </div>
    </article>
  );
}
