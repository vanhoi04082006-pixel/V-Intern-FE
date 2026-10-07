"use client";
import type { InternWorkspace } from "@/lib/api/workspace";
import { SectionCard } from "./intern-primitives";
import { FolderKanban, ListTodo, SquareKanban } from "lucide-react";
export function ActiveEntry({ workspace }: { workspace: InternWorkspace }) {
  const { assignment, currentSprint, taskSummary, focusedTask } = workspace;
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold text-navy">Intern Workspace</h1>
      <SectionCard
        id="active-assignment"
        icon={FolderKanban}
        title="Phân công hiện tại"
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Dự án</dt>
            <dd className="font-semibold">{assignment?.project.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Phiên thực tập</dt>
            <dd className="font-semibold">{assignment?.session.name}</dd>
          </div>
        </dl>
      </SectionCard>
      <SectionCard
        id="active-sprint"
        icon={SquareKanban}
        title="Sprint hiện tại"
      >
        {currentSprint ? (
          <>
            <p className="font-semibold">
              {currentSprint.code} · {currentSprint.name}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {new Date(currentSprint.startDate).toLocaleDateString("vi-VN")} –{" "}
              {new Date(currentSprint.endDate).toLocaleDateString("vi-VN")} ·{" "}
              {currentSprint.status}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">Chưa có Sprint hiện tại.</p>
        )}
      </SectionCard>
      <SectionCard
        id="active-task-summary"
        icon={ListTodo}
        title="Tổng quan Task"
      >
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {(
            [
              { key: "total", label: "Tổng Task" },
              { key: "todo", label: "To do" },
              { key: "doing", label: "Đang làm" },
              { key: "review", label: "Chờ review" },
              { key: "done", label: "Hoàn thành" },
            ] as const
          ).map((item) => (
            <div key={item.key}>
              <dt className="text-sm text-slate-500">{item.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-navy">
                {taskSummary[item.key]}
              </dd>
            </div>
          ))}
        </dl>
      </SectionCard>
      <SectionCard
        id="active-focused-task"
        icon={ListTodo}
        title="Task đang tập trung"
      >
        {focusedTask ? (
          <>
            <p className="font-semibold">
              {focusedTask.code} · {focusedTask.title}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {focusedTask.status} · {focusedTask.priority} · Tiến độ{" "}
              {focusedTask.progress}%
            </p>
            <p className="mt-2 text-sm">
              Hạn:{" "}
              {focusedTask.dueDate
                ? new Date(focusedTask.dueDate).toLocaleDateString("vi-VN")
                : "Chưa có"}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">Chưa có Task đang tập trung.</p>
        )}
      </SectionCard>
    </div>
  );
}
