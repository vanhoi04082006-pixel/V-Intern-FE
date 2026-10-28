"use client";
import { SessionSection as Panel } from "./session-section";
import {
  InstructorHeading,
  InstructorSectionNav,
  instructorDate,
  instructorSessionStatus,
  instructorPlanStatus,
} from "@/components/instructor/instructor-ui";
import { sprintStatusLabel } from "@/lib/api/sprint-status";
import { SessionRepositoryCard } from "@/components/product/github-connection";
import { getSessionUser } from "@/lib/auth/session";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import {
  Badge,
  Empty,
  PageTitle,
  Pager,
  inputClass,
} from "@/components/product/primitives";
import { useResource } from "@/lib/api/use-resource";
import { getSessionDetail } from "@/lib/api/sessions";
import { listSprints } from "@/lib/api/delivery";
import { listSessionWork } from "@/lib/api/session-work";
import { listPlans } from "@/lib/api/planning";
import {
  statusLabels,
  taskStatuses,
  priorities,
  priorityLabels,
} from "@/lib/api/work";
import { AiPlanPanel } from "./ai-plan";
import { Can } from "@/components/auth/can";
import { roleLabel } from "@/lib/api/workspace";
import { SessionTaskDelivery } from "./session-task-delivery";
import { SessionTimeline } from "./session-timeline";
import { MemberPerformance } from "@/components/product/member-performance";
import { ReportsWorkspace } from "./reports-workspace";

function snapshotItems(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  if (value && typeof value === "object")
    return Object.values(value).flatMap((v) =>
      typeof v === "string"
        ? [v]
        : Array.isArray(v)
          ? v.filter((s): s is string => typeof s === "string")
          : [],
    );
  return [];
}

export interface DetailDeps {
  getSession: typeof getSessionDetail;
  listSprints: typeof listSprints;
  listTasks: typeof listSessionWork;
  listPlans: typeof listPlans;
}

/**
 * Session detail (M6): real overview — sprints, tasks, AI plan status and
 * progress, all from live endpoints. No mock numbers anywhere.
 */
