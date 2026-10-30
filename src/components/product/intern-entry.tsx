"use client";
import {
  StudentBadge,
  StudentHeading,
  StudentPanel,
  StudentProgress,
  StudentLink,
  studentPriority,
  studentToneForPriority,
} from "@/components/intern/student-ui";
import {
  Bell,
  CalendarDays,
  Clock3,
  Compass,
  FolderKanban,
  GitBranch,
  Info,
  ListChecks,
  SquareKanban,
} from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  InternWorkspaceContext,
  useInternWorkspaceContext,
} from "@/components/intern/intern-workspace-context";
import {
  getWorkspace,
  lifecyclePath,
  type InternWorkspace,
} from "@/lib/api/workspace";
import { useResource } from "@/lib/api/use-resource";
import {
  getBoard,
  getProject,
  getOwnSprintBoard,
  getOwnSprints,
  getOwnProject,
  statusLabels,
} from "@/lib/api/work";
import { sprintStatusLabel } from "@/lib/api/sprint-status";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { InternShell } from "@/components/intern/intern-shell";
import { Badge, Empty, Field, InlineAlert, Pager, Panel, selectClass, StatusDot } from "./primitives";
import { DropColumn, canOwnDrop, draggableTask } from "./kanban-dnd";
import { useOwnTaskDrop } from "./use-own-task-drop";
import { useRouter } from "next/navigation";
import { TaskDeadline } from "@/components/workspace/task-deadline";

const INTERN_ROLES = ["intern"] as const;

