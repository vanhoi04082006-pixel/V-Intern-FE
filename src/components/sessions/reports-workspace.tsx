"use client";
import { SessionSection as Panel } from "./session-section";
import { InstructorPageTitle as PageTitle } from "@/components/instructor/instructor-page-title";

import { usePathname } from "next/navigation";
import { InstructorNotice } from "@/components/instructor/instructor-ui";
import { useCallback, useRef, useState } from "react";
import { AcademicPicker } from "@/components/product/academic-picker";
import {
  Empty,
  inputClass,
  buttonClass,
  
  Pager,
  InlineAlert,
} from "@/components/product/primitives";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  createReport,
  getSavedReport,
  getReportPdf,
  getReportExcel,
  listReports,
  reportCsv,
  reportLabels,
  type ReportKind,
  reportScope,
} from "@/lib/api/reports";
import { errorMessage } from "@/lib/auth/api-client";
import { useResource } from "@/lib/api/use-resource";
import { ReportScopePickers } from "./report-scope-pickers";
import { ReportDetails } from "./report-details";

export function ReportsWorkspace({
  initialProjectId = "",
  initialSessionId = "",
  lockedScope = false,
  embedded = false,
}: {
  initialProjectId?: string;
  initialSessionId?: string;
  lockedScope?: boolean;
  embedded?: boolean;
}) {
  const isInstructor = Boolean(usePathname()?.startsWith("/instructor"));
  const [projectId, setProject] = useState(initialProjectId),
    [sessionId, setSession] = useState(initialSessionId);
  const [sprintId, setSprint] = useState(""),
    [studentId, setStudent] = useState("");
  const [page, setPage] = useState(1),
    [kind, setKind] = useState("");
  const [title, setTitle] = useState(""),
    [newKind, setNewKind] = useState<ReportKind>("progress");
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState<string | null>(null);
  const pending = useRef(false),
    requestId = useRef<string | null>(null);
  const scopeRevision = useRef(0);
  const reports = useResource(
    useCallback(
      (signal: AbortSignal) =>
        listReports(page, kind, signal, { projectId, sessionId }),
      [page, kind, projectId, sessionId],
    ),
  );
  const detail = useResource(
    useCallback(
      (signal: AbortSignal) =>
        selected ? getSavedReport(selected, signal) : Promise.resolve(null),
      [selected],
    ),
  );
  function changed() {
    setNotice(null);
    requestId.current = null;
    scopeRevision.current += 1;
  }
  async function save() {
    if (pending.current) return;
    const revision = scopeRevision.current;
    pending.current = true;
    setBusy(true);
    setError(undefined);
    setNotice(null);
    try {
      requestId.current ??= crypto.randomUUID();
      const saved = await createReport({
        ...reportScope(projectId, sessionId, from, to, sprintId, studentId),
        title,
        kind: newKind,
        requestId: requestId.current,
      });
      if (scopeRevision.current !== revision) return;
      setSelected(saved.id);
      setPage(1);
      reports.reload();
      requestId.current = null;
      setNotice(`Đã lưu báo cáo “${saved.title}”.`);
    } catch (err) {
      if (scopeRevision.current === revision) setError(err);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function download(format: "pdf" | "xlsx" | "csv") {
    if (pending.current || !selected) return;
    pending.current = true;
    setBusy(true);
    setError(undefined);
    setNotice(null);
    try {
      const blob =
        format === "pdf"
          ? await getReportPdf(selected)
          : format === "xlsx"
            ? await getReportExcel(selected)
            : new Blob([reportCsv(await getSavedReport(selected))], {
                type: "text/csv;charset=utf-8",
              });
      const url = URL.createObjectURL(blob),
        anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `v-intern-report-${selected}.${format}`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(`Đã chuẩn bị tệp ${format.toUpperCase()}. Kiểm tra mục tải xuống của trình duyệt.`);
    } catch (err) {
      setError(err);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      {!embedded && (
        <PageTitle
          title="Báo cáo phiên thực tập"
          subtitle="Bản chụp tiến độ, đóng góp và điểm đánh giá từ dữ liệu đã lưu."
        />
      )}
      {isInstructor && !embedded && (
        <InstructorNotice title="Một bản chụp để đối chiếu">
          Chọn dự án, phiên và khoảng thời gian trước khi tạo báo cáo. Bản đã
          lưu giữ dữ liệu tại thời điểm tạo; khi dữ liệu thay đổi, tạo báo cáo
          mới để đối chiếu. Xuất PDF, Excel hoặc CSV từ bản đang xem.
        </InstructorNotice>
      )}
      <div className={isInstructor && !embedded ? "workspace-report-layout" : "space-y-5"}>
      <div className={isInstructor ? "workspace-report-config" : "space-y-5"}>
      {!lockedScope && (
        <Panel title="Dự án và phiên">
          <div className="grid gap-4 md:grid-cols-2">
            <AcademicPicker
              compact
              kind="projects"
              label="Dự án"
              value={projectId}
              onChange={(id) => {
                changed();
                setError(undefined);
                setProject(id);
                setSession("");
                setSprint("");
                setStudent("");
                setSelected("");
                setPage(1);
              }}
            />
            <AcademicPicker
              compact
              kind="sessions"
              projectId={projectId}
              label="Phiên thực tập"
              value={sessionId}
              onChange={(id) => {
                changed();
                setError(undefined);
                setSession(id);
                setSprint("");
                setStudent("");
                setSelected("");
                setPage(1);
              }}
            />
          </div>
        </Panel>
      )}
      {projectId && sessionId && (
        <Panel title="Phạm vi task trong báo cáo mới">
          <ReportScopePickers
            key={`${projectId}:${sessionId}`}
            projectId={projectId}
            sessionId={sessionId}
            sprintId={sprintId}
            studentId={studentId}
            onSprint={(id) => {
              changed();
              setSprint(id);
            }}
            onStudent={(id) => {
              changed();
              setStudent(id);
            }}
          />
        </Panel>
      )}
      <Panel title="Tạo báo cáo">
        <form
          id="report-create"
          tabIndex={-1}
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label className="text-body">
            Tên báo cáo
            <input
              required
              maxLength={256}
              disabled={busy}
              className={inputClass}
              value={title}
              onChange={(e) => {
                changed();
                setTitle(e.target.value);
              }}
            />
          </label>
          <label className="text-body">
            Loại báo cáo
            <select
              className={inputClass}
              disabled={busy}
              value={newKind}
              onChange={(e) => {
                changed();
                setNewKind(e.target.value as ReportKind);
              }}
            >
              {Object.entries(reportLabels).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-body">
            Từ ngày
            <input
              type="date"
              disabled={busy}
              className={inputClass}
              value={from}
              max={to || undefined}
              onChange={(e) => {
                changed();
                setFrom(e.target.value);
              }}
            />
          </label>
          <label className="text-body">
            Đến ngày
            <input
              type="date"
              disabled={busy}
              className={inputClass}
              value={to}
              min={from || undefined}
              onChange={(e) => {
                changed();
                setTo(e.target.value);
              }}
            />
          </label>
          <p className="text-caption text-muted-foreground sm:col-span-2">
            Chọn dự án và phiên có thành viên được phân công; có thể thu hẹp
            sprint và sinh viên. Tối đa 500 task mỗi bản chụp. Điểm chưa chấm
            giữ trống; thời gian lọc gồm cả ngày kết thúc.
          </p>
          <button
            className={buttonClass}
            disabled={
              busy ||
              !projectId ||
              !sessionId ||
              !title.trim() ||
              Boolean(from && to && from > to)
            }
          >
            {busy ? "Đang xử lý…" : "Tạo và lưu báo cáo"}
          </button>
        </form>
      </Panel>
      {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
      {Boolean(error) && (
        <p role="alert" className="text-body text-destructive">
          {errorMessage(error)}
        </p>
      )}
      </div>
      <div className={isInstructor ? "workspace-report-output" : "space-y-5"}>
      <Panel title="Báo cáo đã lưu">
        <label className="mb-3 block text-body">
          Lọc loại
          <select
            className={inputClass}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            {Object.entries(reportLabels).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {reports.loading && <LoadingState />}
        {Boolean(reports.error) && (
          <ErrorState error={reports.error} onRetry={reports.reload} />
        )}
        {reports.data?.items.length === 0 && (
          <Empty
            title={isInstructor ? "Chưa có báo cáo đã lưu" : undefined}
            description={isInstructor ? "Chọn dự án và phiên, sau đó dùng mục Tạo báo cáo để lưu bản đầu tiên." : undefined}
            action={isInstructor ? <a href="#report-create" className="student-link">Tạo báo cáo đầu tiên</a> : undefined}
          />
        )}
        {reports.data?.items.map((r) => (
          <button
            key={r.id}
            className="block w-full border-b py-3 text-left text-primary"
            aria-pressed={selected === r.id}
            onClick={() => setSelected(r.id)}
          >
            <strong>{r.title}</strong>
            <span className="block text-caption text-muted-foreground">
              {r.projectName} · {reportLabels[r.kind]} ·{" "}
              {new Date(r.createdAt).toLocaleString("vi-VN")}
            </span>
          </button>
        ))}
        {reports.data && (
          <Pager
            page={page}
            total={reports.data.total}
            totalPages={Math.ceil(reports.data.total / 8)}
            onChange={setPage}
          />
        )}
      </Panel>
      {selected && (
        <Panel title="Chi tiết bản chụp">
          {detail.loading && <LoadingState />}
          {Boolean(detail.error) && (
            <ErrorState error={detail.error} onRetry={detail.reload} />
          )}
          {detail.data && (
            <>
              <h3 className="font-semibold">{detail.data.title}</h3>
              <p className="mb-4 text-body text-muted-foreground">
                {detail.data.snapshot.projectName} ·{" "}
                {new Date(detail.data.createdAt).toLocaleString("vi-VN")}
              </p>
              <div className="overflow-x-auto" role="region" aria-label="Thành viên trong bản chụp báo cáo" tabIndex={0}>
                <table className="workspace-table w-full text-left text-body">
                  <thead>
                    <tr>
                      {[
                        "Thành viên",
                        "Task hoàn thành",
                        "Điểm đã chốt",
                        "Quá hạn",
                        "Bài nộp / đã duyệt",
                      ].map((h) => (
                        <th className="p-2" key={h}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.data.snapshot.members.map((m) => (
                      <tr key={m.userId}>
                        <td className="p-2">{m.displayName ?? m.userId}</td>
                        <td className="p-2">
                          {m.completedTaskCount}/{m.totalTaskCount}
                        </td>
                        <td className="p-2">
                          {m.averageEvaluationScore ?? "Chưa chấm"}
                        </td>
                        <td className="p-2">{m.overdueOpenTaskCount}</td>
                        <td className="p-2">
                          {m.submissionCount} / {m.approvedCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-2">
                {(["pdf", "xlsx", "csv"] as const).map((format) => (
                  <button
                    key={format}
                    disabled={busy}
                    className={buttonClass}
                    onClick={() => void download(format)}
                  >
                    Tải {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </>
          )}
          {detail.data?.snapshot.details && (
            <ReportDetails key={selected} data={detail.data.snapshot.details} />
          )}
        </Panel>
      )}
      </div>
      </div>
    </div>
  );
}
