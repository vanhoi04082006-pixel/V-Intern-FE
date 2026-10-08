"use client";
import { useCallback, useState } from "react";
import {
  listSprints,
  saveSprint,
  transitionSprint,
  saveManagedTask,
  deleteTask,
  type Sprint,
} from "@/lib/api/management";
import { getMembers } from "@/lib/api/academic";
import {
  getBoard,
  listTasks,
  statusLabels,
  taskStatuses,
  priorities,
  type Task,
} from "@/lib/api/work";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { AcademicPicker } from "./academic-picker";
import { useAction } from "./use-action";
import { TaskDetail } from "./intern-work";
import { CollectionMetrics } from "./collection-insights";
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
export function SprintManagement() {
  const [page, setPage] = useState(1),
    [projectId, setProjectId] = useState(""),
    [status, setStatus] = useState(""),
    [create, setCreate] = useState(false),
    [selected, setSelected] = useState<Sprint>();
  const rows = useResource(
    useCallback(
      (s: AbortSignal) => listSprints(page, projectId, status, s),
      [page, projectId, status],
    ),
  );
  return (
    <>
      <PageTitle
        title="Sprint & Task"
        subtitle="Quản lý chu kỳ, giao việc và duyệt kết quả thực tế"
        action={
          <button className={buttonClass} onClick={() => setCreate(true)}>
            Tạo Sprint
          </button>
        }
      />
      <Panel title="Các Sprint">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <AcademicPicker
            kind="projects"
            label="Dự án Sprint"
            value={projectId}
            onChange={(v) => {
              setProjectId(v);
              setPage(1);
            }}
          />
          <select
            aria-label="Trạng thái Sprint"
            className={inputClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {["planned", "active", "completed", "cancelled"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {rows.loading ? (
          <LoadingState />
        ) : rows.error ? (
          <ErrorState error={rows.error} onRetry={rows.reload} />
        ) : (
          rows.data && (
            <>
              {rows.data.items.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {rows.data.items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className="rounded-xl border border-slate-200 p-4 text-left hover:border-blue-300"
                    >
                      <div className="mb-3 flex justify-between gap-2">
                        <span className="text-xs text-slate-400">{s.code}</span>
                        <Badge>{s.status}</Badge>
                      </div>
                      <h3 className="font-bold text-navy">{s.name}</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        {s.goal ?? "Chưa có mục tiêu"}
                      </p>
                      <p className="mt-3 text-xs text-slate-400">
                        {new Date(s.startDate).toLocaleDateString("vi-VN")} –{" "}
                        {new Date(s.endDate).toLocaleDateString("vi-VN")}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty>Chưa có Sprint phù hợp.</Empty>
              )}
              <Pager {...rows.data} onChange={setPage} />
            </>
          )
        )}
      </Panel>
      {create && (
        <Modal title="Tạo Sprint" onClose={() => setCreate(false)}>
          <SprintForm
            onSaved={() => {
              setCreate(false);
              rows.reload();
            }}
          />
        </Modal>
      )}
      {selected && (
        <Modal
          wide
          title={selected.name}
          onClose={() => setSelected(undefined)}
        >
          <SprintDetail
            key={selected.id}
            sprint={selected}
            onSaved={rows.reload}
          />
        </Modal>
      )}
    </>
  );
}
function SprintForm({
  sprint,
  onSaved,
}: {
  sprint?: Sprint;
  onSaved: () => void;
}) {
  const [projectId, setProjectId] = useState(sprint?.projectId ?? ""),
    [sessionId, setSessionId] = useState(sprint?.sessionId ?? ""),
    action = useAction(onSaved);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void action.run(() =>
          saveSprint(sprint?.id, {
            name: String(f.get("name")),
            description: String(f.get("description")),
            goal: String(f.get("goal")),
            startDate: new Date(String(f.get("start")) + "Z").toISOString(),
            endDate: new Date(String(f.get("end")) + "Z").toISOString(),
            ...(!sprint
              ? {
                  code: String(f.get("code")),
                  projectId,
                  ...(sessionId ? { sessionId } : {}),
                }
              : {}),
          }),
        );
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      {!sprint && (
        <>
          <label className="block text-sm">
            Mã Sprint
            <input required name="code" maxLength={64} className={inputClass} />
          </label>
          <AcademicPicker
            kind="projects"
            label="Dự án"
            required
            assignable
            value={projectId}
            onChange={setProjectId}
          />
          <AcademicPicker
            kind="sessions"
            label="Phiên"
            value={sessionId}
            onChange={setSessionId}
          />
        </>
      )}
      {[
        ["name", "Tên Sprint", sprint?.name],
        ["description", "Mô tả Sprint", sprint?.description],
        ["goal", "Mục tiêu", sprint?.goal],
      ].map(([name, label, value]) => (
        <label key={name} className="block text-sm">
          {label}
          <input
            name={name ?? ""}
            required={name === "name"}
            maxLength={
              name === "description" ? 4000 : name === "goal" ? 512 : 256
            }
            defaultValue={value ?? ""}
            className={inputClass}
          />
        </label>
      ))}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["start", "Bắt đầu (UTC)", sprint?.startDate],
          ["end", "Kết thúc (UTC)", sprint?.endDate],
        ].map(([name, label, value]) => (
          <label key={name} className="text-sm">
            {label}
            <input
              required
              type="datetime-local"
              name={name ?? ""}
              defaultValue={value?.slice(0, 16)}
              className={inputClass}
            />
          </label>
        ))}
      </div>
      <button className={buttonClass} disabled={action.busy}>
        Lưu Sprint
      </button>
    </form>
  );
}
function SprintDetail({
  sprint,
  onSaved,
}: {
  sprint: Sprint;
  onSaved: () => void;
}) {
  const [edit, setEdit] = useState(false),
    [status, setStatus] = useState(sprint.status),
    [task, setTask] = useState<string>();
  const board = useResource(
    useCallback((s: AbortSignal) => getBoard(sprint.id, s), [sprint.id]),
  );
  const action = useAction(() => {
    board.reload();
    onSaved();
  });
  return (
    <div className="space-y-5">
      {!board.loading && !board.error && board.data && (
        <CollectionMetrics
          values={[
            ["Nhiệm vụ", board.data.total],
            ...board.data.columns.map(
              (c) => [statusLabels[c.status], c.count] as [string, number],
            ),
          ]}
        />
      )}
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <div className="flex flex-wrap gap-3">
        <Badge>{status}</Badge>
        {["planned", "active"].includes(status) && (
          <button
            className="text-sm text-blue-600"
            onClick={() => setEdit(!edit)}
          >
            Sửa Sprint
          </button>
        )}
        {(status === "planned"
          ? ["active", "cancelled"]
          : status === "active"
            ? ["completed", "cancelled"]
            : []
        ).map((s) => (
          <button
            key={s}
            className={buttonClass}
            disabled={action.busy}
            onClick={() =>
              void action.run(async () => {
                const r = await transitionSprint(sprint.id, s);
                setStatus(r.status);
              })
            }
          >
            Chuyển Sprint sang {s}
          </button>
        ))}
      </div>
      {edit && (
        <SprintForm
          sprint={sprint}
          onSaved={() => {
            setEdit(false);
            onSaved();
            board.reload();
          }}
        />
      )}
      <TaskManagement
        projectId={sprint.projectId}
        sprintId={sprint.id}
        onUpdated={board.reload}
      />
      <Panel title="Sprint Board">
        {board.loading ? (
          <LoadingState />
        ) : board.error ? (
          <ErrorState error={board.error} onRetry={board.reload} />
        ) : (
          board.data && (
            <>
              <p className="mb-3 text-sm">Tổng {board.data.total} nhiệm vụ</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {board.data.columns.map((c) => (
                  <section
                    key={c.status}
                    className="min-w-0 rounded-xl bg-slate-50 p-3"
                  >
                    <h3 className="mb-3 text-sm font-bold">
                      {statusLabels[c.status]} ({c.count})
                    </h3>
                    {c.tasks.map((t) => (
                      <button
                        key={t.id}
                        className="mb-2 block w-full rounded-lg bg-white p-3 text-left text-sm shadow-sm"
                        onClick={() => setTask(t.id)}
                      >
                        <small className="text-blue-600">{t.code}</small>
                        <p className="mt-1 font-semibold">{t.title}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {t.priority} · {t.progress}%
                        </p>
                      </button>
                    ))}
                    {c.count > c.tasks.length && (
                      <p className="text-xs">
                        Xem danh sách nhiệm vụ để truy cập tất cả.
                      </p>
                    )}
                  </section>
                ))}
              </div>
            </>
          )
        )}
      </Panel>
      {task && (
        <Modal title="Chi tiết nhiệm vụ" onClose={() => setTask(undefined)}>
          <TaskDetail id={task} managed onUpdated={board.reload} />
        </Modal>
      )}
    </div>
  );
}
export function TaskManagement({
  projectId = "",
  sprintId = "",
  onUpdated,
}: {
  projectId?: string;
  sprintId?: string;
  onUpdated?: () => void;
}) {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [search, setSearch] = useState(""),
    [create, setCreate] = useState(false),
    [detail, setDetail] = useState<string>(),
    [edit, setEdit] = useState<Task>();
  const tasks = useResource(
    useCallback(
      (s: AbortSignal) =>
        listTasks(
          new URLSearchParams({
            page: String(page),
            pageSize: "10",
            ...(projectId ? { projectId } : {}),
            ...(sprintId ? { sprintId } : {}),
            ...(status ? { status } : {}),
            ...(search ? { search } : {}),
          }),
          s,
        ),
      [page, projectId, sprintId, status, search],
    ),
  );
  const reload = () => {
      tasks.reload();
      onUpdated?.();
    },
    action = useAction(reload);
  return (
    <>
      <Panel
        title="Nhiệm vụ"
        action={
          <button className={buttonClass} onClick={() => setCreate(true)}>
            Tạo nhiệm vụ
          </button>
        }
      >
        {Boolean(action.error) && <ErrorState error={action.error} />}
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <input
            aria-label="Tìm nhiệm vụ quản lý"
            placeholder="Tìm mã hoặc tên..."
            className={inputClass}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label="Trạng thái nhiệm vụ quản lý"
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
        </div>
        {tasks.loading ? (
          <LoadingState />
        ) : tasks.error ? (
          <ErrorState error={tasks.error} onRetry={tasks.reload} />
        ) : (
          tasks.data && (
            <>
              {tasks.data.items.length ? (
                <div className="space-y-2">
                  {tasks.data.items.map((t) => (
                    <article
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
                    >
                      <div>
                        <button
                          className="text-left text-sm font-semibold text-blue-600"
                          onClick={() => setDetail(t.id)}
                        >
                          {t.code} · {t.title}
                        </button>
                        <p className="mt-1 text-xs text-slate-400">
                          {statusLabels[t.status]} · {t.priority} ·{" "}
                          {t.storyPoints ?? "Chưa có"} points · {t.progress}%
                        </p>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <button
                          className="text-blue-600"
                          onClick={() => setEdit(t)}
                        >
                          Sửa nhiệm vụ
                        </button>
                        <button
                          className="text-red-600"
                          disabled={action.busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Xóa nhiệm vụ ${t.code}? Lịch sử vẫn được giữ.`,
                              )
                            )
                              void action.run(() => deleteTask(t.id));
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty>Chưa có nhiệm vụ phù hợp.</Empty>
              )}
              <Pager {...tasks.data} onChange={setPage} />
            </>
          )
        )}
      </Panel>
      {(create || edit) && (
        <Modal
          title={edit ? "Sửa nhiệm vụ" : "Tạo nhiệm vụ"}
          onClose={() => {
            setCreate(false);
            setEdit(undefined);
          }}
        >
          <TaskForm
            task={edit}
            projectId={projectId}
            sprintId={sprintId}
            onSaved={() => {
              setCreate(false);
              setEdit(undefined);
              reload();
            }}
          />
        </Modal>
      )}
      {detail && (
        <Modal title="Chi tiết nhiệm vụ" onClose={() => setDetail(undefined)}>
          <TaskDetail id={detail} managed onUpdated={reload} />
        </Modal>
      )}
    </>
  );
}
function TaskForm({
  task,
  projectId: initialProjectId,
  sprintId,
  onSaved,
}: {
  task?: Task;
  projectId: string;
  sprintId: string;
  onSaved: () => void;
}) {
  const [projectId, setProjectId] = useState(
      task?.projectId ?? initialProjectId,
    ),
    [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? ""),
    action = useAction(onSaved);
  const members = useResource(
    useCallback(
      (s: AbortSignal) =>
        projectId ? getMembers("projects", projectId, s) : Promise.resolve([]),
      [projectId],
    ),
  );
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void action.run(() =>
          saveManagedTask(task?.id, {
            title: String(f.get("title")),
            description: String(f.get("description")),
            priority: String(f.get("priority")),
            ...(f.get("points") !== ""
              ? { storyPoints: Number(f.get("points")) }
              : {}),
            ...(f.get("due")
              ? { dueDate: new Date(String(f.get("due")) + "Z").toISOString() }
              : {}),
            ...(task
              ? {
                  expectedVersion: task.version,
                  assigneeId: assigneeId || null,
                }
              : {
                  projectId,
                  ...(assigneeId ? { assigneeId } : {}),
                  ...(sprintId ? { sprintId } : {}),
                }),
          }),
        );
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      {!task && !initialProjectId && (
        <AcademicPicker
          kind="projects"
          label="Dự án nhiệm vụ"
          required
          assignable
          value={projectId}
          onChange={setProjectId}
        />
      )}
      <label className="block text-sm">
        Tên nhiệm vụ
        <input
          className={inputClass}
          name="title"
          required
          maxLength={256}
          defaultValue={task?.title}
        />
      </label>
      <label className="block text-sm">
        Mô tả nhiệm vụ
        <textarea
          className={inputClass}
          name="description"
          maxLength={4000}
          defaultValue={task?.description ?? ""}
        />
      </label>
      <select
        className={inputClass}
        aria-label="Mức ưu tiên"
        name="priority"
        defaultValue={task?.priority ?? "medium"}
      >
        {priorities.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <label className="block text-sm">
        Story points
        <input
          type="number"
          min="0"
          max="1000"
          name="points"
          className={inputClass}
          defaultValue={task?.storyPoints ?? ""}
        />
      </label>
      <label className="block text-sm">
        Hạn nhiệm vụ (UTC)
        <input
          type="datetime-local"
          name="due"
          className={inputClass}
          defaultValue={task?.dueDate?.slice(0, 16)}
        />
      </label>
      {members.loading ? (
        <LoadingState />
      ) : members.error ? (
        <ErrorState error={members.error} onRetry={members.reload} />
      ) : (
        <select
          className={inputClass}
          aria-label="Người thực hiện"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          <option value="">Chưa giao</option>
          {members.data?.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.displayName} · {m.email}
            </option>
          ))}
        </select>
      )}
      <button
        className={buttonClass}
        disabled={
          action.busy || !projectId || members.loading || Boolean(members.error)
        }
      >
        Lưu nhiệm vụ
      </button>
    </form>
  );
}