export function SessionOverview({
  sessionId,
  deps,
  basePath = "/instructor",
  initialTaskStatus = "",
}: {
  sessionId: string;
  deps?: Partial<DetailDeps>;
  basePath?: "/instructor" | "/admin";
  initialTaskStatus?: string;
}) {
  const {
    getSession = getSessionDetail,
    listSprints: loadSprints = listSprints,
    listTasks: loadTasks = listSessionWork,
    listPlans: loadPlans = listPlans,
  } = deps ?? {};

  const [sprintPage, setSprintPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [filters, setFilters] = useState({
    status: taskStatuses.includes(
      initialTaskStatus as (typeof taskStatuses)[number],
    )
      ? initialTaskStatus
      : "",
    priority: "",
    assigneeId: "",
    sprintId: "",
  });
  const [showPerformance, setShowPerformance] = useState(false),
    [showReports, setShowReports] = useState(false);
  function filter(key: keyof typeof filters, value: string) {
    setFilters((old) => ({ ...old, [key]: value }));
    setTaskPage(1);
  }
  const data = useResource(
    useCallback(
      (signal: AbortSignal) => getSession(sessionId, signal),
      [getSession, sessionId],
    ),
  );
  const delivery = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        const [sprintsPage, tasksPage] = await Promise.all([
          loadSprints({ sessionId, page: sprintPage, pageSize: 10 }, signal),
          loadTasks(
            {
              sessionId,
              page: taskPage,
              pageSize: 20,
              ...Object.fromEntries(
                Object.entries(filters).filter(([, v]) => v),
              ),
            },
            signal,
          ),
        ]);
        return { sprintsPage, tasksPage };
      },
      [sessionId, sprintPage, taskPage, loadSprints, loadTasks, filters],
    ),
  );

  const plans = useResource(
    useCallback(
      (signal: AbortSignal) => loadPlans(sessionId, signal),
      [sessionId, loadPlans],
    ),
  );

  const handledSectionLink = useRef(false);
  useEffect(() => {
    // A user who scrolls before the requests finish has taken over navigation.
    const cancelAutomaticScroll = () => {
      handledSectionLink.current = true;
    };
    window.addEventListener("wheel", cancelAutomaticScroll, { passive: true });
    window.addEventListener("touchstart", cancelAutomaticScroll, {
      passive: true,
    });
    return () => {
      window.removeEventListener("wheel", cancelAutomaticScroll);
      window.removeEventListener("touchstart", cancelAutomaticScroll);
    };
  }, []);
  useEffect(() => {
    if (
      basePath !== "/instructor" ||
      handledSectionLink.current ||
      !data.data ||
      delivery.loading ||
      plans.loading
    )
      return;
    const id = window.location.hash.slice(1);
    if (
      ![
        "session-team",
        "session-project",
        "session-plan",
        "session-sprints",
        "session-work",
        "session-activity",
      ].includes(id)
    )
      return;
    const target = document.getElementById(id);
    if (!target) return;
    const disclosure = target.querySelector("details");
    if (disclosure) disclosure.open = true;
    target.scrollIntoView({ block: "start", behavior: "auto" });
    handledSectionLink.current = true;
  }, [basePath, data.data, delivery.loading, plans.loading]);

  if (data.loading)
    return (
      <p role="status" className="p-4 text-body text-muted-foreground">
        Đang tải phiên...
      </p>
    );
  if (data.error || !data.data)
    return <ErrorState error={data.error} onRetry={data.reload} />;
  const session = data.data;
  const sprints = delivery.data?.sprintsPage.items ?? [];
  const tasks = delivery.data?.tasksPage.items ?? [];
  const totalTasks = session.overview.taskTotal;
  const progress = {
    done: session.overview.taskDone,
    percent: session.overview.taskPercent,
  };
  const projectId = session.overview.project?.id;

  return (
    <div className="space-y-4">
      {basePath === "/instructor" ? (
        <InstructorHeading
          title={session.name}
          description={`${session.code} · ${instructorSessionStatus(session.status)} · ${instructorDate(session.startDate)} — ${instructorDate(session.endDate)}`}
          back={{ href: "/instructor/sessions", label: "Phiên thực tập" }}
          action={
            projectId ? (
              <Link
                className="ins-queue-action"
                href={`/instructor/sessions/${sessionId}/setup?project=${projectId}`}
              >
                Đội hình & thiết lập
              </Link>
            ) : undefined
          }
        />
      ) : (
        <PageTitle
          title={session.name}
          subtitle={`${session.code} · ${session.status}${session.startDate ? ` · ${session.startDate.slice(0, 10)} → ${session.endDate?.slice(0, 10) ?? ""}` : ""}`}
          action={
            <Link
              className="text-caption font-semibold text-primary hover:underline"
              href={`${basePath}/sessions`}
            >
              ← Danh sách phiên
            </Link>
          }
        />
      )}
      {basePath === "/instructor" && (
        <InstructorSectionNav
          items={[
            {
              id: "session-work",
              label: "Công việc",
              count: session.overview.taskTotal,
            },
            {
              id: "session-sprints",
              label: "Sprint",
              count: session.overview.sprintCount,
            },
            {
              id: "session-team",
              label: "Đội hình",
              count: session.members.length,
            },
            ...(session.projectSnapshot
              ? [{ id: "session-project", label: "Dự án" }]
              : []),
            ...(projectId
              ? [{ id: "session-plan", label: "Kế hoạch AI" }]
              : []),
            { id: "session-activity", label: "Hoạt động" },
          ]}
        />
      )}

      <dl className="ins-session-stat-strip">
        <div>
          <dt>Sprint</dt>
          <dd>
            {session.overview.sprintCount}
          </dd>
          <p className="text-caption text-muted-foreground">
            {session.sprintProgress.filter((s) => s.status === "active").length}{" "}
            đang chạy
          </p>
        </div>
        <div>
          <dt>Task</dt>
          <dd>{totalTasks}</dd>
          <p className="text-caption text-muted-foreground">
            {progress.done} hoàn thành ({progress.percent}%)
          </p>
        </div>
        <div>
          <dt>Còn lại</dt>
          <dd>
            {totalTasks - progress.done}
          </dd>
          <p className="text-caption text-muted-foreground">
            {session.sprintProgress.reduce((sum, s) => sum + s.taskReview, 0)}{" "}
            chờ duyệt
          </p>
        </div>
        <div>
          <dt>Kế hoạch AI</dt>
          <dd className="ins-stat-text">
            {plans.loading
              ? "..."
              : plans.error
                ? "không tải được"
                : basePath === "/instructor"
                  ? instructorPlanStatus(plans.data?.[0]?.status ?? "chưa có")
                  : (plans.data?.[0]?.status ?? "chưa có")}
          </dd>
          <p className="text-caption text-muted-foreground">
            {plans.data?.length ?? 0} bản kế hoạch
          </p>
        </div>
      </dl>

      {projectId && (
        <nav
          aria-label="Quản lý phiên"
          className="flex flex-wrap gap-4 text-body font-semibold text-primary"
        >
          {basePath === "/instructor" && (
            <Link
              href={`/instructor/sessions/${sessionId}/setup?project=${projectId}`}
            >
              Đội hình & thiết lập
            </Link>
          )}
          <Link
            href={`${basePath}/sprints?sessionId=${sessionId}&projectId=${projectId}`}
          >
            Sprint & Task
          </Link>
          <Link
            href={`${basePath}/performance?sessionId=${sessionId}&projectId=${projectId}`}
          >
            Hiệu suất
          </Link>
          <Link
            href={`${basePath}/reports?sessionId=${sessionId}&projectId=${projectId}`}
          >
            Báo cáo
          </Link>
        </nav>
      )}
      {delivery.error ? (
        <ErrorState error={delivery.error} onRetry={delivery.reload} />
      ) : null}
      {delivery.loading && <p role="status">Đang tải Sprint/Task...</p>}

      <div id="session-work" className="ins-section">
        <Panel title={`Task (${totalTasks})`}>
          <div className="ins-task-filters mb-4 grid gap-3 md:grid-cols-3">
            <select
              className={inputClass}
              aria-label="Trạng thái task trong phiên"
              value={filters.status}
              onChange={(e) => filter("status", e.target.value)}
            >
              <option value="">Mọi trạng thái task</option>
              {taskStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              aria-label="Ưu tiên task trong phiên"
              value={filters.priority}
              onChange={(e) => filter("priority", e.target.value)}
            >
              <option value="">Mọi mức ưu tiên</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {priorityLabels[p]}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              aria-label="Người nhận task trong phiên"
              value={filters.assigneeId}
              onChange={(e) => filter("assigneeId", e.target.value)}
            >
              <option value="">Mọi thành viên</option>
              {session.members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
            {filters.sprintId && (
              <button
                className="text-caption font-semibold text-primary"
                onClick={() => filter("sprintId", "")}
              >
                Bỏ lọc Sprint
              </button>
            )}
          </div>
          {delivery.loading ? (
            <p role="status">Đang tải danh sách nhiệm vụ...</p>
          ) : delivery.error ? null : tasks.length === 0 ? (
            <Empty>
              {Object.values(filters).some(Boolean) ? (
                <>
                  <p>Không có nhiệm vụ khớp bộ lọc trong phiên này.</p>
                  <button
                    type="button"
                    className="mt-3 font-semibold text-primary"
                    onClick={() => {
                      setFilters({
                        status: "",
                        priority: "",
                        assigneeId: "",
                        sprintId: "",
                      });
                      setTaskPage(1);
                    }}
                  >
                    Xem tất cả nhiệm vụ
                  </button>
                </>
              ) : (
                "Chưa có task."
              )}
            </Empty>
          ) : (
            <ul
              aria-label="Task và bài nộp trong phiên"
              className="ins-task-list"
            >
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="ins-task-row break-words"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link
                      className="min-w-0 text-body font-semibold text-primary hover:underline"
                      href={`${basePath}/tasks/${t.id}`}
                    >
                      {t.title}
                    </Link>
                    <Badge>{statusLabels[t.status]}</Badge>
                  </div>
                  <p className="mt-1 break-all font-mono text-caption text-muted-foreground">
                    {t.code}
                  </p>
                  <p className="mt-2 text-caption text-muted-foreground">
                    {t.sprint?.name ?? "Chưa gắn Sprint"} · {t.progress}% ·{" "}
                    {priorityLabels[t.priority]}
                  </p>
                  <p className="mt-1 text-caption text-muted-foreground">
                    {t.assigneeId
                      ? (session.members.find(
                          (m) =>
                            m.userId.toLowerCase() ===
                            t.assigneeId?.toLowerCase(),
                        )?.displayName ?? "Đã phân công")
                      : "Chưa phân công"}{" "}
                    · Hạn{" "}
                    {basePath === "/instructor"
                      ? instructorDate(t.dueDate)
                      : (t.dueDate?.slice(0, 10) ?? "Chưa có hạn")}
                  </p>
                  <SessionTaskDelivery data={t.delivery} />
                </li>
              ))}
            </ul>
          )}
          {delivery.data && (
            <Pager {...delivery.data.tasksPage} onChange={setTaskPage} />
          )}
        </Panel>
      </div>
      <div id="session-sprints" className="ins-section">
        <Panel title="Sprint">
          {delivery.loading ? (
            <p role="status">Đang tải danh sách Sprint...</p>
          ) : delivery.error ? null : sprints.length === 0 ? (
            <Empty>
              Chưa có Sprint. Xác nhận kế hoạch AI để tạo Sprint và nhiệm vụ.
            </Empty>
          ) : (
            <ul className="ins-sprint-list">
              {sprints.map((s) => {
                const p = session.sprintProgress.find(
                  (p) => p.id.toLowerCase() === s.id.toLowerCase(),
                );
                return (
                  <li
                    key={s.id}
                    className="ins-sprint-row"
                  >
                    <div>
                      <Link
                        className="text-body font-semibold text-primary hover:underline"
                        href={`${basePath}/sprints/${s.id}`}
                      >
                        {s.name}
                      </Link>
                      <p className="text-caption text-muted-foreground">
                        {s.code} · {s.goal ?? "—"}
                      </p>
                    </div>
                    <button
                      className="text-caption font-semibold text-primary hover:underline"
                      onClick={() => filter("sprintId", s.id)}
                    >
                      Lọc task Sprint này
                    </button>
                    <div className="flex items-center gap-2 text-caption text-muted-foreground">
                      <span>
                        {basePath === "/instructor"
                          ? instructorDate(s.startDate)
                          : s.startDate?.slice(0, 10)}{" "}
                        →{" "}
                        {basePath === "/instructor"
                          ? instructorDate(s.endDate)
                          : s.endDate?.slice(0, 10)}
                      </span>
                      <Badge>
                        {basePath === "/instructor"
                          ? sprintStatusLabel(s.status).label
                          : s.status}
                      </Badge>
                      <span>
                        {p?.taskDone ?? 0}/{p?.taskTotal ?? 0}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {delivery.data && (
            <Pager {...delivery.data.sprintsPage} onChange={setSprintPage} />
          )}
        </Panel>
      </div>

      <div id="session-repository" className="ins-section">
        <SessionRepositoryCard
          sessionId={sessionId}
          manage={
            session.leadInstructorId?.toLowerCase() ===
            getSessionUser()?.id.toLowerCase()
          }
        />
      </div>
      <div id="session-team" className="ins-section">
        <Panel title={`Thành viên (${session.members.length})`}>
          {session.members.length ? (
            <ul className="workspace-session-roster text-body">
              {session.members.map((m) => (
                <li className="break-words" key={m.userId}>
                  {m.displayName} · {m.email}
                  <p className="mt-1 text-caption text-muted-foreground">
                    {m.role ? roleLabel(m.role) : "Chưa có vai trò dự án"}
                    {m.assignmentStatus === "completed"
                      ? " · Đã hoàn tất phân công"
                      : m.assignmentStatus === "active"
                        ? " · Đang tham gia"
                        : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Chưa có thành viên.</Empty>
          )}
        </Panel>
      </div>
      {session.projectSnapshot && (
        <div id="session-project" className="ins-section">
          <details className="ins-reference">
            <summary>Yêu cầu dự án và tiêu chí bàn giao</summary>
          <Panel
            title={`Dự án · ${session.overview.project?.name ?? "Snapshot"}`}
          >
            <p className="mb-3 text-body">
              {typeof session.projectSnapshot.description === "string"
                ? session.projectSnapshot.description
                : ""}
            </p>
            {(
              [
                "techStack",
                "objectives",
                "functionalRequirements",
                "expectedOutputs",
                "dod",
              ] as const
            ).map((key) => {
              const values = snapshotItems(session.projectSnapshot?.[key]);
              const label = {
                techStack: "Công nghệ",
                objectives: "Mục tiêu",
                functionalRequirements: "Yêu cầu",
                expectedOutputs: "Sản phẩm bàn giao",
                dod: "Tiêu chí hoàn thành",
              }[key];
              return values.length ? (
                <div key={key} className="mb-3 text-body">
                  <h3 className="font-semibold">{label}</h3>
                  <ul className="list-inside list-disc">
                    {values.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })}
          </Panel>
          </details>
        </div>
      )}
      <Panel title="Mốc thời gian">
        {session.milestones.length ? (
          <ul className="space-y-2 text-body">
            {session.milestones.map((m) => (
              <li key={m.id}>
                {m.title} ·{" "}
                {basePath === "/instructor"
                  ? instructorDate(m.dueDate)
                  : (m.dueDate?.slice(0, 10) ?? "Chưa có hạn")}{" "}
                ·{" "}
                {basePath === "/instructor"
                  ? ((
                      {
                        pending: "Chưa hoàn thành",
                        completed: "Đã hoàn thành",
                        missed: "Trễ hạn",
                        cancelled: "Đã hủy",
                      } as Record<string, string>
                    )[m.status] ?? m.status)
                  : m.status}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Chưa có mốc thời gian.</Empty>
        )}
      </Panel>
      {projectId && basePath === "/instructor" && (
        <div id="session-plan" className="ins-section">
          <details className="ins-reference">
            <summary>Kế hoạch AI của phiên</summary>
          <Can perm="sprints.manage">
            <AiPlanPanel
              autoPlanning={session.status === "active"}
              sessionId={sessionId}
              projectId={projectId}
              onPublished={() => {
                data.reload();
                delivery.reload();
                plans.reload();
              }}
            />
          </Can>
          </details>
        </div>
      )}
      <div id="session-activity" className="ins-section">
          <details className="ins-reference">
            <summary>Lịch sử hoạt động của phiên</summary>
        <Can perm={["sessions.view", "tasks.view"]}>
          <SessionTimeline key={sessionId} sessionId={sessionId} />
        </Can>
          </details>
      </div>
      <Can perm="performance.view">
        <Panel title="Hiệu suất sinh viên trong phiên">
          <button
            className="text-body font-semibold text-primary"
            aria-expanded={showPerformance}
            onClick={() => setShowPerformance((v) => !v)}
          >
            {showPerformance ? "Thu gọn hiệu suất" : "Xem hiệu suất sinh viên"}
          </button>
          {showPerformance && (
            <div className="mt-4">
              <MemberPerformance
                key={sessionId}
                initialProjectId={projectId}
                initialSessionId={sessionId}
                basePath={basePath}
                lockedScope
                embedded
              />
            </div>
          )}
        </Panel>
      </Can>
      {projectId && (
        <Can perm="performance.view">
          <Panel title="Báo cáo của phiên">
            <button
              className="text-body font-semibold text-primary"
              aria-expanded={showReports}
              onClick={() => setShowReports((v) => !v)}
            >
              {showReports ? "Thu gọn báo cáo" : "Mở báo cáo trong phiên"}
            </button>
            {showReports && (
              <div className="mt-4">
                <ReportsWorkspace
                  key={sessionId}
                  initialProjectId={projectId}
                  initialSessionId={sessionId}
                  lockedScope
                  embedded
                />
              </div>
            )}
          </Panel>
        </Can>
      )}
    </div>
  );
}
