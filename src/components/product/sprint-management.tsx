"use client";
import { useCallback, useState } from "react";
import { Users, Layers, CalendarDays, Clock } from "lucide-react";
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
import { SprintOverview } from './sprint-overview';
import {
  Badge,
  buttonClass,
  Empty,
  inputClass,
  Modal,
  PageTitle,
  PageMeta,
  Pager,
  Panel,
  StatusDot,
} from "./primitives";
import { Person } from "./identity";
import { RowMenu } from "./instructor-dashboard";
import { ActivateButton } from "./instructor-onboarding";

export function TaskStatusPill({ status }: { status: string }) {
  const tone = status === "done" ? "green" : status === "review" ? "amber" : status === "doing" ? "blue" : "gray";
  return <StatusDot tone={tone as "green"}>{statusLabels[status as keyof typeof statusLabels] ?? status}</StatusDot>;
}
export function PriorityBadge({ priority }: { priority: string }) {
  const label = ({ low: "Thấp", medium: "Trung bình", high: "Cao", critical: "Khẩn cấp" } as Record<string, string>)[priority] ?? priority;
  const tone = priority === "high" || priority === "critical" ? "red" : priority === "medium" ? "amber" : "gray";
  return <StatusDot tone={tone as "green"}>{label}</StatusDot>;
}
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
  const [focus,setFocus] = useState('');
  const focused = rows.data?.items.find(s=>s.id===focus) ?? rows.data?.items.find(s=>s.status==='active') ?? rows.data?.items[0];
  return (
    <>
      <PageTitle title="Sprint & Task" />
      <PageMeta items={[
        { icon: Users, label: "Vai trò", value: "Giảng viên / Technical Lead" },
        { icon: Layers, label: "Hệ thống", value: "V-Intern Platform" },
        { icon: CalendarDays, label: "Sprint hiện tại", value: focused ? `${focused.code} · ${focused.name}` : "Chưa có" },
        { icon: Clock, label: "Cập nhật lúc", value: new Date().toLocaleString("vi-VN") },
      ]} />
      {focused && <><div className="mb-4 flex flex-wrap items-center gap-3"><label className="text-sm font-semibold" htmlFor="sprint-focus">Sprint đang xem</label><select id="sprint-focus" className={`${inputClass} sm:max-w-md`} value={focused.id} onChange={e=>setFocus(e.target.value)}>{rows.data?.items.map(s=><option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}</select><button className="text-sm font-semibold text-blue-600" onClick={()=>setSelected(focused)}>Cài đặt Sprint</button></div><SprintOverview key={focused.id} id={focused.id} activeCount={rows.data?.items.filter(s=>s.status==='active').length ?? 0}/><div id="sprint-task-list" className="scroll-mt-4"><TaskManagement projectId={focused.projectId} sprintId={focused.id}/></div></>}
      <Panel title="Các Sprint" action={<button className={buttonClass} onClick={() => setCreate(true)}>Tạo Sprint</button>}>
        <div className="mb-4 grid items-start gap-3 sm:grid-cols-2">
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
                    <div
                      key={s.id}
                      className="rounded-xl border border-slate-200 p-4 hover:border-blue-300"
                    >
                      <button
                        onClick={() => setSelected(s)}
                        className="block w-full text-left"
                        aria-label={`Cài đặt Sprint ${s.code}`}
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
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ActivateButton kind="sprints" id={s.id} status={s.status} onChanged={rows.reload} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>Chưa có Sprint phù hợp.</Empty>
              )}
              <Pager {...rows.data} unit="sprint" onChange={setPage} />
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
export function SprintForm({
  sprint,
  fixedProjectId,
  fixedProjectName,
  fixedSessionId,
  fixedSessionName,
  onSaved,
}: {
  sprint?: Sprint;
  fixedProjectId?: string;
  fixedProjectName?: string;
  fixedSessionId?: string;
  fixedSessionName?: string;
  onSaved: () => void;
}) {
  const [projectId, setProjectId] = useState(fixedProjectId ?? sprint?.projectId ?? ""),
    [sessionId, setSessionId] = useState(fixedSessionId ?? sprint?.sessionId ?? ""),
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
          {fixedProjectId ? (
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-navy">
              Dự án: <strong>{fixedProjectName ?? fixedProjectId}</strong> — đã kế thừa, không cần chọn lại.
            </p>
          ) : (
            <AcademicPicker
              kind="projects"
              label="Dự án"
              required
              assignable
              value={projectId}
              onChange={setProjectId}
            />
          )}
          {fixedSessionId ? (
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-navy">
              Phiên: <strong>{fixedSessionName ?? fixedSessionId}</strong> — đã kế thừa, không cần chọn lại.
            </p>
          ) : (
            <AcademicPicker
              kind="sessions"
              label="Phiên"
              value={sessionId}
              onChange={setSessionId}
            />
          )}
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
    [priority, setPriority] = useState(""),
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
            ...(priority ? { priority } : {}),
            ...(search ? { search } : {}),
          }),
          s,
        ),
      [page, projectId, sprintId, status, priority, search],
    ),
  );
  const members = useResource(
    useCallback(
      (s: AbortSignal) => (projectId ? getMembers("projects", projectId, s) : Promise.resolve([] as { userId: string; displayName: string }[])),
      [projectId],
    ),
  );
  const memberName = (id: string | null) => members.data?.find(m => m.userId === id)?.displayName ?? "Chưa phân công";
  const reload = () => {
      tasks.reload();
      onUpdated?.();
    },
    action = useAction(reload);
  return (
    <>
      <Panel
        title="Danh sách task"
        action={
          <button className={buttonClass} onClick={() => setCreate(true)}>
            Tạo nhiệm vụ
          </button>
        }
      >
        {Boolean(action.error) && <ErrorState error={action.error} />}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <input
            aria-label="Tìm nhiệm vụ quản lý"
            placeholder="Tìm kiếm task, mô tả, sinh viên..."
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
          <select
            aria-label="Ưu tiên nhiệm vụ quản lý"
            className={inputClass}
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả ưu tiên</option>
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
            <option value="critical">Khẩn cấp</option>
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
                <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-slate-50"><tr>{['#','Task','Sinh viên','Trạng thái','Ưu tiên','Hạn','Tiến độ','Hành động'].map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>
                  {tasks.data.items.map((t, i) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-100"
                    >
                      <td className="p-3 text-slate-500">{(page - 1) * 10 + i + 1}</td>
                      <td className="max-w-52 p-3">
                        <button
                          className="block text-left text-sm font-semibold text-blue-600"
                          onClick={() => setDetail(t.id)}
                        >
                          {t.code}
                        </button>
                        <span className="mt-1 line-clamp-1 block text-[11px] text-navy">{t.title}</span>
                      </td>
                      <td className="max-w-40 p-3"><Person name={memberName(t.assigneeId)} /></td>
                      <td className="p-3"><TaskStatusPill status={t.status} /></td>
                      <td className="p-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="p-3 whitespace-nowrap">{t.dueDate?new Date(t.dueDate).toLocaleDateString('vi-VN'):'Chưa có'}</td>
                      <td className="p-3"><div className="flex min-w-24 items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{width:`${t.progress}%`}}/></div>{t.progress}%</div></td>
                      <td className="whitespace-nowrap p-3"><button className="rounded border border-blue-100 px-2 py-1 text-blue-600" onClick={() => setDetail(t.id)}>Xem</button> <RowMenu label={`Thao tác ${t.code}`} items={[{ label: "Sửa nhiệm vụ", onSelect: () => setEdit(t) }, { label: "Xóa nhiệm vụ", onSelect: () => { if (window.confirm(`Xóa nhiệm vụ ${t.code}? Lịch sử vẫn được giữ.`)) void action.run(() => deleteTask(t.id)); } }]} /></td>
                    </tr>
                  ))}
                </tbody></table></div>
              ) : (
                <Empty>Chưa có nhiệm vụ phù hợp.</Empty>
              )}
              <Pager {...tasks.data} unit="task" onChange={setPage} />
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
export function TaskForm({
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
