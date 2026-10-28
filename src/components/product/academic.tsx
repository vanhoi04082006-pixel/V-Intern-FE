"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Users, Layers, CalendarDays, Clock, BookOpen, Database } from "lucide-react";
import { Person, exportCsv } from "./identity";
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
  PageMeta,
  Pager,
  Panel,
  StatusDot,
  AvatarStack,
  ProgressBar,
} from "./primitives";
import { AcademicPicker } from "./academic-picker";
import { InstructorPicker } from "./instructor-picker";
import { ProjectChanges } from "./project-changes";
import { AcademicMetrics, AcademicInsights } from "./academic-insights";
import { ClassOperations } from './class-operations';
import { AssigneeSelector } from "./assignee-selector";
import { RowMenu } from './instructor-dashboard';
import { ActivateButton } from './instructor-onboarding';
import { SprintForm } from "./sprint-management";
const statusNames:Record<string,string>={active:"Đang hoạt động",upcoming:"Sắp bắt đầu",paused:"Tạm dừng",recruiting:"Đang tuyển",draft:"Bản nháp",ending:"Sắp kết thúc",completed:"Hoàn thành",cancelled:"Đã hủy",archived:"Đã lưu trữ"};
export function AcademicStatus({ status }: { status: string }) {
  const tone = status === "active" || status === "recruiting" ? "green" : status === "paused" || status === "ending" || status === "draft" ? "amber" : status === "upcoming" ? "blue" : status === "cancelled" || status === "archived" ? "red" : "gray";
  return <StatusDot tone={tone as "green"}>{statusNames[status] ?? status}</StatusDot>;
}
const labels = {
  classes: "Lớp học",
  sessions: "Phiên thực tập",
  projects: "Thư viện dự án",
};
export function AcademicList({ kind }: { kind: api.AcademicKind }) {
  const [revision,setRevision] = useState(0);
  const [sessionId,setSessionId] = useState(''),[projectId,setProjectId] = useState(''),[leadInstructorId,setLeadInstructorId] = useState(''),[domainCategory,setDomainCategory] = useState(''),[technology,setTechnology] = useState('');
  const [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [selected, setSelected] = useState<string>(),
    [create, setCreate] = useState(false);
  const data = useResource(
    useCallback(
      (signal: AbortSignal) => api.listAcademic(kind, page, q, status, signal,{
        ...(kind==='classes'&&sessionId?{sessionId}:{}),...(kind==='sessions'&&projectId?{projectId}:{}),...(kind!=='projects'&&leadInstructorId?{leadInstructorId}:{}),...(kind==='projects'&&domainCategory?{domainCategory}:{}),...(kind==='projects'&&technology?{technology}:{})
      }),
      [kind, page, q, status,sessionId,projectId,leadInstructorId,domainCategory,technology],
    ),
  );
  const projectOptions = useResource(useCallback((signal:AbortSignal)=>kind==='projects'?api.getProjectFilterOptions(signal):Promise.resolve({domains:[],technologies:[]}),[kind]));
  const ids = data.data?.items.map(x=>x.id).join(',') ?? '';
  const summaries = useResource(useCallback((signal: AbortSignal) => ids ? api.getAcademicSummaries(kind,ids,signal) : Promise.resolve([]), [kind,ids]));
  return (
    <>
      <PageTitle
        title={labels[kind]}
        subtitle={kind === "classes" ? "Quản lý lớp học, phân công giảng viên, theo dõi sĩ số và hoạt động học tập của sinh viên." : undefined}
      />
      {kind !== "classes" && <PageMeta items={kind === "sessions"
        ? [
          { icon: Users, label: "Vai trò", value: "Giảng viên / Technical Lead" },
          { icon: Layers, label: "Hệ thống", value: "V-Intern Platform" },
          { icon: CalendarDays, label: "Học kỳ hiện tại", value: data.data?.items[0]?.code ?? "Chưa có" },
          { icon: Clock, label: "Cập nhật lúc", value: new Date().toLocaleString("vi-VN") },
        ]
        : [
          { icon: Users, label: "Vai trò", value: "Giảng viên / Technical Lead" },
          { icon: Layers, label: "Hệ thống", value: "V-Intern Platform" },
          { icon: BookOpen, label: "Kho hiện tại", value: `${data.data?.total ?? 0} dự án` },
          { icon: Database, label: "Danh mục", value: `${projectOptions.data?.domains.length ?? 0} lĩnh vực` },
          { icon: Clock, label: "Cập nhật lúc", value: new Date().toLocaleString("vi-VN") },
        ]} />}
      <AcademicMetrics key={kind+':'+revision+':'+data.data?.total} kind={kind}/>
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,2.5fr)_minmax(340px,1fr)]">
        <div className="min-w-0">
        <Panel title={`Danh sách ${labels[kind].toLowerCase()}`} action={<span className="flex items-center gap-2"><button className="rounded-md border border-primary px-3 py-2 text-caption text-primary hover:bg-accent" disabled={!data.data?.items.length} onClick={()=>exportCsv(kind+".csv",["Mã","Tên","Trạng thái"],(data.data?.items??[]).map(x=>[x.code,x.name,x.status]))}>Xuất trang</button><button className={buttonClass} onClick={() => setCreate(true)}>+ Tạo {kind === "classes" ? "lớp học" : kind === "sessions" ? "phiên mới" : "project mới"}</button></span>}>
          {Boolean(summaries.error) && <ErrorState error={summaries.error} onRetry={summaries.reload}/>}
          <div className="mb-4 grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                <option key={s} value={s}>{statusNames[s]??({beginner:"Thấp",intermediate:"Trung bình",advanced:"Cao"} as Record<string,string>)[s]??s}</option>
              ))}
            </select>
            {kind==='classes'&&<AcademicPicker compact kind="sessions" label="Lọc phiên thực tập" value={sessionId} onChange={v=>{setSessionId(v);setPage(1);}}/>}
            {kind==='sessions'&&<AcademicPicker compact kind="projects" label="Lọc dự án" value={projectId} onChange={v=>{setProjectId(v);setPage(1);}}/>}
            {kind!=='projects'&&<InstructorPicker compact label="Lọc giảng viên" value={leadInstructorId} onChange={v=>{setLeadInstructorId(v);setPage(1);}}/>}
            {kind==='projects'&&<><select aria-label="Lĩnh vực dự án" className={inputClass} value={domainCategory} onChange={e=>{setDomainCategory(e.target.value);setPage(1);}}><option value="">Tất cả lĩnh vực</option>{projectOptions.data?.domains.map(v=><option key={v} value={v}>{v}</option>)}</select><select aria-label="Công nghệ dự án" className={inputClass} value={technology} onChange={e=>{setTechnology(e.target.value);setPage(1);}}><option value="">Tất cả công nghệ</option>{projectOptions.data?.technologies.map(v=><option key={v} value={v}>{v}</option>)}</select></>}
          </div>
          {Boolean(projectOptions.error)&&<ErrorState error={projectOptions.error} onRetry={projectOptions.reload}/>}
          {data.loading ? (
            <LoadingState />
          ) : data.error ? (
            <ErrorState error={data.error} onRetry={data.reload} />
          ) : (
            data.data && (
              <>
                {data.data.items.length ? (
                  <div className="overflow-x-auto">
                    <table className="academic-table w-full text-left text-body">
                      <colgroup>{(kind==='classes'?[70,145,85,48,100,90,100,125,90]:kind==='projects'?[95,175,85,120,55,100,85,90]:[120,170,55,130,85,85,85,100,90]).map((width,i)=><col key={i} style={{width}}/>)}</colgroup>
                      <thead className="bg-background">
                        <tr>
                          {(kind === 'projects' ? ['Mã dự án','Tên dự án','Lĩnh vực','Công nghệ','Sinh viên','Trạng thái','Độ khó','Hành động'] : kind === 'classes' ? ['Mã lớp','Tên lớp','Phiên thực tập','Sinh viên','Lịch học','Tiến độ','Trạng thái','Giảng viên phụ trách','Hành động'] : ['Mã phiên','Tên phiên','Sinh viên','Giảng viên phụ trách','Ngày bắt đầu','Ngày kết thúc','Tiến độ','Trạng thái','Hành động']).map(label=><th key={label} className="p-3">{label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {data.data.items.map((x) => {
                          const summary=summaries.data?.find(s=>s.id===x.id);
                          const members=<td className="p-3"><AvatarStack count={summary?.memberCount ?? 0} /></td>;
                          const responsible=<td className="p-3">{summary?.responsibleName?<Person name={summary.responsibleName}/>:<span className="text-muted-foreground">Chưa phân công</span>}</td>;
                          const date=(value:string|null)=>value?new Date(value).toLocaleDateString('vi-VN'):'Chưa có';
                          return <tr key={x.id} className="border-b border-primary">
                            <td className="p-3 font-semibold whitespace-nowrap text-primary">{x.code}</td>
                            <td className="p-3"><strong className="block text-foreground">{x.name}</strong>{x.description&&<p className="mt-1 max-w-36 truncate text-caption text-muted-foreground" title={x.description}>{x.description}</p>}</td>
                            {kind==='projects'?<><td className="p-3"><Badge>{x.domainCategory??'Chưa phân loại'}</Badge></td><td className="p-3 text-caption">{x.technologies.join(', ')||'Chưa có'}</td>{members}<td className="p-3"><AcademicStatus status={x.status} /></td><td className="p-3"><Badge>{{beginner:'Thấp',intermediate:'Trung bình',advanced:'Cao'}[x.difficulty??'']??'Chưa có'}</Badge></td></>:kind==='classes'?<><td className="p-3 text-primary">{summary?.sessionName??'Chưa gắn phiên'}</td>{members}<td className="p-3 whitespace-nowrap">{x.meetingSchedule??'Chưa có lịch'}<span className="mt-1 block text-caption text-muted-foreground">{x.meetingLocation}</span></td><td className="p-3"><ProgressBar value={x.progress} label={`${x.progress}%`} /></td><td className="p-3"><AcademicStatus status={x.status} /></td>{responsible}</>:<>{members}{responsible}<td className="p-3 whitespace-nowrap">{date(x.startDate)}</td><td className="p-3 whitespace-nowrap">{date(x.endDate)}</td><td className="p-3">{summary?.taskCount?<ProgressBar value={Math.round((summary.doneCount??0)/summary.taskCount*100)} />:<span className="text-caption text-muted-foreground">Chưa có task</span>}</td><td className="p-3"><AcademicStatus status={x.status} /></td></>}
                            <td className="whitespace-nowrap p-3"><button className="rounded border border-primary px-3 py-1 text-caption text-primary hover:bg-accent" aria-label={`Chi tiết ${x.code}`} onClick={()=>setSelected(x.id)}>Xem chi tiết</button> {(kind==='sessions'||kind==='projects')&&<ActivateButton kind={kind} id={x.id} status={x.status} onChanged={()=>{data.reload();summaries.reload();setRevision(r=>r+1);}} />} <RowMenu label={`Thao tác ${x.code}`} onOpen={()=>setSelected(x.id)} />{kind==='sessions'&&<Link className="mt-2 block text-caption text-primary" href={`/instructor/sessions/${x.id}`}>Mở phiên</Link>}</td>
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>Chưa có dữ liệu phù hợp.</Empty>
                )}
                <Pager {...data.data} unit={kind === "classes" ? "lớp học" : kind === "sessions" ? "phiên" : "dự án"} onChange={setPage} />
              </>
            )
          )}
        </Panel>
        {kind === 'classes' && <ClassOperations key={revision} />}
        </div>
        <AcademicInsights key={kind+':'+revision+':'+data.data?.total} kind={kind}/>
      </div>
      <AcademicBottom kind={kind} items={data.data?.items ?? []} summaries={summaries.data ?? []} onOpen={setSelected} />
      {create && (
        <Modal title={`Tạo ${labels[kind]}`} onClose={() => setCreate(false)}>
          <AcademicForm
            kind={kind}
            onSaved={() => {
              setCreate(false);
              data.reload();
              setRevision(r=>r+1);
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
          onChanged={()=>{data.reload();summaries.reload();setRevision(r=>r+1);}}
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
      meetingSchedule: initial?.meetingSchedule ?? "",
      meetingLocation: initial?.meetingLocation ?? "",
      progress: String(initial?.progress ?? 0),
      code: initial?.code ?? "",
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      status: initial?.status ?? api.academicStatuses[kind][0],
      startDate: initial?.startDate?.slice(0, 16) ?? "",
      endDate: initial?.endDate?.slice(0, 16) ?? "",
      leadInstructorId: initial?.leadInstructorId ?? getSessionUser()?.id ?? "",
      mentorId: initial?.mentorId ?? getSessionUser()?.id ?? "",
      domainCategory: initial?.domainCategory ?? "",
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
    <label key={key} className="block text-body font-medium">
      {label}
      <input
        className={`${inputClass} mt-1`}
        type={type}
        required={required}
        maxLength={max}
        min={key === "progress" ? 0 : undefined}
        max={key === "progress" ? 100 : undefined}
        step={key === "progress" ? 1 : undefined}
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
      {kind === "classes" && <div className="grid gap-3 sm:grid-cols-3">{field("meetingSchedule", "Lịch học", "text", false, 128)}{field("meetingLocation", "Địa điểm / Hình thức học", "text", false, 128)}{field("progress", "Tiến độ (%)", "number", true)}</div>}
      <label className="block text-body">
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
      <label className="block text-body">
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
            <option key={s} value={s}>{statusNames[s]??({beginner:"Thấp",intermediate:"Trung bình",advanced:"Cao"} as Record<string,string>)[s]??s}</option>
          ))}
        </select>
      </label>
      {kind === "projects" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("domainCategory", "Lĩnh vực", "text", false, 128)}
            {field("technologies", "Công nghệ (phân cách bằng dấu phẩy)")}
            {field("capacity", "Sức chứa", "number")}
            <label className="block text-body">
              Độ khó
              <select
                className={`${inputClass} mt-1`}
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
              >
                {["beginner", "intermediate", "advanced"].map((s) => (
                  <option key={s} value={s}>{statusNames[s]??({beginner:"Thấp",intermediate:"Trung bình",advanced:"Cao"} as Record<string,string>)[s]??s}</option>
                ))}
              </select>
            </label>
          </div>
          <InstructorPicker
            label="Mentor dự án"
            value={form.mentorId}
            onChange={(value) => setForm({ ...form, mentorId: value })}
          />
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
      {(kind === "sessions" || kind === "classes") && (
        <InstructorPicker
          label="Giảng viên phụ trách"
          value={form.leadInstructorId}
          onChange={(value) => setForm({ ...form, leadInstructorId: value })}
        />
      )}
      <button className={buttonClass} disabled={busy}>
        {busy ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
export function AcademicDetail({
  kind,
  id,
  onClose,
  onChanged,
  embedded = false,
}: {
  kind: api.AcademicKind;
  id: string;
  onClose: () => void;
  onChanged: () => void;
  embedded?: boolean;
}) {
  const entity = useResource(
    useCallback((s: AbortSignal) => api.getAcademic(kind, id, s), [kind, id]),
  );
  const [edit, setEdit] = useState(false);
  const [sprintOpen, setSprintOpen] = useState(false);
  const content = (
    <>
      {entity.loading ? (
        <LoadingState />
      ) : entity.error ? (
        <ErrorState error={entity.error} onRetry={entity.reload} />
      ) : (
        entity.data && (
          <div className="space-y-5">
            <h3 className="font-bold text-section">{entity.data.name}</h3>
            <p className="text-body">
              {entity.data.description ?? "Chưa có mô tả."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{entity.data.status}</Badge>
              <button className={buttonClass} onClick={() => setEdit(!edit)}>
                {edit ? "Đóng chỉnh sửa" : "Chỉnh sửa"}
              </button>
              {kind === "projects" && (
                <button className="rounded-md border border-primary px-4 py-2 text-body font-semibold text-primary hover:bg-accent" onClick={() => setSprintOpen(true)}>
                  Tạo Sprint
                </button>
              )}
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
            <Members kind={kind} id={id} onChanged={onChanged} />
            {kind === "sessions" && <SessionExtras id={id} />}
            {kind === "projects" && <ProjectChanges id={id} />}
            <AssignmentForm
              fixedProject={kind === "projects" ? id : undefined}
              fixedSession={kind === "sessions" ? id : undefined}
            />
            {kind === "projects" && sprintOpen && entity.data && (
              <Modal title={`Tạo Sprint cho ${entity.data.code}`} onClose={() => setSprintOpen(false)}>
                <SprintForm fixedProjectId={id} fixedProjectName={`${entity.data.name} · ${entity.data.code}`} onSaved={() => { setSprintOpen(false); onChanged(); }} />
              </Modal>
            )}
          </div>
        )
      )}
    </>
  );
  return embedded ? (
    <Panel title={`Chi tiết ${labels[kind]}`}>{content}</Panel>
  ) : (
    <Modal title={`Chi tiết ${labels[kind]}`} onClose={onClose}>
      {content}
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
            <label className="block text-body">
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
function Members({ kind, id, onChanged }: { kind: api.AcademicKind; id: string; onChanged: () => void }) {
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
      onChanged();
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
              className="flex items-center justify-between gap-3 rounded-control bg-background p-3 text-body"
            >
              <span>
                {m.displayName}
                <small className="block break-all text-muted-foreground">
                  {m.email}
                </small>
              </span>
              {kind !== "projects" && (
                <button
                  disabled={busy}
                  className="text-destructive"
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
      <p className="mb-3 text-body text-muted-foreground">
        Intern phải đạt tuyển dụng. Hệ thống kiểm tra trạng thái và sức chứa
        trước khi phân công.
      </p>
      {Boolean(error) && <ErrorState error={error} />}{" "}
      {success && (
        <p
          role="status"
          className="mb-3 rounded-control bg-success-subtle p-3 text-success"
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
        <AssigneeSelector
          value={internId}
          onChange={(v) => setInternId(Array.isArray(v) ? v[0] ?? "" : v)}
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
    [instructorId, setInstructorId] = useState(""),
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
        <div className="mb-4 space-y-3">
          <InstructorPicker
            label="Giảng viên phiên"
            value={instructorId}
            onChange={setInstructorId}
          />
          <button
            className={buttonClass}
            disabled={busy || !instructorId}
            onClick={() => void act(() => api.addInstructor(id, instructorId))}
          >
            Thêm giảng viên đã chọn
          </button>
        </div>
        {instructors.loading ? (
          <LoadingState />
        ) : instructors.error ? (
          <ErrorState error={instructors.error} onRetry={instructors.reload} />
        ) : (
          instructors.data?.map((i) => (
            <div key={i.userId} className="mb-2 flex justify-between text-body">
              <span>{i.displayName}</span>
              <button
                className="text-destructive"
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
              className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-control bg-background p-3 text-body"
            >
              <span>
                {m.title}
                <small className="block text-muted-foreground">
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
                  <option key={s} value={s}>{statusNames[s]??({beginner:"Thấp",intermediate:"Trung bình",advanced:"Cao"} as Record<string,string>)[s]??s}</option>
                ))}
              </select>
              <button
                className="text-destructive"
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
          <label className="block text-body">
            Tên mốc
            <input
              required
              maxLength={256}
              className={`${inputClass} mt-1`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-body">
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
function AcademicBottom({ kind, items, summaries, onOpen }: { kind: api.AcademicKind; items: api.AcademicEntity[]; summaries: { id: string; responsibleName: string | null; sessionName: string | null; memberCount: number; taskCount: number | null; doneCount: number | null }[]; onOpen: (id: string) => void }) {
  if (kind === "classes") {
    const rows = items.map(x => {
      const s = summaries.find(v => v.id === x.id);
      const rate = s?.taskCount ? Math.round((s.doneCount ?? 0) / s.taskCount * 100) : 0;
      return { x, members: s?.memberCount ?? 0, rate };
    }).sort((a, b) => b.rate - a.rate).slice(0, 5);
    return <div className="mt-3"><Panel title="Hiệu quả lớp học (Top 5)" action={<span className="text-caption text-muted-foreground">Theo tỷ lệ hoàn thành</span>}>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-caption"><thead className="bg-background"><tr>{["#", "Mã lớp", "Tên lớp", "Sinh viên", "Tỷ lệ HT", "Xu hướng"].map(h => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-primary">{rows.map(({ x, members, rate }, i) => <tr key={x.id}><td className="px-2 py-2">{i + 1}</td><td className="px-2 py-2 font-semibold text-primary">{x.code}</td><td className="px-2 py-2 text-foreground">{x.name}</td><td className="px-2 py-2">{members}</td><td className="px-2 py-2"><ProgressBar value={rate} /></td><td className="px-2 py-2 text-muted-foreground">Chưa có dữ liệu</td></tr>)}</tbody></table></div> : <Empty>Chưa có dữ liệu lớp học.</Empty>}
    </Panel></div>;
  }
  if (kind === "sessions") {
    const rows = items.filter(x => x.status === "ending" || (x.status === "active" && (summaries.find(s => s.id === x.id)?.taskCount ?? 0) === 0)).slice(0, 5);
    return <div className="mt-3"><Panel title="Cảnh báo & phiên cần chú ý" action={<Link href="/instructor/sessions" className="text-caption text-primary">Xem tất cả</Link>}>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-caption"><thead className="bg-background"><tr>{["#", "Mã phiên", "Vấn đề", "Mức độ", "Ngày kết thúc", "Hành động"].map(h => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-primary">{rows.map((x, i) => <tr key={x.id}><td className="px-2 py-2">{i + 1}</td><td className="px-2 py-2 font-semibold text-primary">{x.code}</td><td className="px-2 py-2">{x.status === "ending" ? "Sắp kết thúc" : "Chưa có task"}</td><td className="px-2 py-2"><StatusDot tone={x.status === "ending" ? "red" : "amber"}>{x.status === "ending" ? "Cao" : "Trung bình"}</StatusDot></td><td className="whitespace-nowrap px-2 py-2">{x.endDate ? new Date(x.endDate).toLocaleDateString("vi-VN") : "Chưa có"}</td><td className="px-2 py-2"><button className="rounded border border-primary px-2 py-1 text-primary" onClick={() => onOpen(x.id)}>Xem</button></td></tr>)}</tbody></table></div> : <Empty>Không có phiên nào cần chú ý.</Empty>}
    </Panel></div>;
  }
  const rows = items.map(x => ({ x, members: summaries.find(s => s.id === x.id)?.memberCount ?? 0 })).sort((a, b) => b.members - a.members).slice(0, 3);
  return <div className="mt-3"><Panel title="Project nổi bật" action={<Link href="/instructor/projects" className="text-caption text-primary">Xem tất cả</Link>}>
    {rows.length ? <div className="grid gap-3 md:grid-cols-3">{rows.map(({ x, members }) => <article key={x.id} className="rounded-md border border-primary p-3"><p className="mb-2 inline-block rounded bg-warning-subtle px-2 py-1 text-caption font-semibold text-warning">Nổi bật</p><h3 className="text-body font-bold text-foreground">{x.name}</h3>{x.description && <p className="mt-1 line-clamp-2 text-caption text-muted-foreground">{x.description}</p>}<p className="mt-2 text-caption text-muted-foreground">{members} sinh viên · {x.technologies.join(", ") || "Chưa có công nghệ"}</p><button className="mt-3 w-full rounded-md border border-primary py-2 text-caption text-primary hover:bg-accent" onClick={() => onOpen(x.id)}>Xem chi tiết</button></article>)}</div> : <Empty>Chưa có dự án nổi bật.</Empty>}
  </Panel></div>;
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
        <p className="text-page font-bold text-primary">{data.data?.total}</p>
      )}
      <Link
        className="mt-4 block text-body text-primary"
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
