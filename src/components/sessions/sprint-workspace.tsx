"use client";
import { SessionSection as Panel } from "./session-section";
import Link from "next/link";
import { InstructorHeading, instructorDate } from "@/components/instructor/instructor-ui";
import { useCallback, useEffect, useState } from "react";
import { getSprint, listTasks, fetchSprintBurndown } from "@/lib/api/delivery";
import { getMembers } from "@/lib/api/academic";
import { listSessionWork } from "@/lib/api/session-work";
import {
  priorities,
  priorityLabels,
  statusLabels,
  taskStatuses,
} from "@/lib/api/work";
import { roleLabel } from "@/lib/api/workspace";
import { useResource } from "@/lib/api/use-resource";
import { Can } from "@/components/auth/can";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  Badge,
  Empty,
  Modal,
  Pager,
  inputClass,
} from "@/components/product/primitives";
import { SprintOverview } from "@/components/product/sprint-overview";
import { SprintBurndown } from "@/components/workspace/workspace-charts";
import { TaskManagement } from "@/components/product/sprint-management";
import { ActivateButton } from "@/components/product/instructor-onboarding";
import { TaskDetail } from "@/components/product/intern-work";
import { SessionTaskDelivery } from "./session-task-delivery";

const sprintStatusLabels: Record<string, string> = {
  planned: "Đã lập kế hoạch",
  active: "Đang chạy",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
};

