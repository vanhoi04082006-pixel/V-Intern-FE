import { Target } from "lucide-react";

import {
  PillButton,
  SectionCard,
  StatusBadge,
  TaskAvatar,
} from "./intern-primitives";
import type { InternWorkspaceState } from "./data/intern-mock-data";

/**
 * Card "Task đang tập trung" (state active) — mock VIN-103 theo reference.
 * ToD chỉ là checklist UI tĩnh (không state, không persistence). Wording
 * cố ý không nhắc "lưu token vào localStorage" — auth thật của hệ thống
 * là access token in-memory + refresh token HttpOnly cookie.
 */
export function FocusedTaskCard({
  focusedTask,
}: {
  focusedTask: Extract<
    InternWorkspaceState,
    { status: "active" }
  >["focusedTask"];
}) {
  const doneCount = focusedTask.dod.filter((item) => item.done).length;

  return (
    <SectionCard
      id="task-dang-tap-trung"
      icon={Target}
      tone="blue"
      title="Task đang tập trung"
    >
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Trái: nhận diện task */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-control bg-muted px-2 py-1 text-caption font-bold text-foreground">
              {focusedTask.taskId}
            </span>
            <StatusBadge tone="red">{focusedTask.priority}</StatusBadge>
          </div>
          <h3 className="mt-2 text-subsection font-bold text-foreground">
            {focusedTask.title}
          </h3>
          <p className="mt-2 text-small leading-relaxed text-muted-foreground">
            {focusedTask.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-caption">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <TaskAvatar index={0} className="size-6 text-caption" />
              {focusedTask.points} points
            </span>
            <span className="inline-flex items-center gap-2 font-semibold text-destructive">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-destructive"
              />
              {focusedTask.deadlineLabel}
            </span>
          </div>
        </div>

        {/* Phải: Definition of Done (mock UI) */}
        <div className="min-w-0 rounded-control border border-border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-small font-bold text-foreground">
              Definition of Done (DoD)
            </p>
            <p className="text-caption text-muted-foreground">
              {doneCount}/{focusedTask.dod.length} hoàn thành
            </p>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {focusedTask.dod.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={
                    item.done
                      ? "mt-1 grid size-4 shrink-0 place-items-center rounded border border-primary bg-primary text-primary-foreground"
                      : "mt-1 size-4 shrink-0 rounded border border-border bg-card"
                  }
                >
                  {item.done ? (
                    <svg viewBox="0 0 12 10" fill="none" className="h-2 w-2.5">
                      <path
                        d="M1 5.2 4.2 8.4 11 1.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                <span
                  className={
                    item.done
                      ? "text-small leading-snug text-muted-foreground line-through"
                      : "text-small leading-snug text-foreground"
                  }
                >
                  {item.label}
                  {/* Trạng thái không chỉ truyền qua màu/gạch ngang — SR đọc được. */}
                  <span className="sr-only">
                    {item.done ? " (hoàn thành)" : " (chưa hoàn thành)"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <PillButton variant="soft">Mở chi tiết</PillButton>
            <PillButton>Hỏi Mentor</PillButton>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