export function InternEntry({
  children,
  requireAssignment = false,
}: {
  children: ReactNode | ((workspace: InternWorkspace) => ReactNode);
  requireAssignment?: boolean;
}) {
  const embedded = useInternWorkspaceContext();
  // The persistent `/intern` layout already owns the guard and shell. A page
  // rendered inside it must only render its content; remounting the shell on
  // every navigation causes the sidebar/topbar to flash and loses scroll state.
  if (embedded) {
    return typeof children === "function"
      ? children(embedded.workspace)
      : children;
  }
  return (
    <WorkspaceGuard allowedRoles={INTERN_ROLES}>
      <InternGate requireAssignment={requireAssignment}>{children}</InternGate>
    </WorkspaceGuard>
  );
}
function InternGate({
  children,
  requireAssignment,
}: {
  children: ReactNode | ((workspace: InternWorkspace) => ReactNode);
  requireAssignment: boolean;
}) {
  const pathname = usePathname();
  const historyRoute = [
    "evaluations",
    "performance",
    "recommendations",
    "kpi",
    "virtual-salary",
    "certificates",
  ].some(
    (route) =>
      pathname === `/intern/${route}` ||
      pathname.startsWith(`/intern/${route}/`),
  );
  const workspace = useResource(
    useCallback((signal: AbortSignal) => getWorkspace(signal), []),
    pathname,
  );
  // Revalidate on navigation without tearing down the persistent shell or a
  // student's draft while the same workspace payload is being refreshed.
  if (workspace.loading && !workspace.data) return <LoadingState />;
  if (workspace.error)
    return <ErrorState error={workspace.error} onRetry={workspace.reload} />;
  if (!workspace.data) return null;
  const data = workspace.data,
    target = lifecyclePath(data);
  const outcomesAvailable =
    data.status === "active" || Boolean(data.hasAssignmentHistory);
  const assignmentRequired =
    requireAssignment ||
    (!(historyRoute && outcomesAvailable) &&
      ![
        "/intern",
        "/intern/notifications",
        "/intern/profile",
        "/intern/github",
        "/intern/participation",
      ].includes(pathname));
  const renderContent = () =>
    typeof children === "function" ? children(data) : children;
  const isHome = pathname === "/intern";
  return (
    <InternWorkspaceContext.Provider
      value={{ workspace: data, reload: workspace.reload, refreshing: workspace.loading }}
    >
      <InternShell
        active={data.status === "active"}
        outcomesAvailable={outcomesAvailable}
      >
        {isHome ? (
          renderContent()
        ) : target !== "/intern" ? (
          <>
            <StudentHeading              title="Hoàn tất tuyển dụng"
              description="Bạn cần hoàn thành bước tuyển dụng trước khi mở khóa không gian thực tập."
            />
            <div className="student-dashboard-grid">
              <div className="student-panel student-chat-welcome">
                <Compass
                  size={42}
                  className="text-primary"
                  aria-hidden="true"
                />
                <h2>Bước tuyển dụng đang chờ bạn</h2>
                <p>
                  Hoàn thành phỏng vấn để giảng viên xem xét phân công dự án.
                  Kết quả và phản hồi sẽ được lưu lại trong hành trình của bạn.
                </p>
                <div className="student-empty-actions">
                  <StudentLink href={target}>Tiếp tục tuyển dụng</StudentLink>
                  <StudentLink secondary href="/intern">
                    Về trang tổng quan
                  </StudentLink>
                </div>
              </div>
              <StudentPanel title="Bạn sẽ trải qua" icon={ListChecks}>
                <ol className="student-step-list">
                  <li>
                    <div>
                      <strong>Chọn vai trò</strong>
                      <p>Xác nhận vị trí phù hợp với định hướng của bạn.</p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Phỏng vấn cùng AI Recruiter</strong>
                      <p>
                        Trả lời từng câu hỏi, có thể lưu nháp và quay lại sau.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Nhận kết quả</strong>
                      <p>
                        Xem điểm, nhận xét và bước tiếp theo trong hành trình.
                      </p>
                    </div>
                  </li>
                </ol>
              </StudentPanel>
            </div>
          </>
        ) : assignmentRequired && data.status !== "active" ? (
          <>
            <StudentHeading              title="Đang chờ phân công"
              description="Bạn đã vượt qua vòng tuyển dụng. Giảng viên sẽ phân công dự án và Sprint tiếp theo cho bạn."
              action={
                <StudentLink secondary href="/intern/notifications">
                  <Bell size={15} aria-hidden="true" />
                  Xem thông báo
                </StudentLink>
              }
            />
            <div className="student-dashboard-grid">
              <div className="student-panel student-chat-welcome">
                <Clock3
                  size={42}
                  className="text-primary"
                  aria-hidden="true"
                />
                <h2>Bạn chưa có dự án, Sprint hoặc nhiệm vụ được giao.</h2>
                <p>
                  Khi giảng viên phân công, trang này sẽ mở khóa công việc,
                  Sprint Board và AI Mentor. Bạn sẽ nhận thông báo ngay khi có
                  dự án mới.
                </p>
                <div className="student-empty-actions">
                  <StudentLink href="/intern">Về Tổng quan</StudentLink>
                  <StudentLink secondary href="/intern/profile">
                    Cập nhật hồ sơ
                  </StudentLink>
                </div>
              </div>
              <StudentPanel title="Trong lúc chờ" icon={ListChecks}>
                <ol className="student-step-list">
                  <li>
                    <div>
                      <strong>Theo dõi thông báo</strong>
                      <p>
                        Cập nhật phân công dự án và phản hồi từ giảng viên tại
                        trang Thông báo.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Hoàn thiện hồ sơ</strong>
                      <p>
                        Bổ sung thông tin cá nhân và liên kết GitHub để sẵn sàng
                        nhận nhiệm vụ.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Xem lại kết quả tuyển dụng</strong>
                      <p>
                        Đọc nhận xét và điểm mạnh để chuẩn bị cho dự án sắp tới.
                      </p>
                    </div>
                  </li>
                </ol>
              </StudentPanel>
            </div>
          </>
        ) : (
          renderContent()
        )}
      </InternShell>
    </InternWorkspaceContext.Provider>
  );
}
export function InternSprint({ workspace }: { workspace: InternWorkspace }) {
  const [page, setPage] = useState(1), [selected, setSelected] = useState('');
  const sprints = useResource(useCallback((signal: AbortSignal) => getOwnSprints(page, signal), [page]));
  const rows = sprints.data?.items ?? [];
  const initial = page === 1 ? rows.find(s => s.id.toLowerCase() === workspace.currentSprint?.id.toLowerCase()) : undefined;
  const sprint = rows.find(s => s.id === selected) ?? initial ?? rows[0];
  const id = sprint?.id;
  return (
    <>
      <StudentHeading        title="Sprint Board"
        description={
          "Xem Sprint đã lên kế hoạch, đang chạy và lịch sử trong phiên được phân công."
        }
        action={
          <StudentLink secondary href="/intern/work">
            Công việc của tôi
          </StudentLink>
        }
      />
      {sprints.loading && <LoadingState />}
      {Boolean(sprints.error) && <ErrorState error={sprints.error} onRetry={sprints.reload} />}
      {sprints.data && rows.length > 0 && <div className="my-5 max-w-2xl"><Field htmlFor="student-sprint" label="Sprint đang xem"><select id="student-sprint" className={selectClass} value={id ?? ''} onChange={event => setSelected(event.target.value)}>{rows.map(row => <option key={row.id} value={row.id}>{row.code} · {row.name} · {sprintStatusLabel(row.status).label}</option>)}</select></Field>{sprints.data.total > 50 && <Pager page={page} total={sprints.data.total} totalPages={sprints.data.totalPages} unit="Sprint" onChange={value => {setSelected('');setPage(value);}} />}</div>}
      {sprint?.status === 'planned' && <InlineAlert tone="info">Sprint đã được lên kế hoạch. Bạn có thể xem nhiệm vụ và chuẩn bị ngay; giảng viên quyết định thời điểm kích hoạt Sprint.</InlineAlert>}
      {id && <SprintBoard key={id} id={id} own />}
      {sprints.data && !rows.length && (
        <div className="student-dashboard-grid student-sprint-empty-grid">
          <StudentPanel
            title="Sprint Board"
            icon={SquareKanban}
            className="student-sprint-empty"
          >
            <div className="student-chat-welcome">
              <span className="student-metric-icon size-14">
                <SquareKanban size={26} aria-hidden="true" />
              </span>
              <h2>Chưa có Sprint trong phiên</h2>
              <p>
                Giảng viên chưa tạo Sprint cho phiên được phân công. Sprint sẽ
                hiển thị ở đây ngay khi có kế hoạch, cùng tiến độ và thời hạn
                của những nhiệm vụ được giao cho bạn.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <StudentLink href="/intern/work">Xem nhiệm vụ</StudentLink>
                <StudentLink secondary href="/intern/project">
                  Dự án của tôi
                </StudentLink>
              </div>
            </div>
          </StudentPanel>
          <div className="student-stack">
            <StudentPanel
              title="Chuẩn bị trước khi Sprint bắt đầu"
              icon={CalendarDays}
            >
              <ol className="student-step-list">
                <li>
                  <div>
                    <strong>Đọc yêu cầu dự án</strong>
                    <p>
                      Nắm mục tiêu, công nghệ và phạm vi để sẵn sàng nhận việc.
                    </p>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Kiểm tra GitHub</strong>
                    <p>
                      Xác nhận tài khoản đã liên kết và có quyền vào repository
                      của phiên.
                    </p>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Hỏi Mentor nếu cần</strong>
                    <p>
                      Chuẩn bị câu hỏi về công cụ hoặc quy trình trước khi bắt
                      tay.
                    </p>
                  </div>
                </li>
              </ol>
            </StudentPanel>
            <StudentPanel title="Bạn vẫn có thể làm việc" icon={Info}>
              <p className="text-small leading-7 text-muted-foreground">
                Nhiệm vụ đã được giao vẫn hiển thị trong Công việc của tôi. Bạn
                có thể đọc yêu cầu, cập nhật tiến độ và trao đổi với giảng viên
                ngay cả khi Sprint chưa kích hoạt.
              </p>
              <div className="mt-4">
                <StudentLink secondary href="/intern/mentor">
                  Mở AI Mentor
                </StudentLink>
              </div>
            </StudentPanel>
          </div>
        </div>
      )}
    </>
  );
}
export function SprintBoard({
  id,
  own = false,
}: {
  id: string;
  own?: boolean;
}) {
  const router = useRouter();
  const workspace = useInternWorkspaceContext();
  const board = useResource(
    useCallback(
      (signal: AbortSignal) =>
        own ? getOwnSprintBoard(id, signal) : getBoard(id, signal),
      [id, own],
    ),
  );
  const drop = useOwnTaskDrop(
    () => {
      board.reload();
      if (own) workspace?.reload();
    },
    (taskId, intent) =>
      router.push(
        `/intern/work/${encodeURIComponent(taskId)}${
          intent === "submit" ? "?submit=1" : ""
        }`,
      ),
  );
  if (board.loading) return <LoadingState />;
  if (board.error)
    return <ErrorState error={board.error} onRetry={board.reload} />;
  if (!board.data) return null;
  const data = board.data,
    done = data.columns.find((c) => c.status === "done")?.count ?? 0;
  const percent = data.total ? Math.round((done / data.total) * 100) : 0;
  const start = new Date(data.sprint.startDate).toLocaleDateString("vi-VN");
  const end = new Date(data.sprint.endDate).toLocaleDateString("vi-VN");
  return (
    <div className="space-y-4">
      {own && (
        <div className="student-notice">
          <Info size={16} className="shrink-0" aria-hidden="true" />
          <p>
            Kéo thả thẻ để bắt đầu công việc. Thả sang{" "}
            <strong>Chờ duyệt</strong> để mở chi tiết và nộp bài; giảng viên
            duyệt <strong>Hoàn thành</strong>. Bấm thẻ để cập nhật bằng bàn phím
            hoặc trên điện thoại.
          </p>
        </div>
      )}
      {drop.error && <InlineAlert tone="danger">{drop.error}</InlineAlert>}
      {drop.busy && (
        <p role="status" className="text-body text-muted-foreground">
          Đang cập nhật nhiệm vụ…
        </p>
      )}

      {own ? (
        <StudentPanel
          title={
            <>
              <span className="student-code-inline">{data.sprint.code}</span>{" "}
              <span aria-hidden="true">·</span> {data.sprint.name}
            </>
          }
          className="student-sprint-summary"
          icon={SquareKanban}
          action={
            <StudentBadge
              tone={
                sprintStatusLabel(data.sprint.status).tone === "green"
                  ? "green"
                  : "blue"
              }
            >
              {sprintStatusLabel(data.sprint.status).label}
            </StudentBadge>
          }
        >
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p className="student-label">Tiến độ Sprint</p>
              <StudentProgress
                value={percent}
                label={`${done}/${data.total} nhiệm vụ hoàn thành`}
                tone={percent >= 70 ? "green" : "blue"}
              />
            </div>
            <div>
              <p className="student-label">Thời gian</p>
              <p className="student-chip mt-1">
                <CalendarDays size={13} aria-hidden="true" />
                {start} đến {end}
              </p>
            </div>
            <div>
              <p className="student-label">Tổng nhiệm vụ</p>
              <p className="mt-1 text-section font-extrabold tracking-tight text-foreground">
                {data.total}
                <span className="ml-2 text-caption font-medium text-muted-foreground">
                  nhiệm vụ
                </span>
              </p>
            </div>
          </div>
        </StudentPanel>
      ) : (
        <Panel title={data.sprint.name}>
          <div className="flex flex-wrap items-center gap-4 text-body">
            <StatusDot tone={sprintStatusLabel(data.sprint.status).tone}>
              {sprintStatusLabel(data.sprint.status).label}
            </StatusDot>
            <span>
              {done}/{data.total} nhiệm vụ hoàn thành
            </span>
            <span>
              {start} đến {end}
            </span>
          </div>
          <progress
            aria-label="Tiến độ Sprint"
            value={done}
            max={data.total || 1}
            className="mt-3 h-2 w-full accent-primary"
          />
        </Panel>
      )}

      <div
        className={
          own
            ? "student-board"
            : "grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4"
        }
      >
        {data.columns.map((column) => (
          <DropColumn
            key={column.status}
            status={column.status}
            canDrop={(from) =>
              own && !drop.busy && canOwnDrop(from, column.status)
            }
            onDrop={drop.move}
            className={
              own
                ? `student-board-column student-column-${column.status}`
                : "min-h-48"
            }
          >
            {own ? (
              <section aria-label={statusLabels[column.status]}>
                <header className="student-board-head">
                  <h2>
                    {statusLabels[column.status]}
                    <span className="student-board-count">{column.count}</span>
                  </h2>
                  <p>{{ todo: "Đọc yêu cầu và chuẩn bị", doing: "Tập trung từng nhiệm vụ", review: "Đã nộp, chờ phản hồi", done: "Được giảng viên xác nhận" }[column.status]}</p>
                </header>
                {column.tasks.length ? (
                  <div className="space-y-3">
                    {column.tasks.map((t) => (
                      <article
                        key={t.id}
                        {...(!drop.busy &&
                        (t.status === "todo" || t.status === "doing")
                          ? draggableTask(t.id, t.status)
                          : {})}
                        className="student-board-card"
                      >
                        <div className="student-board-card-head">
                          <span className="student-work-code">{t.code}</span>
                          <StudentBadge
                            tone={studentToneForPriority(t.priority)}
                          >
                            {studentPriority(t.priority)}
                          </StudentBadge>
                        </div>
                        <h3>
                          <Link
                            href={`/intern/work/${encodeURIComponent(t.id)}`}
                            draggable={false}
                            className="hover:text-primary"
                          >
                            {t.title}
                          </Link>
                        </h3>
                        <StudentProgress
                          value={t.progress}
                          label="Tiến độ"
                          tone={t.progress >= 100 ? "green" : "blue"}
                        />
                        <div className="student-board-card-foot"><TaskDeadline value={t.dueDate} status={t.status} compact /></div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="student-board-empty">
                    {
                      {
                        todo: "Chưa có nhiệm vụ cần bắt đầu.",
                        doing: "Kéo thẻ Cần làm vào đây để bắt đầu.",
                        review: "Bài đã nộp sẽ chờ phản hồi tại đây.",
                        done: "Nhiệm vụ được giảng viên duyệt sẽ xuất hiện tại đây.",
                      }[column.status]
                    }
                  </p>
                )}
              </section>
            ) : (
              <Panel title={`${statusLabels[column.status]} · ${column.count}`}>
                {column.tasks.length ? (
                  <div className="space-y-3">
                    {column.tasks.map((t) => (
                      <article
                        key={t.id}
                        className="rounded-control border border-border bg-background p-3"
                      >
                        <p className="text-caption font-semibold text-primary">
                          {t.code}
                        </p>
                        <p className="my-2 text-body font-semibold text-foreground">
                          {t.title}
                        </p>
                        <Badge>{t.priority}</Badge>
                        <p className="mt-2 text-caption text-muted-foreground">
                          {t.progress}% ·{" "}
                          {t.dueDate
                            ? new Date(t.dueDate).toLocaleDateString("vi-VN")
                            : "Chưa có hạn"}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty>Không có nhiệm vụ.</Empty>
                )}
              </Panel>
            )}
          </DropColumn>
        ))}
      </div>
    </div>
  );
}

export function InternProject({ workspace }: { workspace: InternWorkspace }) {
  const assignment = workspace.assignment;
  return (
    <>
      <StudentHeading        title="Dự án của tôi"
        description="Hiểu mục tiêu, công nghệ và thời gian thực hiện trước khi bắt đầu từng nhiệm vụ."
        action={<StudentLink href="/intern/work">Xem nhiệm vụ</StudentLink>}
      />
      {assignment ? (
        <>
          <div className="student-project-assignment"><CalendarDays size={17} aria-hidden="true" /><div><span>Phiên thực tập</span><strong>{assignment.session.name}</strong></div><p>{assignment.session.code}<small>Phân công {new Date(assignment.assignedAt).toLocaleDateString("vi-VN")}</small></p></div>
          <div className="mt-5">
            <ProjectDetail id={assignment.project.id} own />
          </div>
        </>
      ) : (
        <Empty>Chưa được phân công.</Empty>
      )}
    </>
  );
}
export function ProjectDetail({
  id,
  own = false,
}: {
  id: string;
  own?: boolean;
}) {
  const project = useResource(
    useCallback(
      (signal: AbortSignal) =>
        own ? getOwnProject(signal) : getProject(id, signal),
      [id, own],
    ),
  );
  if (project.loading) return <LoadingState />;
  if (project.error)
    return <ErrorState error={project.error} onRetry={project.reload} />;
  if (!project.data) return null;
  const p = project.data;
  if (own)
    return (
      <div className="student-dashboard-grid student-project-layout">
        <div className="space-y-5">
          <StudentPanel title={p.name} icon={FolderKanban} className="student-project-brief">
            <span className="rounded-control bg-accent px-2 py-1 text-caption font-bold text-primary">
              {p.code}
            </span>
            <h3 className="mb-3 mt-6 text-body font-bold">Mục tiêu & phạm vi</h3>
            <p className="whitespace-pre-wrap text-body leading-8 text-muted-foreground">
              {p.description || "Giảng viên chưa bổ sung mô tả dự án."}
            </p>
            <h3 className="mb-3 mt-6 flex items-center gap-2 text-body font-semibold"><GitBranch size={16} aria-hidden="true" />Bộ công nghệ</h3>
            <div className="student-project-technologies">
              {p.technologies.length ? p.technologies.join(" · ") : (
                <p className="text-body text-muted-foreground">
                  Chưa có công nghệ khai báo.
                </p>
              )}
            </div>
          </StudentPanel>
        </div>
        <div className="space-y-5">
          <StudentPanel title="Thông tin dự án">
            <dl className="space-y-4 text-body">
              {[
                [
                  "Trạng thái",
                  (
                    {
                      draft: "Bản nháp",
                      active: "Đang thực hiện",
                      completed: "Đã hoàn thành",
                      archived: "Đã lưu trữ",
                    } as Record<string, string>
                  )[p.status] ?? p.status,
                ],
                [
                  "Độ khó",
                  (
                    {
                      beginner: "Cơ bản",
                      intermediate: "Trung cấp",
                      advanced: "Nâng cao",
                      easy: "Cơ bản",
                      medium: "Trung bình",
                      hard: "Nâng cao",
                    } as Record<string, string>
                  )[p.difficulty] ?? p.difficulty,
                ],
                ["Quy mô", p.capacity ?? "Chưa đặt"],
                [
                  "Bắt đầu",
                  p.startDate
                    ? new Date(p.startDate).toLocaleDateString("vi-VN")
                    : "Chưa đặt",
                ],
                [
                  "Kết thúc",
                  p.endDate
                    ? new Date(p.endDate).toLocaleDateString("vi-VN")
                    : "Chưa đặt",
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex justify-between gap-4 border-b border-border pb-3"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {p.mentorId && (
              <details className="mt-4 text-caption text-muted-foreground">
                <summary className="cursor-pointer">
                  Thông tin người phụ trách
                </summary>
                <p className="mt-2 break-all">
                  Mã người phụ trách: {p.mentorId}
                </p>
              </details>
            )}
          </StudentPanel>
          <details className="student-help-disclosure">
            <summary>Chuẩn bị cho công việc</summary>
            <ol className="student-step-list">
              <li>
                <div>
                  <strong>Đọc mục tiêu dự án</strong>
                  <p>Hiểu sản phẩm cần làm và những công nghệ sẽ sử dụng.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Kiểm tra repository</strong>
                  <p>Liên kết GitHub và xác nhận quyền truy cập.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Xem Sprint hiện tại</strong>
                  <p>Ưu tiên nhiệm vụ được giao và các điều kiện phụ thuộc.</p>
                </div>
              </li>
            </ol>
            <div className="mt-5">
              <StudentLink secondary href="/intern/github">
                Kiểm tra GitHub
              </StudentLink>
            </div>
          </details>
        </div>
      </div>
    );
  return (
    <Panel title={p.name}>
      <Badge>{p.code}</Badge>
      <p className="mt-3 whitespace-pre-wrap text-body">{p.description}</p>
      <dl className="mt-5 grid gap-4 text-body sm:grid-cols-2">
        {[
          ["Trạng thái", p.status],
          ["Độ khó", p.difficulty],
          ["Mentor", p.mentorId ?? "Chưa phân công"],
          ["Quy mô", p.capacity ?? "Chưa đặt"],
          [
            "Bắt đầu",
            p.startDate
              ? new Date(p.startDate).toLocaleDateString("vi-VN")
              : "Chưa có",
          ],
          [
            "Kết thúc",
            p.endDate
              ? new Date(p.endDate).toLocaleDateString("vi-VN")
              : "Chưa có",
          ],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-5 font-semibold">Công nghệ</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {p.technologies.length ? (
          p.technologies.map((t) => <Badge key={t}>{t}</Badge>)
        ) : (
          <p className="text-body text-muted-foreground">Chưa có công nghệ khai báo.</p>
        )}
      </div>
    </Panel>
  );
}
