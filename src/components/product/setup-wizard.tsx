"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCircleCheck,
  IconRocket,
  IconX,
} from "@/components/v-intern/icons";
import {
  assignIntern,
  getAcademic,
  saveAcademic,
} from "@/lib/api/academic";
import {
  saveManagedTask,
  saveSprint,
  transitionSprint,
} from "@/lib/api/management";
import { errorMessage } from "@/lib/auth/api-client";
import { AcademicPicker } from "./academic-picker";
import { AssigneeSelector } from "./assignee-selector";
import { activateAcademic } from "@/lib/api/instructor-setup";
import { buttonClass, inputClass, Modal, StatusDot } from "./primitives";

const STEPS = ["Phiên thực tập", "Dự án", "Phân công sinh viên", "Sprint & task"];

interface WizSession { id: string; code: string; name: string }
interface WizProject { id: string; code: string; name: string; status: string }
interface AssignOutcome { userId: string; name: string; ok: boolean; message?: string }
interface WizSprint { id: string; code: string; name: string; status: string }
interface WizTask { id: string; title: string }

function toInput(value: string): string {
  return value;
}

export function SetupWizard({
  onClose,
  onFinished,
}: {
  onClose: () => void;
  onFinished: (sessionId: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);

  const [sessionMode, setSessionMode] = useState<"new" | "existing">("new");
  const [sessionId, setSessionId] = useState("");
  const [session, setSession] = useState<WizSession | null>(null);
  const [sCode, setSCode] = useState("");
  const [sName, setSName] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sStart, setSStart] = useState("");
  const [sEnd, setSEnd] = useState("");

  const [projectMode, setProjectMode] = useState<"new" | "existing">("new");
  const [projectPick, setProjectPick] = useState("");
  const [project, setProject] = useState<WizProject | null>(null);
  const [pCode, setPCode] = useState("");
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [activateProject, setActivateProject] = useState(true);

  const [assignees, setAssignees] = useState<string[]>([]);
  const [assigneeNames, setAssigneeNames] = useState<Record<string, string>>({});
  const [outcomes, setOutcomes] = useState<AssignOutcome[] | null>(null);

  const [sprint, setSprint] = useState<WizSprint | null>(null);
  const [spCode, setSpCode] = useState("");
  const [spName, setSpName] = useState("");
  const [spStart, setSpStart] = useState("");
  const [spEnd, setSpEnd] = useState("");
  const [activateSprint, setActivateSprint] = useState(true);
  const [wantTask, setWantTask] = useState(false);
  const [task, setTask] = useState<WizTask | null>(null);
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tPoints, setTPoints] = useState("");
  const [tPriority, setTPriority] = useState("medium");
  const [tDue, setTDue] = useState("");
  const [tAssignee, setTAssignee] = useState("");

  function fail(message: string) {
    setError(message);
    requestAnimationFrame(() => alertRef.current?.focus());
  }
  function requestClose() {
    if (touched || session || project || sprint) {
      if (!window.confirm("Bỏ dở thiết lập? Các bản ghi đã tạo vẫn được giữ lại.")) return;
    }
    onClose();
  }

  const validDates = (a: string, b: string) => !a || !b || a < b;

  async function submitSession() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (sessionMode === "existing") {
        if (!sessionId) throw new Error("Hãy chọn một phiên có sẵn.");
        const s = await getAcademic("sessions", sessionId);
        setSession({ id: s.id, code: s.code, name: s.name });
      } else {
        if (!sCode.trim() || !sName.trim()) throw new Error("Nhập mã và tên phiên.");
        if (!validDates(sStart, sEnd)) throw new Error("Ngày kết thúc phải sau ngày bắt đầu.");
        const s = await saveAcademic("sessions", undefined, {
          code: sCode.trim(),
          name: sName.trim(),
          description: sDesc.trim(),
          startDate: toInput(sStart),
          endDate: toInput(sEnd),
          status: "upcoming",
        });
        setSession({ id: s.id, code: s.code, name: s.name });
      }
      setStep(2);
    } catch (e) {
      fail(errorMessage(e));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }

  async function submitProject() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      let record: WizProject;
      if (projectMode === "existing") {
        if (!projectPick) throw new Error("Hãy chọn một dự án có sẵn.");
        const p = await getAcademic("projects", projectPick);
        record = { id: p.id, code: p.code, name: p.name, status: p.status };
      } else {
        if (!pCode.trim() || !pName.trim() || !pDesc.trim()) throw new Error("Nhập mã, tên và mô tả dự án.");
        const p = await saveAcademic("projects", undefined, {
          code: pCode.trim(),
          name: pName.trim(),
          description: pDesc.trim(),
          status: "draft",
        });
        record = { id: p.id, code: p.code, name: p.name, status: p.status };
      }
      if (activateProject && record.status !== "active") {
        try {
          const activated = await activateAcademic("projects", record.id);
          record = { ...record, status: activated.status };
        } catch (e) {
          setProject(record);
          fail(`Đã tạo dự án ${record.code} nhưng kích hoạt thất bại: ${errorMessage(e)} Dùng nút “Thử lại kích hoạt” , sẽ không tạo trùng.`);
          return;
        }
      }
      setProject(record);
      setStep(3);
    } catch (e) {
      fail(errorMessage(e));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }

  async function retryActivation() {
    if (!project || busy) return;
    setBusy(true);
    setError(null);
    try {
      const activated = await activateAcademic("projects", project.id);
      setProject({ ...project, status: activated.status });
      setStep(3);
    } catch (e) {
      fail(`Kích hoạt vẫn thất bại: ${errorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitAssignment() {
    if (!session || !project || busy || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const results: AssignOutcome[] = [];
      for (const userId of assignees) {
        try {
          await assignIntern({ internId: userId, projectId: project.id, sessionId: session.id });
          results.push({ userId, name: assigneeNames[userId] ?? userId.slice(0, 8), ok: true });
        } catch (e) {
          results.push({ userId, name: assigneeNames[userId] ?? userId.slice(0, 8), ok: false, message: errorMessage(e) });
        }
      }
      setOutcomes(results);
      setStep(4);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }

  async function submitSprint() {
    if (!session || !project || busy || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!spCode.trim() || !spName.trim() || !spStart || !spEnd) throw new Error("Nhập mã, tên và thời gian sprint.");
      if (!validDates(spStart, spEnd)) throw new Error("Ngày kết thúc sprint phải sau ngày bắt đầu.");
      const created = await saveSprint(undefined, {
        code: spCode.trim(),
        name: spName.trim(),
        projectId: project.id,
        sessionId: session.id,
        startDate: new Date(spStart + "Z").toISOString(),
        endDate: new Date(spEnd + "Z").toISOString(),
      });
      let status = created.status;
      if (activateSprint && status !== "active") {
        try {
          const moved = await transitionSprint(created.id, "active");
          status = moved.status;
        } catch (e) {
          setSprint({ id: created.id, code: created.code, name: created.name, status });
          fail(`Đã tạo sprint ${created.code} nhưng kích hoạt thất bại: ${errorMessage(e)} Dùng nút “Thử lại kích hoạt sprint” , sẽ không tạo trùng.`);
          return;
        }
      }
      setSprint({ id: created.id, code: created.code, name: created.name, status });
    } catch (e) {
      fail(errorMessage(e));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }

  async function retrySprintActivation() {
    if (!sprint || busy) return;
    setBusy(true);
    setError(null);
    try {
      const moved = await transitionSprint(sprint.id, "active");
      setSprint({ ...sprint, status: moved.status });
    } catch (e) {
      fail(`Kích hoạt sprint vẫn thất bại: ${errorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitTask() {
    if (!project || !sprint || busy || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!tTitle.trim()) throw new Error("Nhập tên task.");
      const saved = await saveManagedTask(undefined, {
        title: tTitle.trim(),
        description: tDesc.trim() || undefined,
        projectId: project.id,
        sprintId: sprint.id,
        ...(tPoints !== "" ? { storyPoints: Number(tPoints) } : {}),
        priority: tPriority,
        ...(tDue ? { dueDate: new Date(tDue + "Z").toISOString() } : {}),
        ...(tAssignee ? { assigneeId: tAssignee } : {}),
      });
      setTask({ id: saved.id, title: saved.title });
      setStep(5);
    } catch (e) {
      fail(errorMessage(e));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }

  const assignedOk = (outcomes ?? []).filter((o) => o.ok);
  const assignedFail = (outcomes ?? []).filter((o) => !o.ok);

  return (
    <Modal title="Khởi tạo đợt thực tập" onClose={requestClose}>
      <p className="mb-3 text-caption text-muted-foreground" aria-live="polite">
        {step <= 4 ? `Bước ${step} / 4` : "Hoàn tất"}
      </p>
      <ol aria-label="Tiến trình thiết lập" className="mb-5 flex gap-1 overflow-x-auto sm:gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const current = step === n;
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-caption sm:text-caption ${current ? "bg-primary font-bold text-primary-foreground" : done ? "bg-success-subtle font-semibold text-success" : "bg-background text-muted-foreground"}`}
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-caption ${current ? "bg-card/25" : done ? "bg-success text-primary-foreground" : "bg-muted"}`}>
                {done ? "✓" : n}
              </span>
              <span className="truncate">{label}</span>
            </li>
          );
        })}
      </ol>

      {Boolean(error) && (
        <p ref={alertRef} tabIndex={-1} role="alert" className="mb-4 rounded-control bg-destructive-subtle p-3 text-body text-destructive focus:outline-none">
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div role="group" aria-label="Cách chọn phiên" className="flex gap-2 text-body">
            {(["new", "existing"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={sessionMode === m} onClick={() => setSessionMode(m)} className={`rounded-md border px-3 py-2 ${sessionMode === m ? "border-primary bg-accent font-semibold text-primary" : "border-border"}`}>
                {m === "new" ? "Tạo phiên mới" : "Chọn phiên có sẵn"}
              </button>
            ))}
          </div>
          {sessionMode === "new" ? (
            <>
              <label className="block text-body">Mã phiên<input required maxLength={64} className={`${inputClass} mt-1`} value={sCode} onChange={(e) => { setTouched(true); setSCode(e.target.value); }} /></label>
              <label className="block text-body">Tên phiên<input required maxLength={256} className={`${inputClass} mt-1`} value={sName} onChange={(e) => { setTouched(true); setSName(e.target.value); }} /></label>
              <label className="block text-body">Mô tả<textarea rows={2} maxLength={2000} className={`${inputClass} mt-1`} value={sDesc} onChange={(e) => { setTouched(true); setSDesc(e.target.value); }} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-body">Bắt đầu<input required type="datetime-local" className={`${inputClass} mt-1`} value={sStart} onChange={(e) => { setTouched(true); setSStart(e.target.value); }} /></label>
                <label className="block text-body">Kết thúc<input required type="datetime-local" className={`${inputClass} mt-1`} value={sEnd} onChange={(e) => { setTouched(true); setSEnd(e.target.value); }} /></label>
              </div>
            </>
          ) : (
            <AcademicPicker kind="sessions" label="Phiên thực tập" value={sessionId} onChange={(v) => { setTouched(true); setSessionId(v); }} />
          )}
          <div className="flex justify-end gap-2">
            <button className={buttonClass} disabled={busy || (sessionMode === "new" ? !sCode.trim() || !sName.trim() || !sStart || !sEnd : !sessionId)} onClick={() => void submitSession()}>
              {busy ? "Đang lưu…" : <>Tiếp tục <IconArrowRight size={15} className="inline" /></>}
            </button>
          </div>
        </div>
      )}

      {step === 2 && session && (
        <div className="space-y-4">
          <p className="rounded-control bg-accent p-3 text-body text-foreground">Phiên: <strong>{session.code} · {session.name}</strong> , các bước sau dùng phiên này, không cần chọn lại.</p>
          <div role="group" aria-label="Cách chọn dự án" className="flex gap-2 text-body">
            {(["new", "existing"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={projectMode === m} onClick={() => setProjectMode(m)} className={`rounded-md border px-3 py-2 ${projectMode === m ? "border-primary bg-accent font-semibold text-primary" : "border-border"}`}>
                {m === "new" ? "Tạo dự án mới" : "Chọn dự án có sẵn"}
              </button>
            ))}
          </div>
          {projectMode === "new" ? (
            <>
              <label className="block text-body">Mã dự án<input required maxLength={64} className={`${inputClass} mt-1`} value={pCode} onChange={(e) => { setTouched(true); setPCode(e.target.value); }} /></label>
              <label className="block text-body">Tên dự án<input required maxLength={256} className={`${inputClass} mt-1`} value={pName} onChange={(e) => { setTouched(true); setPName(e.target.value); }} /></label>
              <label className="block text-body">Mô tả<input required maxLength={4000} className={`${inputClass} mt-1`} value={pDesc} onChange={(e) => { setTouched(true); setPDesc(e.target.value); }} /></label>
            </>
          ) : (
            <AcademicPicker kind="projects" label="Dự án" value={projectPick} onChange={(v) => { setTouched(true); setProjectPick(v); }} />
          )}
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-primary bg-accent/50 p-3 text-body">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={activateProject} onChange={(e) => setActivateProject(e.target.checked)} />
            <span><strong>Kích hoạt dự án ngay sau khi tạo/chọn.</strong><span className="mt-0.5 block text-caption text-muted-foreground">Chỉ dự án đang hoạt động mới phân công được. Bỏ tick để giữ trạng thái nháp.</span></span>
          </label>
          {project && project.status !== "active" && (
            <button className="rounded-md border border-warning bg-warning-subtle px-3 py-2 text-body font-semibold text-warning" disabled={busy} onClick={() => void retryActivation()}>
              Thử lại kích hoạt
            </button>
          )}
          <div className="flex justify-between gap-2">
            <button className="rounded-md border border-primary px-4 py-2 text-body text-foreground" disabled={busy} onClick={() => setStep(1)}><IconArrowLeft size={15} className="mr-1 inline" />Quay lại</button>
            <button className={buttonClass} disabled={busy || (projectMode === "new" ? !pCode.trim() || !pName.trim() || !pDesc.trim() : !projectPick)} onClick={() => void submitProject()}>
              {busy ? "Đang lưu…" : <>Tiếp tục <IconArrowRight size={15} className="inline" /></>}
            </button>
          </div>
        </div>
      )}

      {step === 3 && session && project && (
        <div className="space-y-4">
          <p className="rounded-control bg-accent p-3 text-body text-foreground">Phân công vào <strong>{project.code}</strong> · <strong>{session.code}</strong> , không cần chọn lại.</p>
          <AssigneeSelector
            value={assignees}
            multiple
            onChange={(v) => { setTouched(true); setAssignees(Array.isArray(v) ? v : v ? [v] : []); }}
            onSelectionChange={(items) => setAssigneeNames(Object.fromEntries(items.map((i) => [i.userId, i.name])))}
          />
          <div className="flex flex-wrap justify-between gap-2">
            <button className="rounded-md border border-primary px-4 py-2 text-body text-foreground" disabled={busy} onClick={() => setStep(2)}><IconArrowLeft size={15} className="mr-1 inline" />Quay lại</button>
            <span className="flex gap-2">
              <button className="rounded-md border border-primary px-4 py-2 text-body text-foreground" disabled={busy} onClick={() => { setOutcomes([]); setStep(4); }}>Bỏ qua</button>
              <button className={buttonClass} disabled={busy || !assignees.length} onClick={() => void submitAssignment()}>
                {busy ? "Đang phân công…" : `Phân công ${assignees.length} sinh viên`}
              </button>
            </span>
          </div>
        </div>
      )}

      {step === 4 && session && project && (
        <div className="space-y-4">
          <p className="rounded-control bg-accent p-3 text-body text-foreground">Sprint thuộc <strong>{project.code}</strong> · <strong>{session.code}</strong> , đã kế thừa, không cần chọn lại.</p>
          {!sprint ? (
            <>
              <label className="block text-body">Mã Sprint<input required maxLength={64} className={`${inputClass} mt-1`} value={spCode} onChange={(e) => { setTouched(true); setSpCode(e.target.value); }} /></label>
              <label className="block text-body">Tên Sprint<input required maxLength={256} className={`${inputClass} mt-1`} value={spName} onChange={(e) => { setTouched(true); setSpName(e.target.value); }} /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-body">Bắt đầu (UTC)<input required type="datetime-local" className={`${inputClass} mt-1`} value={spStart} onChange={(e) => { setTouched(true); setSpStart(e.target.value); }} /></label>
                <label className="block text-body">Kết thúc (UTC)<input required type="datetime-local" className={`${inputClass} mt-1`} value={spEnd} onChange={(e) => { setTouched(true); setSpEnd(e.target.value); }} /></label>
              </div>
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-primary bg-accent/50 p-3 text-body">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={activateSprint} onChange={(e) => setActivateSprint(e.target.checked)} />
                <span><strong>Kích hoạt Sprint ngay.</strong><span className="mt-0.5 block text-caption text-muted-foreground">Sprint đang hoạt động mới giao được task.</span></span>
              </label>
              <div className="flex justify-between gap-2">
                <button className="rounded-md border border-primary px-4 py-2 text-body text-foreground" disabled={busy} onClick={() => setStep(3)}><IconArrowLeft size={15} className="mr-1 inline" />Quay lại</button>
                <button className={buttonClass} disabled={busy || !spCode.trim() || !spName.trim() || !spStart || !spEnd} onClick={() => void submitSprint()}>
                  {busy ? "Đang lưu…" : "Tạo Sprint"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 text-body"><IconCircleCheck size={18} className="text-success" /> Sprint <strong>{sprint.code}</strong> · <StatusDot tone={sprint.status === "active" ? "green" : "gray"}>{sprint.status}</StatusDot></p>
              {sprint.status !== "active" && (
                <button className="rounded-md border border-warning bg-warning-subtle px-3 py-2 text-body font-semibold text-warning" disabled={busy} onClick={() => void retrySprintActivation()}>
                  Thử lại kích hoạt sprint
                </button>
              )}
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-primary p-3 text-body">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={wantTask} onChange={(e) => setWantTask(e.target.checked)} />
                <span><strong>Thêm task đầu tiên</strong> <span className="text-muted-foreground">(không bắt buộc)</span></span>
              </label>
              {wantTask && !task && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <label className="block text-body">Tên task<input required maxLength={256} className={`${inputClass} mt-1`} value={tTitle} onChange={(e) => { setTouched(true); setTTitle(e.target.value); }} /></label>
                  <label className="block text-body">Mô tả<textarea rows={2} maxLength={4000} className={`${inputClass} mt-1`} value={tDesc} onChange={(e) => { setTouched(true); setTDesc(e.target.value); }} /></label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block text-body">Story points<input type="number" min={0} max={1000} className={`${inputClass} mt-1`} value={tPoints} onChange={(e) => { setTouched(true); setTPoints(e.target.value); }} /></label>
                    <label className="block text-body">Ưu tiên<select className={`${inputClass} mt-1`} value={tPriority} onChange={(e) => { setTouched(true); setTPriority(e.target.value); }}><option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="critical">Khẩn cấp</option></select></label>
                    <label className="block text-body">Hạn (UTC)<input type="datetime-local" className={`${inputClass} mt-1`} value={tDue} onChange={(e) => { setTouched(true); setTDue(e.target.value); }} /></label>
                  </div>
                  <label className="block text-body">Giao cho sinh viên vừa phân công<select className={`${inputClass} mt-1`} value={tAssignee} onChange={(e) => { setTouched(true); setTAssignee(e.target.value); }}>
                    <option value="">Chưa giao</option>
                    {assignedOk.map((o) => <option key={o.userId} value={o.userId}>{o.name}</option>)}
                  </select></label>
                  <button className={buttonClass} disabled={busy || !tTitle.trim()} onClick={() => void submitTask()}>{busy ? "Đang lưu…" : "Tạo task"}</button>
                </div>
              )}
              {task && <p className="flex items-center gap-2 text-body"><IconCircleCheck size={18} className="text-success" /> Task <strong>{task.title}</strong> đã tạo.</p>}
              <div className="flex justify-between gap-2">
                <button className="rounded-md border border-primary px-4 py-2 text-body text-foreground" disabled={busy} onClick={() => setSprint(null)}><IconArrowLeft size={15} className="mr-1 inline" />Tạo sprint khác</button>
                <button className={buttonClass} disabled={busy} onClick={() => setStep(5)}>Hoàn tất<IconArrowRight size={15} className="ml-1 inline" /></button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 5 && session && project && sprint && (
        <div className="space-y-3">
          <h3 className="text-section font-bold text-foreground">Tóm tắt đợt thực tập</h3>
          <dl className="space-y-2 rounded-control border border-primary/70 p-4 text-body">
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Phiên</dt><dd className="font-semibold text-foreground">{session.code} · {session.name}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Dự án</dt><dd className="font-semibold text-foreground">{project.code} · {project.name}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Trạng thái dự án</dt><dd><StatusDot tone={project.status === "active" ? "green" : "amber"}>{project.status}</StatusDot></dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Sinh viên đã phân công</dt><dd className="font-semibold text-foreground">{assignedOk.length}</dd></div>
            {assignedFail.map((o) => (
              <div key={o.userId} className="flex justify-between gap-3 text-caption"><dt className="text-muted-foreground">{o.name}</dt><dd className="text-destructive">Thất bại: {o.message}</dd></div>
            ))}
            {!outcomes?.length && <div className="text-caption text-muted-foreground">Bỏ qua phân công ở bước 3.</div>}
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Sprint</dt><dd className="font-semibold text-foreground">{sprint.code} · {sprint.name}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Trạng thái sprint</dt><dd><StatusDot tone={sprint.status === "active" ? "green" : "gray"}>{sprint.status}</StatusDot></dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Task đầu tiên</dt><dd className="font-semibold text-foreground">{task ? task.title : "Chưa tạo (có thể tạo sau)"}</dd></div>
          </dl>
          <div className="flex flex-wrap justify-end gap-2">
            <button className="rounded-md border border-primary px-4 py-2 text-body text-foreground" onClick={requestClose}>Đóng</button>
            <Link href={`/instructor/sessions/${session.id}`} className={buttonClass} onClick={() => onFinished(session.id)}>
              <IconRocket size={16} /> Vào không gian làm việc
            </Link>
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-start">
        <button type="button" className="inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground" onClick={requestClose}>
          <IconX size={14} /> Đóng wizard
        </button>
      </div>
    </Modal>
  );
}
