"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { ApiError, errorMessage } from "@/lib/auth/api-client";
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
  PageTitle,
  Pager,
  Panel,
} from "./primitives";
export function InternWork() {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [priority, setPriority] = useState(""),
    [search, setSearch] = useState("");
  const [detail, setDetail] = useState<string>();
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
      <PageTitle
        title="Công việc của tôi"
        subtitle="Nhiệm vụ được giao · trạng thái cập nhật từ hệ thống"
      />
      <Panel title="Danh sách nhiệm vụ">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <input
            aria-label="Tìm nhiệm vụ"
            placeholder="Tìm mã hoặc tên nhiệm vụ..."
            className={inputClass}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label="Trạng thái nhiệm vụ"
            className={inputClass}
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
          <select
            aria-label="Ưu tiên"
            className={inputClass}
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả ưu tiên</option>
            {["low", "medium", "high", "urgent"].map((s) => (
              <option key={s}>{s}</option>
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
              {tasks.data.items.length === 0 ? (
                <Empty>Chưa có nhiệm vụ phù hợp.</Empty>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        {[
                          "Nhiệm vụ",
                          "Trạng thái",
                          "Ưu tiên",
                          "Tiến độ",
                          "Hạn",
                          "",
                        ].map((x) => (
                          <th key={x} className="p-3">
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.data.items.map((task) => (
                        <tr key={task.id} className="border-b border-slate-100">
                          <td className="p-3">
                            <button
                              className="text-left font-semibold text-blue-600"
                              onClick={() => setDetail(task.id)}
                            >
                              {task.code} · {task.title}
                            </button>
                          </td>
                          <td className="p-3">
                            <Badge>{statusLabels[task.status]}</Badge>
                          </td>
                          <td className="p-3">{task.priority}</td>
                          <td className="p-3">
                            <progress
                              aria-label={`Tiến độ ${task.code}`}
                              value={task.progress}
                              max={100}
                              className="h-2 w-20 accent-blue-600"
                            />{" "}
                            {task.progress}%
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "Chưa có"}
                          </td>
                          <td className="p-3">
                            <Link
                              href={`/intern/work/${task.id}`}
                              className="text-blue-600"
                            >
                              Chi tiết
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pager {...tasks.data} onChange={setPage} />
            </>
          )
        )}
      </Panel>
      {detail && (
        <Modal title="Chi tiết nhiệm vụ" onClose={() => setDetail(undefined)}>
          <TaskDetail id={detail} onUpdated={tasks.reload} />
        </Modal>
      )}
    </>
  );
}
export function TaskDetail({
  id,
  onUpdated,
}: {
  id: string;
  onUpdated?: () => void;
}) {
  const load = useCallback((signal: AbortSignal) => getTask(id, signal), [id]);
  const task = useResource(load);
  if (task.loading) return <LoadingState />;
  if (task.error)
    return <ErrorState error={task.error} onRetry={task.reload} />;
  return (
    task.data && (
      <TaskContent
        task={task.data}
        reload={() => {
          task.reload();
          onUpdated?.();
        }}
      />
    )
  );
}
function TaskContent({ task, reload }: { task: Task; reload: () => void }) {
  const [progress, setProgress] = useState(task.progress),
    [content, setContent] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
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
  async function update(advance: boolean) {
    setBusy(true);
    setError(undefined);
    try {
      const status = advance ? nextOwnStatus(task.status) : null;
      await updateOwnTask(task.id, { progress, ...(status ? { status } : {}) });
      reload();
    } catch (e) {
      setError(e);
      if (e instanceof ApiError && e.statusCode === 409) {
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
  const next = nextOwnStatus(task.status);
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-navy">
          {task.code} · {task.title}
        </h3>
        <p className="mt-2 whitespace-pre-wrap text-sm">
          {task.description ?? "Chưa có mô tả."}
        </p>
        <div className="mt-3 flex gap-2">
          <Badge>{statusLabels[task.status]}</Badge>
          <Badge>{task.priority}</Badge>
        </div>
      </div>
      {Boolean(error) && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {errorMessage(error)}
        </p>
      )}
      <label className="block text-sm">
        Tiến độ: {progress}%
        <input
          aria-label="Tiến độ nhiệm vụ"
          className="mt-2 w-full accent-blue-600"
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          disabled={busy || task.status === "done"}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className={buttonClass}
          disabled={busy || task.status === "done"}
          onClick={() => void update(false)}
        >
          Lưu tiến độ
        </button>
        {next && (
          <button
            className={buttonClass}
            disabled={busy}
            onClick={() => void update(true)}
          >
            Chuyển sang {statusLabels[next]}
          </button>
        )}
      </div>
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
                    <p className="whitespace-pre-wrap text-sm">{c.content}</p>
                    <time className="mt-2 block text-xs text-slate-400">
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
          <button className={buttonClass} disabled={busy || !content.trim()}>
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
                      {h.fromStatus ? statusLabels[h.fromStatus] : "Tạo mới"} →{" "}
                      {statusLabels[h.toStatus]}
                    </strong>
                    <p>{h.reason}</p>
                    <time className="text-xs text-slate-400">
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
    </div>
  );
}
