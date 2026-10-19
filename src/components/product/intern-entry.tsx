"use client";
import { useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getWorkspace,
  lifecyclePath,
  type InternWorkspace,
} from "@/lib/api/workspace";
import { useResource } from "@/lib/api/use-resource";
import {
  getBoard,
  getProject,
  getOwnBoard,
  getOwnProject,
  statusLabels,
} from "@/lib/api/work";
import { sprintStatusLabel } from "@/lib/api/sprint-status";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { InternShell } from "@/components/intern/intern-shell";
import { Badge, Empty, InlineAlert, PageTitle, Panel, StatusDot } from "./primitives";
import { DropColumn, canOwnDrop, draggableTask } from "./kanban-dnd";
import { useOwnTaskDrop } from "./use-own-task-drop";
import { useRouter } from "next/navigation";
export function InternEntry({
  children,
  requireAssignment = false,
}: {
  children: ReactNode | ((workspace: InternWorkspace) => ReactNode);
  requireAssignment?: boolean;
}) {
  return (
    <WorkspaceGuard allowedRoles={["intern"]}>
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
  const historyRoute = ['evaluations', 'performance', 'kpi', 'virtual-salary', 'certificates'].some(route => pathname === `/intern/${route}` || pathname.startsWith(`/intern/${route}/`));
  const workspace = useResource(
    useCallback((signal: AbortSignal) => getWorkspace(signal), []),
  );
  if (workspace.loading) return <LoadingState />;
  if (workspace.error)
    return <ErrorState error={workspace.error} onRetry={workspace.reload} />;
  if (!workspace.data) return null;
  const data = workspace.data,
    target = lifecyclePath(data);
  const outcomesAvailable = data.status === 'active' || Boolean(data.hasAssignmentHistory);
  const assignmentRequired = requireAssignment || !(historyRoute && outcomesAvailable) && !["/intern", "/intern/notifications", "/intern/profile", "/intern/github"].includes(pathname);
  return (
    <InternShell active={data.status === "active"} outcomesAvailable={outcomesAvailable}>
      {target !== "/intern" ? (
        <Panel title="Tuyển dụng">
          <p className="text-sm">
            Hoàn thành bước tuyển dụng trước khi vào workspace.
          </p>
          <Link className="mt-3 block text-blue-600" href={target}>
            Tiếp tục tuyển dụng
          </Link>
        </Panel>
      ) : assignmentRequired && data.status !== "active" ? (
        <Panel title="Đang chờ phân công">
          <Empty>Bạn chưa có dự án, Sprint hoặc nhiệm vụ được giao.</Empty>
          <Link className="mt-3 block text-blue-600" href="/intern">
            Về Tổng quan
          </Link>
        </Panel>
      ) : typeof children === "function" ? (
        children(data)
      ) : (
        children
      )}
    </InternShell>
  );
}
export function InternSprint({ workspace }: { workspace: InternWorkspace }) {
  const id = workspace.currentSprint?.id;
  return (
    <>
      <PageTitle
        title="Sprint Board"
        subtitle={workspace.currentSprint?.name ?? "Chưa có Sprint hiện tại"}
      />
      {id ? (
        <SprintBoard id={id} own />
      ) : (
        <Empty>
          <p>Giảng viên chưa kích hoạt Sprint cho dự án này.</p>
          <p className="mt-2">Sprint Board sẽ hiển thị khi Sprint bắt đầu. Bạn vẫn có thể xem các nhiệm vụ đã được giao.</p>
          <Link className="mt-3 inline-block font-semibold text-blue-600" href="/intern/work">Công việc của tôi →</Link>
        </Empty>
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
  const board = useResource(
    useCallback(
      (signal: AbortSignal) =>
        own ? getOwnBoard(signal) : getBoard(id, signal),
      [id, own],
    ),
  );
  const drop = useOwnTaskDrop(board.reload, taskId => router.push(`/intern/work/${encodeURIComponent(taskId)}`));
  if (board.loading) return <LoadingState />;
  if (board.error)
    return <ErrorState error={board.error} onRetry={board.reload} />;
  if (!board.data) return null;
  const data = board.data,
    done = data.columns.find((c) => c.status === "done")?.count ?? 0;
  return (
    <div className="space-y-4">
      {own && <p className="text-sm text-slate-600">Kéo thả thẻ để bắt đầu công việc. Thả sang Chờ duyệt để mở chi tiết và nộp bài; giảng viên duyệt Hoàn thành. Bấm thẻ để cập nhật bằng bàn phím hoặc trên điện thoại.</p>}
      {drop.error && (
        <InlineAlert tone="danger">{drop.error}</InlineAlert>
      )}
      {drop.busy && <p role="status" className="text-sm text-slate-500">Đang cập nhật nhiệm vụ…</p>}
      <Panel title={data.sprint.name}>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <StatusDot tone={sprintStatusLabel(data.sprint.status).tone}>{sprintStatusLabel(data.sprint.status).label}</StatusDot>
          <span>
            {done}/{data.total} nhiệm vụ hoàn thành
          </span>
          <span>
            {new Date(data.sprint.startDate).toLocaleDateString("vi-VN")} –{" "}
            {new Date(data.sprint.endDate).toLocaleDateString("vi-VN")}
          </span>
        </div>
        <progress
          aria-label="Tiến độ Sprint"
          value={done}
          max={data.total || 1}
          className="mt-3 h-2 w-full accent-blue-600"
        />
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.columns.map((column) => (
          <DropColumn key={column.status} status={column.status} canDrop={from => own && !drop.busy && canOwnDrop(from, column.status)} onDrop={drop.move} className="min-h-48">
          <Panel
            key={column.status}
            title={`${statusLabels[column.status]} · ${column.count}`}
          >
            {column.tasks.length ? (
              <div className="space-y-3">
                {column.tasks.map((t) => (
                  <article
                    key={t.id}
                    {...(own && !drop.busy && (t.status === 'todo' || t.status === 'doing') ? draggableTask(t.id, t.status) : {})}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 [&[draggable=true]]:cursor-grab [&[draggable=true]]:active:cursor-grabbing"
                  >
                    <p className="text-xs font-semibold text-blue-600">
                      {t.code}
                    </p>
                    <p className="my-2 text-sm font-semibold text-navy">
                      {own ? <Link href={`/intern/work/${encodeURIComponent(t.id)}`} draggable={false}>{t.title}</Link> : t.title}
                    </p>
                    <Badge>{t.priority}</Badge>
                    <p className="mt-2 text-xs text-slate-500">
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
      <PageTitle
        title="Dự án của tôi"
        subtitle="Thông tin phân công từ giảng viên"
      />
      {assignment ? (
        <>
          <Panel title="Phiên thực tập">
            <p>
              {assignment.session.code} · {assignment.session.name}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Phân công:{" "}
              {new Date(assignment.assignedAt).toLocaleString("vi-VN")}
            </p>
          </Panel>
          <div className="mt-4">
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
  return (
    <Panel title={p.name}>
      <Badge>{p.code}</Badge>
      <p className="mt-3 whitespace-pre-wrap text-sm">{p.description}</p>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
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
            <dt className="text-slate-500">{label}</dt>
            <dd className="mt-1 break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-5 font-semibold">Công nghệ</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {p.technologies.length ? (
          p.technologies.map((t) => <Badge key={t}>{t}</Badge>)
        ) : (
          <p className="text-sm text-slate-500">Chưa có công nghệ khai báo.</p>
        )}
      </div>
    </Panel>
  );
}