export function SprintDelivery({
  sprintId,
  projectId,
  sessionId,
  revision,
  onOpen,
}: {
  sprintId: string;
  projectId: string;
  sessionId: string | null;
  revision: number;
  onOpen: (id: string) => void;
}) {
  const [page, setPage] = useState(1),
    [filters, setFilters] = useState({
      status: "",
      priority: "",
      assigneeId: "",
      search: "",
    });
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(filters.search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);
  const members = useResource(
    useCallback(
      (signal: AbortSignal) =>
        getMembers(
          sessionId ? "sessions" : "projects",
          sessionId ?? projectId,
          signal,
        ),
      [sessionId, projectId],
    ),
    revision,
  );
  const tasks = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        const q = {
          sprintId,
          projectId,
          page,
          pageSize: 10,
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.priority ? { priority: filters.priority } : {}),
          ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
          ...(search ? { search } : {}),
        };
        if (sessionId) return listSessionWork({ ...q, sessionId }, signal);
        const legacy = await listTasks(q, signal);
        return {
          ...legacy,
          items: legacy.items.map((task) => ({ ...task, delivery: null })),
        };
      },
      [
        sprintId,
        projectId,
        sessionId,
        page,
        filters.status,
        filters.priority,
        filters.assigneeId,
        search,
      ],
    ),
    revision,
  );
  function filter(key: keyof typeof filters, value: string) {
    setFilters((old) => ({ ...old, [key]: value }));
    if (key !== "search") setPage(1);
  }
  return (
    <div className="space-y-4">
      <Panel title={sessionId ? "Đội hình phiên" : "Thành viên dự án"}>
        {members.loading ? (
          <LoadingState />
        ) : members.error ? (
          <ErrorState error={members.error} onRetry={members.reload} />
        ) : members.data?.length ? (
          <ul className="ins-roster-list">
            {members.data.map((m) => (
              <li
                className="min-w-0 break-words border-b border-border py-3 text-body"
                key={m.userId}
              >
                <strong>{m.displayName}</strong>
                <p className="mt-1 text-caption text-muted-foreground">
                  {m.role ? roleLabel(m.role) : "Chưa có vai trò dự án"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Chưa có thành viên.</Empty>
        )}
        <p className="mt-3 text-caption text-muted-foreground">
          Người phụ trách từng task được hiển thị bên dưới.
        </p>
      </Panel>
      <div id="sprint-task-list" className="scroll-mt-20">
        <Panel title="Task & bài nộp của Sprint">
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <input
              aria-label="Tìm task trong Sprint"
              maxLength={128}
              className={inputClass}
              value={filters.search}
              placeholder="Mã hoặc tên task"
              onChange={(e) => filter("search", e.target.value)}
            />
            <select
              aria-label="Trạng thái task trong Sprint"
              className={inputClass}
              value={filters.status}
              onChange={(e) => filter("status", e.target.value)}
            >
              <option value="">Mọi trạng thái</option>
              {taskStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
            <select
              aria-label="Ưu tiên task trong Sprint"
              className={inputClass}
              value={filters.priority}
              onChange={(e) => filter("priority", e.target.value)}
            >
              <option value="">Mọi ưu tiên</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {priorityLabels[p]}
                </option>
              ))}
            </select>
            <select
              aria-label="Người nhận task trong Sprint"
              className={inputClass}
              value={filters.assigneeId}
              onChange={(e) => filter("assigneeId", e.target.value)}
            >
              <option value="">Mọi thành viên</option>
              {members.data?.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>
          {tasks.loading ? (
            <LoadingState />
          ) : tasks.error ? (
            <ErrorState error={tasks.error} onRetry={tasks.reload} />
          ) : (
            tasks.data && (
              <>
                {tasks.data.items.length ? (
                  <ul className="ins-task-list">
                    {tasks.data.items.map((t) => (
                      <li
                        key={t.id}
                        className="ins-task-row break-words"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <button
                            className="text-left text-body font-semibold text-primary hover:underline"
                            onClick={() => onOpen(t.id)}
                          >
                            {t.title}
                          </button>
                          <Badge>{statusLabels[t.status]}</Badge>
                        </div>
                        <p className="mt-2 break-all font-mono text-caption text-muted-foreground">
                          {t.code}
                        </p>
                        <p className="mt-2 text-caption text-muted-foreground">
                          {t.assigneeId
                            ? (members.data?.find(
                                (m) =>
                                  m.userId.toLowerCase() ===
                                  t.assigneeId?.toLowerCase(),
                              )?.displayName ?? "Đã phân công")
                            : "Chưa phân công"}{" "}
                         · {priorityLabels[t.priority]}, {t.progress}%
                        </p>
                        <p className="mt-1 text-caption text-muted-foreground">
                          Hạn{" "}
                          {t.dueDate
                            ? instructorDate(t.dueDate)
                            : "Chưa có hạn"}
                        </p>
                        <SessionTaskDelivery data={t.delivery} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>Không có task trong bộ lọc.</Empty>
                )}
                <Pager {...tasks.data} onChange={setPage} unit="task" />
              </>
            )
          )}
        </Panel>
      </div>
    </div>
  );
}

/** Burndown fails soft — the chart simply stays hidden when data is unavailable. */
export function SprintBurndownSection({ id }: { id: string }) {
  const data = useResource(
    useCallback((signal: AbortSignal) => fetchSprintBurndown(id, signal), [id]),
  );
  if (data.loading || data.error || !data.data) return null;
  return <SprintBurndown points={data.data} />;
}

export function SprintWorkspace({
  id,
  basePath = "/instructor",
}: {
  id: string;
  basePath?: "/instructor" | "/admin";
}) {
  const data = useResource(
    useCallback((signal: AbortSignal) => getSprint(id, signal), [id]),
  );
  const [revision, setRevision] = useState(0),
    [manage, setManage] = useState(false),
    [selected, setSelected] = useState("");
  const reload = () => setRevision((value) => value + 1);
  if (data.loading) return <LoadingState />;
  if (data.error || !data.data)
    return <ErrorState error={data.error} onRetry={data.reload} />;
  const sprint = data.data;
  return (
    <div className="space-y-5">
      {basePath === "/instructor" && <InstructorHeading
        title={sprint.name}
        description={`Chi tiết Sprint, ${sprint.code}, ${sprint.startDate ? instructorDate(sprint.startDate) : "Chưa có ngày bắt đầu"} — ${sprint.endDate ? instructorDate(sprint.endDate) : "Chưa có ngày kết thúc"}`}
        back={{ href: "/instructor/sprints", label: "Sprint & công việc" }}
        action={<Badge>{sprintStatusLabels[sprint.status] ?? sprint.status}</Badge>}
      />}
      <Panel
        title={basePath === "/instructor" ? "Mục tiêu Sprint" : sprint.name}
        action={
          basePath !== "/instructor" && <Badge>{sprintStatusLabels[sprint.status] ?? sprint.status}</Badge>
        }
      >
        {basePath !== "/instructor" && <p className="text-body text-muted-foreground">
          {sprint.code} ·{" "}
          {sprint.startDate
            ? instructorDate(sprint.startDate)
            : "Chưa có ngày bắt đầu"}{" "}
          →{" "}
          {sprint.endDate
            ? instructorDate(sprint.endDate)
            : "Chưa có ngày kết thúc"}
        </p>}
        {basePath !== "/instructor" && <h2 className="mt-3 text-body font-semibold">Mục tiêu Sprint</h2>}
        <p className="mt-1 whitespace-pre-wrap text-body">
          {sprint.goal ?? "Chưa ghi mục tiêu."}
        </p>
        {sprint.sessionId && (
          <Link
            className="mt-3 inline-block text-body font-semibold text-primary"
            href={`${basePath}/sessions/${sprint.sessionId}`}
          >
            Mở phiên thực tập →
          </Link>
        )}
      </Panel>
      {sprint.status === "planned" && (
        <div className="space-y-3 rounded-panel border border-border bg-warning-subtle p-4 text-body text-warning">
          <p>
            Sprint đã được lập kế hoạch nhưng chưa bắt đầu. Sinh viên sẽ thấy
            Sprint Board sau khi giảng viên kích hoạt Sprint này.
          </p>
          <Can perm="sprints.manage">
            <ActivateButton
              kind="sprints"
              id={id}
              status={sprint.status}
              onChanged={() => {
                data.reload();
                reload();
              }}
            />
          </Can>
        </div>
      )}
      <SprintOverview
        instructor={basePath === "/instructor"}
        id={id}
        revision={revision}
        onUpdated={reload}
        onManage={() => setManage(true)}
      />
      <Can perm={["tasks.view", "sprints.view"]}>
        <SprintBurndownSection id={id} />
      </Can>
      <Can
        perm={
          sprint.sessionId
            ? ["sessions.view", "tasks.view"]
            : ["projects.view", "tasks.view"]
        }
        fallback={
          <p id="sprint-task-list" className="text-body text-muted-foreground">
            Cần quyền xem đội hình và task để mở danh sách chi tiết.
          </p>
        }
      >
        <SprintDelivery
          key={id}
          sprintId={id}
          projectId={sprint.projectId}
          sessionId={sprint.sessionId}
          revision={revision}
          onOpen={setSelected}
        />
      </Can>
      <Can perm="tasks.manage">
        <details
          id="sprint-task-management"
          className="scroll-mt-20 border-t border-border py-5"
          open={manage}
          onToggle={(event) => setManage(event.currentTarget.open)}
        >
          <summary className="cursor-pointer text-body font-semibold text-primary">
            Thêm và chỉnh sửa task trong Sprint
          </summary>
          {manage && (
            <div className="mt-4">
              <TaskManagement
                projectId={sprint.projectId}
                sprintId={id}
                onUpdated={reload}
              />
            </div>
          )}
        </details>
      </Can>
      {selected && (
        <Modal title="Chi tiết nhiệm vụ" onClose={() => setSelected("")}>
          <TaskDetail id={selected} managed onUpdated={reload} />
        </Modal>
      )}
    </div>
  );
}
