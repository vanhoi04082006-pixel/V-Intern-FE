"use client";
import { StudentWorkList } from "@/components/intern/student-work-list";
import { useInternWorkspaceContext } from "@/components/intern/intern-workspace-context";
import { WorkspaceFilterSummary } from "@/components/workspace/workspace-ui";
import {
  StudentBadge,
  StudentCallout,
  StudentChip,
  StudentHeading,
  StudentPanel,
  StudentProgress,
  studentDate,
  studentPriority,
  studentToneForPriority,
  studentToneForStatus,
} from "@/components/intern/student-ui";
import { OwnKanban } from "./own-kanban";
import { CodeSubmissions } from "./code-submissions";
import { TaskSpec } from "./task-spec";
import { useCallback, useEffect, useState } from "react";
import type { OwnTaskOpenIntent } from "./use-own-task-drop";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CircleAlert,
  ClipboardList,
  FileText,
  Gauge,
  History,
  MessageSquare,
  Search,
  SquareKanban,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { ApiError, errorMessage } from "@/lib/auth/api-client";
import { managerTransitions, saveManagedTask } from "@/lib/api/management";
import { useResource } from "@/lib/api/use-resource";
import {
  addTaskComment,
  getComments,
  getHistory,
  getTask,
  listTasks,
  nextOwnStatus,
  statusLabels,
  taskStatuses,
  priorities,
  priorityLabels,
  updateOwnTask,
  type Task,
} from "@/lib/api/work";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  Badge,
  buttonClass,
  Empty,
  inputClass,
  Modal,
  Pager,
  Panel,
} from "./primitives";
export function InternWork() {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [priority, setPriority] = useState(""),
    [search, setSearch] = useState("");
  const [detail, setDetail] = useState<string>();
  const [detailIntent, setDetailIntent] = useState<OwnTaskOpenIntent>();
  const [view, setView] = useState<"list" | "board">("list");
  const [revision, setRevision] = useState(0);
  const openTask = useCallback((id: string, intent?: OwnTaskOpenIntent) => {
    setDetail(id);
    setDetailIntent(intent);
  }, []);
  const load = useCallback(
    (signal: AbortSignal) => {
      const query = new URLSearchParams({
        mine: "true",
        page: String(page),
        pageSize: "10",
      });
      if (status) query.set("status", status);
      if (priority) query.set("priority", priority);
      if (search.trim()) query.set("search", search.trim());
      return listTasks(query, signal);
    },
    [page, status, priority, search],
  );
  const tasks = useResource(load);
  return (
    <>
      <StudentHeading
        eyebrow="Lên kế hoạch · Thực hiện · Cải thiện"
        title="Công việc của tôi"
        description="Theo dõi hạn nộp, tập trung vào nhiệm vụ đang làm và gửi bài để nhận phản hồi."
        action={
          <div
            role="group"
            aria-label="Cách xem công việc"
            className="student-segmented"
          >
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <ClipboardList size={15} aria-hidden="true" />
              Danh sách
            </button>
            <button
              type="button"
              aria-pressed={view === "board"}
              onClick={() => setView("board")}
            >
              <SquareKanban size={15} aria-hidden="true" />
              Bảng Kanban
            </button>
          </div>
        }
      />

      <section aria-label="Lọc công việc" className="student-toolbar mb-5">
        <div className="student-search-field">
          <Search size={15} aria-hidden="true" />
          <input
            aria-label="Tìm nhiệm vụ"
            placeholder="Tìm mã hoặc tên nhiệm vụ…"
            className="student-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {view === "list" && (
          <label className="student-field">
            <span>Trạng thái</span>
            <select
              aria-label="Trạng thái nhiệm vụ"
              className="student-input"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              {taskStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="student-field">
          <span>Ưu tiên</span>
          <select
            aria-label="Ưu tiên"
            className="student-input"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả ưu tiên</option>
            {priorities.map((s) => (
              <option key={s} value={s}>
                {priorityLabels[s]}
              </option>
            ))}
          </select>
        </label>
        {view === "board" && (search || priority) && (
          <button
            type="button"
            className="student-action student-action-secondary student-action-sm"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPriority("");
              setPage(1);
            }}
          >
            <X size={14} aria-hidden="true" />
            Xóa bộ lọc
          </button>
        )}
      </section>
      {view === "board" ? (
        <OwnKanban
          search={search}
          priority={priority}
          onOpen={openTask}
          revision={revision}
          onUpdated={tasks.reload}
        />
      ) : (
        <section className="student-panel" aria-label="Danh sách nhiệm vụ">
          <header className="student-panel-header">
            <h2>
              Danh sách nhiệm vụ
              {tasks.data && (
                <span className="student-board-count">{tasks.data.total}</span>
              )}
            </h2>
            <div className="student-panel-header-action">
              {tasks.data && !tasks.loading && !tasks.error && <WorkspaceFilterSummary
                shown={tasks.data.items.length} total={tasks.data.total} noun="nhiệm vụ"
                filtered={Boolean(search.trim() || status || priority)}
                onClear={() => { setSearch(""); setStatus(""); setPriority(""); setPage(1); }}
              />}
            </div>
          </header>
          <div className="student-panel-body">
            {tasks.loading ? (
              <div className="space-y-3" role="status">
                <span className="sr-only">Đang tải danh sách nhiệm vụ…</span>
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="student-skeleton h-[86px]" />
                ))}
              </div>
            ) : tasks.error ? (
              <ErrorState error={tasks.error} onRetry={tasks.reload} />
            ) : (
              tasks.data && (
                <>
                  <StudentWorkList
                    tasks={tasks.data.items}
                    onOpen={openTask}
                    filtered={Boolean(search || status || priority)}
                    onClear={() => {
                      setSearch("");
                      setStatus("");
                      setPriority("");
                      setPage(1);
                    }}
                  />
                  <Pager {...tasks.data} onChange={setPage} />
                </>
              )
            )}
          </div>
        </section>
      )}
      {detail && (
        <Modal
          title={
            detailIntent === "submit"
              ? "Nộp bài để chuyển sang Chờ duyệt"
              : "Chi tiết nhiệm vụ"
          }
          onClose={() => {
            setDetail(undefined);
            setDetailIntent(undefined);
          }}
        >
          <TaskDetail
            id={detail}
            intent={detailIntent}
            onUpdated={() => {
              tasks.reload();
              setRevision((v) => v + 1);
            }}
          />
        </Modal>
      )}
    </>
  );
}
export function TaskDetail({
  id,
  onUpdated,
  managed = false,
  intent,
}: {
  id: string;
  onUpdated?: () => void;
  managed?: boolean;
  intent?: OwnTaskOpenIntent;
}) {
  const workspace = useInternWorkspaceContext();
  const load = useCallback((signal: AbortSignal) => getTask(id, signal), [id]);
  const task = useResource(load);
  const [mutationError, setMutationError] = useState<unknown>();
  return (
    <>
      {managed && Boolean(mutationError) && <ErrorState error={mutationError} />}
      {task.loading && (!task.data || managed) ? (
        <LoadingState />
      ) : task.error ? (
        <ErrorState error={task.error} onRetry={task.reload} />
      ) : (
        task.data && (
          <TaskContent
            setMutationError={setMutationError}
            managed={managed}
            task={task.data}
            refreshing={task.loading}
            intent={intent}
            reload={() => {
              task.reload();
              if (!managed) workspace?.reload();
              onUpdated?.();
            }}
          />
        )
      )}
    </>
  );
}
function TaskContent({
  task,
  refreshing,
  reload,
  managed,
  setMutationError,
  intent,
}: {
  task: Task;
  refreshing: boolean;
  reload: () => void;
  managed: boolean;
  setMutationError: (error: unknown) => void;
  intent?: OwnTaskOpenIntent;
}) {
  const [progressDraft, setProgressDraft] = useState({
    version: task.version,
    value: task.progress,
  });
  // A new server version invalidates an unsaved progress value, while the
  // independent comment draft remains intact during refreshes and conflicts.
  const progress =
    progressDraft.version === task.version
      ? progressDraft.value
      : task.progress;
  const [content, setContent] = useState(""),
    [saving, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const busy = saving || refreshing;
  const [commentPage, setCommentPage] = useState(1),
    [historyPage, setHistoryPage] = useState(1);
  const comments = useResource(
    useCallback(
      (signal: AbortSignal) => getComments(task.id, commentPage, signal),
      [task.id, commentPage],
    ),
  );
  const history = useResource(
    useCallback(
      (signal: AbortSignal) => getHistory(task.id, historyPage, signal),
      [task.id, historyPage],
    ),
  );
  function scrollSubmissionIntoView(behavior?: ScrollBehavior) {
    const form = document.getElementById("task-submission-form");
    const section = document.getElementById("task-submission");
    const target = form ?? section;
    if (!target) return;
    const dialog = target.closest("dialog");
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const nextBehavior = behavior ?? (reduce ? "auto" : "smooth");
    if (dialog) {
      const top =
        dialog.scrollTop +
        target.getBoundingClientRect().top -
        dialog.getBoundingClientRect().top -
        12;
      dialog.scrollTo({
        top: Math.max(0, top),
        behavior: nextBehavior,
      });
    } else {
      target.scrollIntoView({
        block: "start",
        behavior: nextBehavior,
      });
    }
  }
  function goToSubmission() {
    scrollSubmissionIntoView();
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.setTimeout(
      () =>
        document
          .getElementById("submission-pr-url")
          ?.focus({ preventScroll: true }),
      reduce ? 0 : 280,
    );
  }
  useEffect(() => {
    if (managed || intent !== "submit" || task.status !== "doing") return;
    const dialog = document
      .getElementById("task-submission")
      ?.closest("dialog");
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    // A manual scroll or tap means the user has taken over; never fight it.
    dialog?.addEventListener("wheel", cancel, { passive: true });
    dialog?.addEventListener("touchstart", cancel, { passive: true });
    dialog?.addEventListener("pointerdown", cancel);
    // Submission/history panels grow below the form after their requests
    // complete. The first attempt can therefore hit the old maximum scroll;
    // retry briefly until the form is actually in view.
    const timers = [100, 550, 1200].map((delay) =>
      window.setTimeout(() => {
        if (!cancelled) scrollSubmissionIntoView("auto");
      }, delay),
    );
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      dialog?.removeEventListener("wheel", cancel);
      dialog?.removeEventListener("touchstart", cancel);
      dialog?.removeEventListener("pointerdown", cancel);
    };
  }, [intent, managed, task.id, task.status]);
  async function update(advance: boolean) {
    setBusy(true);
    setError(undefined);
    setMutationError(undefined);
    try {
      const status = advance ? nextOwnStatus(task.status) : null;
      await updateOwnTask(task.id, {
        expectedVersion: task.version,
        progress,
        ...(status ? { status } : {}),
      });
      reload();
    } catch (e) {
      setError(e);
      if (e instanceof ApiError && e.statusCode === 409) {
        setMutationError(e);
        reload();
        history.reload();
      }
    } finally {
      setBusy(false);
    }
  }
  async function comment() {
    setBusy(true);
    setError(undefined);
    try {
      await addTaskComment(task.id, content.trim());
      setContent("");
      comments.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function manage(status: typeof task.status) {
    setBusy(true);
    setError(undefined);
    setMutationError(undefined);
    try {
      await saveManagedTask(task.id, { status, expectedVersion: task.version });
      reload();
    } catch (e) {
      setError(e);
      if (e instanceof ApiError && e.statusCode === 409) {
        setMutationError(e);
        reload();
      }
    } finally {
      setBusy(false);
    }
  }
  const next = nextOwnStatus(task.status);
  const guidance =
    task.status === "todo"
      ? {
          title: "Sẵn sàng bắt đầu?",
          body: "Đọc đặc tả và kiểm tra các điều kiện bên dưới trước khi chuyển sang Đang làm.",
        }
      : task.status === "doing"
        ? {
            title: "Chuẩn bị nộp bài",
            body: "Thả thẻ sang Chờ duyệt chỉ mở nhiệm vụ — trạng thái chưa đổi. Gửi link PR/commit và mô tả ở phần nộp bài bên dưới; task tự chuyển sang Chờ duyệt sau khi hệ thống xác minh thành công. Nếu nhiệm vụ có phụ thuộc, giảng viên phải xác nhận các nhiệm vụ trước.",
          }
        : task.status === "review"
          ? {
              title: "Bài làm đang chờ duyệt",
              body: "Theo dõi kết quả kiểm tra và phản hồi. Giảng viên là người xác nhận trạng thái Hoàn thành.",
            }
          : {
              title: "Nhiệm vụ đã hoàn thành",
              body: "Bạn có thể xem lại bài nộp, kết quả kiểm tra và lịch sử trao đổi.",
            };
  return (
    <div
      className={`space-y-5 ${managed ? "" : "student-task-detail student-reveal"}`}
    >
      {!managed && (
        <>
          <Link href="/intern/work" className="student-link">
            <ArrowLeft size={14} aria-hidden="true" />
            Công việc của tôi
          </Link>

          <header className="student-detail-hero">
            <div className="min-w-0">
              <p className="student-work-code">{task.code}</p>
              <h2 className="student-detail-title">{task.title}</h2>
              <div className="student-meta mt-3">
                <StudentBadge tone={studentToneForStatus(task.status)}>
                  {statusLabels[task.status]}
                </StudentBadge>
                <StudentChip tone={studentToneForPriority(task.priority)}>
                  Ưu tiên{" "}
                  {studentPriority(task.priority).toLocaleLowerCase("vi")}
                </StudentChip>
                <StudentChip icon={CalendarDays}>
                  Hạn {studentDate(task.dueDate)}
                </StudentChip>
                <StudentChip icon={Gauge}>
                  {task.storyPoints ?? "—"} điểm
                </StudentChip>
              </div>
            </div>
            <div
              className="student-detail-progress"
              aria-label={`Tiến độ ${progress}%`}
            >
              <strong>{progress}%</strong>
              <span>tiến độ</span>
            </div>
          </header>

          <nav
            aria-label="Các bước thực hiện nhiệm vụ"
            className="student-task-steps"
          >
            {taskStatuses.map((status) => (
              <span
                key={status}
                aria-current={status === task.status ? "step" : undefined}
              >
                {statusLabels[status]}
              </span>
            ))}
          </nav>
        </>
      )}

      {managed && (
        <div>
          <h3 className="text-lg font-bold leading-relaxed text-navy">
            {task.code} · {task.title}
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">
            {task.description ?? "Chưa có mô tả."}
          </p>
          <div className="mt-3 flex gap-2">
            <Badge>{statusLabels[task.status]}</Badge>
            <Badge>{priorityLabels[task.priority]}</Badge>
          </div>
          <dl className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Sprint</dt>
              <dd className="mt-1 break-all text-xs">
                {task.sprint
                  ? `${task.sprint.code} · ${task.sprint.name}`
                  : task.sprintId
                    ? "Đã phân sprint"
                    : "Chưa có"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Story points</dt>
              <dd className="mt-1">{task.storyPoints ?? "Chưa có"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Hạn hoàn thành</dt>
              <dd className="mt-1">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("vi-VN")
                  : "Chưa có"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {Boolean(error) && (
        <p role="alert" className="student-callout" data-tone="rose">
          <CircleAlert size={17} aria-hidden="true" />
          <span>{errorMessage(error)}</span>
        </p>
      )}

      {!managed ? (
        <>
          <div className="student-detail-grid">
            <div className="student-stack">
              <StudentPanel title="Mô tả công việc" icon={FileText}>
                <p className="whitespace-pre-wrap text-[13px] leading-8 text-slate-600">
                  {task.description?.trim()
                    ? task.description
                    : "Giảng viên chưa thêm mô tả cho nhiệm vụ này. Hãy đọc tiêu chí hoàn thành bên dưới trước khi bắt đầu."}
                </p>
              </StudentPanel>

              <StudentPanel
                title="Cập nhật tiến độ"
                icon={TrendingUp}
                className="student-panel-accent"
              >
                <StudentProgress
                  value={progress}
                  label="Mức hoàn thành"
                  tone={progress >= 100 ? "green" : "blue"}
                />
                <label className="student-field mt-5">
                  <span>Kéo để cập nhật tiến độ: {progress}%</span>
                  <input
                    aria-label="Tiến độ nhiệm vụ"
                    className="student-range"
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) =>
                      setProgressDraft({
                        version: task.version,
                        value: Number(e.target.value),
                      })
                    }
                    disabled={busy || task.status === "done"}
                  />
                </label>
                <div className="mt-5 flex flex-wrap gap-2">
                  {next && next !== "review" && (
                    <button
                      className="student-action"
                      disabled={busy}
                      onClick={() => void update(true)}
                    >
                      Chuyển sang {statusLabels[next]}
                    </button>
                  )}
                  {next === "review" && (
                    <button
                      type="button"
                      className="student-action"
                      disabled={busy}
                      onClick={goToSubmission}
                    >
                      Nộp bài để chuyển sang Chờ duyệt
                    </button>
                  )}
                  <button
                    className="student-action student-action-secondary"
                    disabled={busy || task.status === "done"}
                    onClick={() => void update(false)}
                  >
                    Lưu tiến độ
                  </button>
                </div>
                <div className="mt-5">
                  <StudentCallout
                    tone={
                      task.status === "review"
                        ? "amber"
                        : task.status === "done"
                          ? "green"
                          : "blue"
                    }
                    title={guidance.title}
                  >
                    {guidance.body}
                  </StudentCallout>
                </div>
              </StudentPanel>

              <TaskSpec id={task.id} own />
            </div>

            <aside className="student-stack">
              <StudentPanel title="Thông tin nhiệm vụ" icon={ClipboardList}>
                <dl className="student-info-list">
                  <div className="student-info-row">
                    <dt>
                      <span className="student-info-icon">
                        <SquareKanban size={15} aria-hidden="true" />
                      </span>
                      Sprint
                    </dt>
                    <dd>
                      {task.sprint
                        ? `${task.sprint.code} · ${task.sprint.name}`
                        : task.sprintId
                          ? "Đã phân sprint"
                          : "Chưa có"}
                    </dd>
                  </div>
                  <div className="student-info-row">
                    <dt>
                      <span className="student-info-icon">
                        <Gauge size={15} aria-hidden="true" />
                      </span>
                      Điểm độ lớn
                    </dt>
                    <dd>{task.storyPoints ?? "Chưa đặt"}</dd>
                  </div>
                  <div className="student-info-row">
                    <dt>
                      <span className="student-info-icon">
                        <CalendarDays size={15} aria-hidden="true" />
                      </span>
                      Hạn hoàn thành
                    </dt>
                    <dd>{studentDate(task.dueDate)}</dd>
                  </div>
                  <div className="student-info-row">
                    <dt>
                      <span className="student-info-icon">
                        <Target size={15} aria-hidden="true" />
                      </span>
                      Trạng thái
                    </dt>
                    <dd>{statusLabels[task.status]}</dd>
                  </div>
                </dl>
              </StudentPanel>

              <StudentPanel title="Lịch sử trạng thái" icon={History}>
                {history.loading ? (
                  <LoadingState />
                ) : history.error ? (
                  <ErrorState error={history.error} onRetry={history.reload} />
                ) : (
                  history.data && (
                    <>
                      <ol className="student-timeline">
                        {history.data.items.map((h, index) => (
                          <li key={h.id}>
                            <span
                              className="student-timeline-marker"
                              aria-hidden="true"
                            >
                              {index + 1}
                            </span>
                            <div>
                              <strong>
                                {h.fromStatus
                                  ? statusLabels[h.fromStatus]
                                  : "Tạo mới"}{" "}
                                → {statusLabels[h.toStatus]}
                              </strong>
                              {h.reason && <p>{h.reason}</p>}
                              <time>
                                {new Date(h.createdAt).toLocaleString("vi-VN")}
                              </time>
                            </div>
                          </li>
                        ))}
                      </ol>
                      {history.data.totalPages > 1 && (
                        <Pager {...history.data} onChange={setHistoryPage} />
                      )}
                    </>
                  )
                )}
              </StudentPanel>

              <Link href="/intern/mentor" className="student-quick-link">
                <Bot size={22} aria-hidden="true" />
                <div>
                  <strong>Cần gỡ vướng?</strong>
                  <p>
                    Trao đổi với AI Mentor về yêu cầu hoặc lỗi bạn gặp phải.
                  </p>
                </div>
              </Link>
            </aside>

            <div className="student-detail-wide">
              <div id="task-submission" className="student-submission-anchor">
                {intent === "submit" && task.status === "doing" && (
                  <StudentCallout
                    tone="blue"
                    title="Nộp bài để chuyển sang Chờ duyệt"
                  >
                    Kéo thả chỉ mở nhiệm vụ, không tự đổi trạng thái. Gửi link
                    PR/commit và mô tả bài làm bên dưới. Hệ thống kiểm tra quyền
                    repository, commit và các nhiệm vụ phụ thuộc; sau khi nộp
                    thành công, nhiệm vụ mới chuyển sang Chờ duyệt.
                  </StudentCallout>
                )}
                <CodeSubmissions
                  task={task}
                  managed={false}
                  onUpdated={reload}
                />
              </div>

              <StudentPanel title="Trao đổi" icon={MessageSquare}>
                {comments.loading ? (
                  <LoadingState />
                ) : comments.error ? (
                  <ErrorState
                    error={comments.error}
                    onRetry={comments.reload}
                  />
                ) : (
                  comments.data && (
                    <>
                      {comments.data.items.length ? (
                        <ul className="space-y-3">
                          {comments.data.items.map((c) => (
                            <li
                              key={c.id}
                              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                            >
                              <p className="whitespace-pre-wrap text-[12.5px] leading-7 text-slate-700">
                                {c.content}
                              </p>
                              <time className="mt-1.5 block text-[10.5px] text-slate-500">
                                {new Date(c.createdAt).toLocaleString("vi-VN")}
                              </time>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[12.5px] leading-7 text-slate-500">
                          Chưa có bình luận. Đặt câu hỏi cho giảng viên hoặc ghi
                          lại điều bạn học được.
                        </p>
                      )}
                      {comments.data.totalPages > 1 && (
                        <Pager {...comments.data} onChange={setCommentPage} />
                      )}
                    </>
                  )
                )}
                <form
                  className="mt-4 space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void comment();
                  }}
                >
                  <label className="student-field">
                    <span>Bình luận mới</span>
                    <textarea
                      required
                      maxLength={2000}
                      className="student-input min-h-[92px]"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </label>
                  <button
                    className="student-action"
                    disabled={busy || !content.trim()}
                  >
                    Gửi bình luận
                  </button>
                </form>
              </StudentPanel>
            </div>
          </div>
        </>
      ) : (
        <div className="workspace-review-layout">
          <div className="workspace-review-main">
          <div className="flex flex-wrap gap-2">
            {managerTransitions(task.status)
              .filter(
                (status) =>
                  status !== "done" &&
                  !(task.status === "review" && status === "doing"),
              )
              .map((status) => (
                <button
                  key={status}
                  className={buttonClass}
                  disabled={busy}
                  onClick={() => void manage(status)}
                >
                  {status === "done"
                    ? "Duyệt hoàn thành"
                    : status === "doing" && task.status === "review"
                      ? "Yêu cầu làm lại"
                      : `Chuyển sang ${statusLabels[status]}`}
                </button>
              ))}
          </div>
          <TaskSpec id={task.id} />
          <CodeSubmissions task={task} managed onUpdated={reload} />
          </div>
          <aside className="workspace-review-aside">
          <Panel title="Bình luận">
            {comments.loading ? (
              <LoadingState />
            ) : comments.error ? (
              <ErrorState error={comments.error} onRetry={comments.reload} />
            ) : (
              comments.data && (
                <>
                  {comments.data.items.length ? (
                    comments.data.items.map((c) => (
                      <article
                        key={c.id}
                        className="mb-3 rounded-lg bg-slate-50 p-3"
                      >
                        <p className="whitespace-pre-wrap text-sm">
                          {c.content}
                        </p>
                        <time className="mt-2 block text-xs text-slate-500">
                          {new Date(c.createdAt).toLocaleString("vi-VN")}
                        </time>
                      </article>
                    ))
                  ) : (
                    <Empty>Chưa có bình luận.</Empty>
                  )}
                  <Pager {...comments.data} onChange={setCommentPage} />
                </>
              )
            )}
            <form
              className="mt-4 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                void comment();
              }}
            >
              <label className="block text-sm">
                Bình luận mới
                <textarea
                  required
                  maxLength={2000}
                  className={`${inputClass} mt-2`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </label>
              <button
                className={buttonClass}
                disabled={busy || !content.trim()}
              >
                Gửi bình luận
              </button>
            </form>
          </Panel>
          <Panel title="Lịch sử trạng thái">
            {history.loading ? (
              <LoadingState />
            ) : history.error ? (
              <ErrorState error={history.error} onRetry={history.reload} />
            ) : (
              history.data && (
                <>
                  <ol className="space-y-3">
                    {history.data.items.map((h) => (
                      <li
                        key={h.id}
                        className="border-l-2 border-blue-300 pl-3 text-sm"
                      >
                        <strong>
                          {h.fromStatus
                            ? statusLabels[h.fromStatus]
                            : "Tạo mới"}{" "}
                          → {statusLabels[h.toStatus]}
                        </strong>
                        <p>{h.reason}</p>
                        <time className="text-xs text-slate-500">
                          {new Date(h.createdAt).toLocaleString("vi-VN")}
                        </time>
                      </li>
                    ))}
                  </ol>
                  <Pager {...history.data} onChange={setHistoryPage} />
                </>
              )
            )}
          </Panel>
          </aside>
        </div>
      )}
    </div>
  );
}
