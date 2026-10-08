"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useResource } from "@/lib/api/use-resource";
import { getSessionUser } from "@/lib/auth/session";
import * as api from "@/lib/api/academic";
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
import { AcademicPicker } from "./academic-picker";
const labels = {
  classes: "Lớp học",
  sessions: "Phiên thực tập",
  projects: "Thư viện dự án",
};
export function AcademicList({ kind }: { kind: api.AcademicKind }) {
  const [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [selected, setSelected] = useState<string>(),
    [create, setCreate] = useState(false);
  const data = useResource(
    useCallback(
      (signal: AbortSignal) => api.listAcademic(kind, page, q, status, signal),
      [kind, page, q, status],
    ),
  );
  return (
    <>
      <PageTitle
        title={labels[kind]}
        subtitle="Quản lý chương trình thực tập"
        action={
          <button className={buttonClass} onClick={() => setCreate(true)}>
            Tạo{" "}
            {kind === "classes"
              ? "lớp"
              : kind === "sessions"
                ? "phiên"
                : "dự án"}
          </button>
        }
      />
      <Panel title="Danh sách">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <input
            className={inputClass}
            aria-label="Tìm mã hoặc tên"
            placeholder="Tìm mã hoặc tên..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            className={inputClass}
            aria-label="Trạng thái"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {api.academicStatuses[kind].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {data.loading ? (
          <LoadingState />
        ) : data.error ? (
          <ErrorState error={data.error} onRetry={data.reload} />
        ) : (
          data.data && (
            <>
              <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                {data.data.total} bản ghi phù hợp bộ lọc
              </div>
              {data.data.items.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          "Mã / Tên",
                          "Trạng thái",
                          "Bắt đầu",
                          "Kết thúc",
                          "",
                        ].map((x) => (
                          <th key={x} className="p-3">
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.items.map((x) => (
                        <tr key={x.id} className="border-b border-slate-100">
                          <td className="p-3">
                            <strong className="block">{x.name}</strong>
                            <span className="text-xs text-slate-400">
                              {x.code}
                            </span>
                            {x.technologies.length > 0 && (
                              <p className="mt-1 text-xs">
                                {x.technologies.join(" · ")}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge>{x.status}</Badge>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {x.startDate
                              ? new Date(x.startDate).toLocaleDateString(
                                  "vi-VN",
                                )
                              : "Chưa có"}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {x.endDate
                              ? new Date(x.endDate).toLocaleDateString("vi-VN")
                              : "Chưa có"}
                          </td>
                          <td className="p-3">
                            <button
                              className="font-semibold text-blue-600"
                              onClick={() => setSelected(x.id)}
                            >
                              Chi tiết {x.code}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>Chưa có dữ liệu phù hợp.</Empty>
              )}
              <Pager {...data.data} onChange={setPage} />
            </>
          )
        )}
      </Panel>
      {create && (
        <Modal title={`Tạo ${labels[kind]}`} onClose={() => setCreate(false)}>
          <AcademicForm
            kind={kind}
            onSaved={() => {
              setCreate(false);
              data.reload();
            }}
          />
        </Modal>
      )}
      {selected && (
        <AcademicDetail
          key={selected}
          kind={kind}
          id={selected}
          onClose={() => setSelected(undefined)}
          onChanged={data.reload}
        />
      )}
    </>
  );
}
function AcademicForm({
  kind,
  initial,
  onSaved,
}: {
  kind: api.AcademicKind;
  initial?: api.AcademicEntity;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      status: initial?.status ?? api.academicStatuses[kind][0],
      startDate: initial?.startDate?.slice(0, 16) ?? "",
      endDate: initial?.endDate?.slice(0, 16) ?? "",
      leadInstructorId: initial?.leadInstructorId ?? getSessionUser()?.id ?? "",
      mentorId: initial?.mentorId ?? getSessionUser()?.id ?? "",
      technologies: initial?.technologies.join(", ") ?? "",
      capacity: initial?.capacity?.toString() ?? "",
      difficulty: initial?.difficulty ?? "beginner",
      sessionId: initial?.sessionId ?? "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const field = (
    key: string,
    label: string,
    type = "text",
    required = false,
    max = 256,
  ) => (
    <label key={key} className="block text-sm font-medium">
      {label}
      <input
        className={`${inputClass} mt-1`}
        type={type}
        required={required}
        maxLength={max}
        value={form[key] ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );
  async function save() {
    setBusy(true);
    setError(undefined);
    try {
      await api.saveAcademic(kind, initial?.id, form);
      onSaved();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      {Boolean(error) && <ErrorState error={error} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {!initial && field("code", "Mã", "text", true, 64)}
        {field("name", "Tên", "text", true)}
        {field(
          "startDate",
          "Bắt đầu (UTC)",
          "datetime-local",
          kind === "sessions",
        )}
        {field(
          "endDate",
          "Kết thúc (UTC)",
          "datetime-local",
          kind === "sessions",
        )}
      </div>
      <label className="block text-sm">
        Mô tả
        <textarea
          className={`${inputClass} mt-1`}
          rows={3}
          maxLength={kind === "projects" ? 4000 : 2000}
          required={kind === "projects"}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Trạng thái
        <select
          className={`${inputClass} mt-1`}
          value={form.status}
          aria-label="Trạng thái"
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          {(kind === "sessions" && initial
            ? [initial.status, ...api.sessionTransitions(initial.status)]
            : api.academicStatuses[kind]
          ).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {kind === "projects" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("technologies", "Công nghệ (phân cách bằng dấu phẩy)")}
            {field("capacity", "Sức chứa", "number")}
            <label className="block text-sm">
              Độ khó
              <select
                className={`${inputClass} mt-1`}
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
              >
                {["beginner", "intermediate", "advanced"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-sm text-slate-500">
            Mentor:{" "}
            {initial?.mentorId && initial.mentorId !== getSessionUser()?.id
              ? initial.mentorId
              : "Tài khoản của bạn"}
          </p>
        </>
      )}
      {kind === "classes" && (
        <AcademicPicker
          kind="sessions"
          label="Phiên thực tập"
          value={form.sessionId}
          onChange={(value) => setForm({ ...form, sessionId: value })}
        />
      )}
      <button className={buttonClass} disabled={busy}>
        {busy ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
function AcademicDetail({
  kind,
  id,
  onClose,
  onChanged,
}: {
  kind: api.AcademicKind;
  id: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const entity = useResource(
    useCallback((s: AbortSignal) => api.getAcademic(kind, id, s), [kind, id]),
  );
  const [edit, setEdit] = useState(false);
  return (
    <Modal title={`Chi tiết ${labels[kind]}`} onClose={onClose}>
      {entity.loading ? (
        <LoadingState />
      ) : entity.error ? (
        <ErrorState error={entity.error} onRetry={entity.reload} />
      ) : (
        entity.data && (
          <div className="space-y-5">
            <h3 className="font-bold text-lg">{entity.data.name}</h3>
            <p className="text-sm">
              {entity.data.description ?? "Chưa có mô tả."}
            </p>
            <div className="flex items-center gap-3">
              <Badge>{entity.data.status}</Badge>
              <button className={buttonClass} onClick={() => setEdit(!edit)}>
                {edit ? "Đóng chỉnh sửa" : "Chỉnh sửa"}
              </button>
            </div>
            {edit && (
              <AcademicForm
                kind={kind}
                initial={entity.data}
                onSaved={() => {
                  setEdit(false);
                  entity.reload();
                  onChanged();
                }}
              />
            )}
            <Members kind={kind} id={id} />
            {kind === "sessions" && <SessionExtras id={id} />}
            <AssignmentForm
              fixedProject={kind === "projects" ? id : undefined}
              fixedSession={kind === "sessions" ? id : undefined}
            />
          </div>
        )
      )}
    </Modal>
  );
}
function CandidateSelect({
  value,
  onChange,
  page,
  setPage,
}: {
  value: string;
  onChange: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
}) {
  const candidates = useResource(
    useCallback((s: AbortSignal) => api.listCandidates(page, s), [page]),
  );
  return (
    <>
      {candidates.loading ? (
        <LoadingState />
      ) : candidates.error ? (
        <ErrorState error={candidates.error} onRetry={candidates.reload} />
      ) : (
        candidates.data && (
          <>
            <label className="block text-sm">
              Chọn Intern
              <select
                required
                className={`${inputClass} mt-1`}
                value={value}
                aria-label="Chọn Intern"
                onChange={(e) => onChange(e.target.value)}
              >
                <option value="">Chọn thành viên</option>
                {candidates.data.items.map((c) => (
                  <option key={c.userId} value={c.userId}>
                    {c.displayName ?? c.email ?? c.userId} · {c.status}
                  </option>
                ))}
              </select>
            </label>
            <Pager {...candidates.data} onChange={setPage} />
          </>
        )
      )}
    </>
  );
}
function Members({ kind, id }: { kind: api.AcademicKind; id: string }) {
  const members = useResource(
    useCallback((s: AbortSignal) => api.getMembers(kind, id, s), [kind, id]),
  );
  const [userId, setUserId] = useState(""),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  async function mutate(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
      members.reload();
      setUserId("");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel title="Thành viên">
      {Boolean(error) && <ErrorState error={error} />}{" "}
      {members.loading ? (
        <LoadingState />
      ) : members.error ? (
        <ErrorState error={members.error} onRetry={members.reload} />
      ) : members.data?.length ? (
        <ul className="space-y-2">
          {members.data.map((m) => (
            <li
              key={m.userId}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"
            >
              <span>
                {m.displayName}
                <small className="block break-all text-slate-400">
                  {m.email}
                </small>
              </span>
              {kind !== "projects" && (
                <button
                  disabled={busy}
                  className="text-red-600"
                  onClick={() =>
                    void mutate(() => api.removeMember(kind, id, m.userId))
                  }
                >
                  Xóa thành viên
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Chưa có thành viên.</Empty>
      )}
      {kind !== "projects" && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void mutate(() => api.addMember(kind, id, userId));
          }}
        >
          <CandidateSelect
            value={userId}
            onChange={setUserId}
            page={page}
            setPage={setPage}
          />
          <button className={buttonClass} disabled={busy || !userId}>
            Thêm thành viên
          </button>
        </form>
      )}
    </Panel>
  );
}
export function AssignmentForm({
  fixedProject,
  fixedSession,
}: {
  fixedProject?: string;
  fixedSession?: string;
}) {
  const [internId, setInternId] = useState(""),
    [projectId, setProjectId] = useState(fixedProject ?? ""),
    [sessionId, setSessionId] = useState(fixedSession ?? ""),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [success, setSuccess] = useState(false);
  async function assign() {
    setBusy(true);
    setError(undefined);
    setSuccess(false);
    try {
      await api.assignIntern({ internId, projectId, sessionId });
      setSuccess(true);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel title="Phân công thực tập">
      <p className="mb-3 text-sm text-slate-500">
        Intern phải đạt tuyển dụng. Hệ thống kiểm tra trạng thái và sức chứa
        trước khi phân công.
      </p>
      {Boolean(error) && <ErrorState error={error} />}{" "}
      {success && (
        <p
          role="status"
          className="mb-3 rounded-lg bg-green-50 p-3 text-green-700"
        >
          Phân công thành công. Intern có thể cập nhật Workspace để nhận dự án.
        </p>
      )}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void assign();
        }}
      >
        <CandidateSelect
          value={internId}
          onChange={setInternId}
          page={page}
          setPage={setPage}
        />
        {!fixedProject && (
          <AcademicPicker
            kind="projects"
            label="Dự án"
            value={projectId}
            onChange={setProjectId}
            required
            assignable
          />
        )}
        {!fixedSession && (
          <AcademicPicker
            kind="sessions"
            label="Phiên thực tập"
            value={sessionId}
            onChange={setSessionId}
            required
            assignable
          />
        )}
        <button
          className={buttonClass}
          disabled={busy || !internId || !projectId || !sessionId}
        >
          Phân công
        </button>
      </form>
    </Panel>
  );
}
function SessionExtras({ id }: { id: string }) {
  const instructors = useResource(
      useCallback((s: AbortSignal) => api.getInstructors(id, s), [id]),
    ),
    milestones = useResource(
      useCallback((s: AbortSignal) => api.getMilestones(id, s), [id]),
    );
  const [title, setTitle] = useState(""),
    [due, setDue] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
      instructors.reload();
      milestones.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {Boolean(error) && <ErrorState error={error} />}
      <Panel title="Giảng viên">
        {instructors.loading ? (
          <LoadingState />
        ) : instructors.error ? (
          <ErrorState error={instructors.error} onRetry={instructors.reload} />
        ) : (
          instructors.data?.map((i) => (
            <div key={i.userId} className="mb-2 flex justify-between text-sm">
              <span>{i.displayName}</span>
              <button
                className="text-red-600"
                disabled={busy}
                onClick={() =>
                  void act(() => api.removeInstructor(id, i.userId))
                }
              >
                Xóa giảng viên
              </button>
            </div>
          ))
        )}
        <button
          className={buttonClass}
          disabled={busy}
          onClick={() =>
            void act(() => api.addInstructor(id, getSessionUser()!.id))
          }
        >
          Thêm tôi làm giảng viên
        </button>
      </Panel>
      <Panel title="Mốc tiến độ">
        {milestones.loading ? (
          <LoadingState />
        ) : milestones.error ? (
          <ErrorState error={milestones.error} onRetry={milestones.reload} />
        ) : milestones.data?.length ? (
          milestones.data.map((m) => (
            <div
              key={m.id}
              className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"
            >
              <span>
                {m.title}
                <small className="block text-slate-400">
                  {m.dueDate
                    ? new Date(m.dueDate).toLocaleDateString("vi-VN")
                    : "Chưa có hạn"}
                </small>
              </span>
              <select
                aria-label={`Trạng thái ${m.title}`}
                className="rounded border p-1"
                disabled={busy}
                value={m.status}
                onChange={(e) =>
                  void act(() =>
                    api.saveMilestone(id, m.id, { status: e.target.value }),
                  )
                }
              >
                {["pending", "in_progress", "completed"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <button
                className="text-red-600"
                disabled={busy}
                onClick={() => void act(() => api.deleteMilestone(id, m.id))}
              >
                Xóa mốc
              </button>
            </div>
          ))
        ) : (
          <Empty>Chưa có mốc tiến độ.</Empty>
        )}
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void act(() =>
              api
                .saveMilestone(id, undefined, {
                  title,
                  ...(due ? { dueDate: new Date(due).toISOString() } : {}),
                })
                .then(() => {
                  setTitle("");
                  setDue("");
                }),
            );
          }}
        >
          <label className="block text-sm">
            Tên mốc
            <input
              required
              maxLength={256}
              className={`${inputClass} mt-1`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Hạn mốc
            <input
              type="datetime-local"
              className={`${inputClass} mt-1`}
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
          <button className={buttonClass} disabled={busy}>
            Thêm mốc
          </button>
        </form>
      </Panel>
    </>
  );
}
function OverviewCount({ kind }: { kind: api.AcademicKind }) {
  const data = useResource(
    useCallback(
      (s: AbortSignal) => api.listAcademic(kind, 1, "", "", s),
      [kind],
    ),
  );
  return (
    <Panel title={labels[kind]}>
      {data.loading ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : (
        <p className="text-3xl font-bold text-blue-600">{data.data?.total}</p>
      )}
      <Link
        className="mt-4 block text-sm text-blue-600"
        href={`/instructor/${kind}`}
      >
        Quản lý
      </Link>
    </Panel>
  );
}
export function InstructorOverview() {
  return (
    <>
      <PageTitle
        title="Instructor Workspace"
        subtitle="Theo dõi và quản lý chương trình thực tập"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {(["classes", "sessions", "projects"] as const).map((kind) => (
          <OverviewCount key={kind} kind={kind} />
        ))}
      </div>
      <div className="mt-5">
        <AssignmentForm />
      </div>
    </>
  );
}
