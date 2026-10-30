"use client";
import { useCallback, useState } from "react";
import { InstructorHeading } from "@/components/instructor/instructor-ui";
import {
  Field,
  Pager,
  Empty,
  btn,
  selectClass,
} from "@/components/product/primitives";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { errorMessage } from "@/lib/auth/api-client";
import { listSessionOverview } from "@/lib/api/sessions";
import {
  sessionParticipation,
  refreshParticipation,
  type ParticipationIncident,
} from "@/lib/api/participation";
import { useResource } from "@/lib/api/use-resource";
import { MarginNote } from "@/components/workspace/notebook";
import { IncidentList } from "./incident-list";
import { IncidentActionDialog, type IncidentAction } from "./incident-action";
import { PolicyEditor } from "./policy-editor";
import { ParticipationSummary } from "./summary";
import { ReplacementDialog } from "./replacement-dialog";
import { RepositoryAccessStatus } from "./repository-access";

export function InstructorParticipation({
  initialSessionId = "",
}: {
  initialSessionId?: string;
}) {
  const [page, setPage] = useState(1),
    [selected, setSelected] = useState(initialSessionId);
  const sessions = useResource(
    useCallback(
      (signal: AbortSignal) =>
        listSessionOverview({ page, pageSize: 50 }, signal),
      [page],
    ),
  );
  const id = selected || sessions.data?.items[0]?.id;
  return (
    <div className="space-y-6">
      <InstructorHeading
        title="Thời hạn & kỷ luật"
        description="Cấu hình quy tắc, đối chiếu bằng chứng và xử lý từng trường hợp trong phiên bạn phụ trách."
      />
      <MarginNote className="max-w-2xl">
        lần nộp hợp lệ đầu tiên quyết định trễ hạn ✎
      </MarginNote>
      {sessions.loading && <LoadingState label="Đang tải phiên thực tập…" />}
      {Boolean(sessions.error) && (
        <ErrorState error={sessions.error} onRetry={sessions.reload} />
      )}
      {sessions.data && (
        <div className="max-w-2xl">
          <Field htmlFor="participation-session" label="Phiên thực tập">
            <select
              id="participation-session"
              className={selectClass}
              value={id ?? ""}
              onChange={(e) => setSelected(e.target.value)}
            >
              {selected &&
                !sessions.data.items.some((s) => s.id === selected) && (
                  <option value={selected}>Phiên được mở từ liên kết</option>
                )}
              {sessions.data.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}, {s.name}
                </option>
              ))}
            </select>
          </Field>
          {sessions.data.total > 50 && (
            <Pager
              page={page}
              totalPages={Math.ceil(sessions.data.total / 50)}
              total={sessions.data.total}
              unit="phiên"
              onChange={(next) => {
                setSelected("");
                setPage(next);
              }}
            />
          )}
          {!sessions.data.items.length && !selected && (
            <Empty>Chưa có phiên thực tập để quản lý thời hạn.</Empty>
          )}
        </div>
      )}
      {id && <SessionReport key={id} sessionId={id} />}
    </div>
  );
}
function SessionReport({ sessionId }: { sessionId: string }) {
  const [replacement, setReplacement] = useState<ParticipationIncident | null>(
    null,
  );
  const [page, setPage] = useState(1),
    [policyOpen, setPolicyOpen] = useState(false);
  const [action, setAction] = useState<{
    item: ParticipationIncident;
    action: IncidentAction;
  } | null>(null);
  const [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const report = useResource(
    useCallback(
      (signal: AbortSignal) => sessionParticipation(sessionId, page, signal),
      [sessionId, page],
    ),
  );
  function saved(message: string) {
    setPolicyOpen(false);
    setAction(null);
    setNotice(message);
    setError("");
    report.reload();
  }
  async function refresh() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await refreshParticipation(sessionId);
      saved(
        "Đã đối chiếu lượt này. Phiên có nhiều nhiệm vụ được xử lý theo từng lô; đồng bộ nền sẽ tiếp tục.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-label="Bằng chứng thời hạn"
      aria-busy={busy || report.loading}
      className="space-y-5"
    >
      {report.loading && <LoadingState />}
      {Boolean(report.error) && (
        <ErrorState error={report.error} onRetry={report.reload} />
      )}
      {report.data && (
        <>
          <div
            className={`flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6${report.data.policy.configured ? "" : " dashed-cut"}`}
          >
            <div>
              <h2 className="text-section font-semibold text-foreground">
                Chính sách phiên
              </h2>
              <p className="mt-1 text-body text-muted-foreground">
                {report.data.policy.configured
                  ? `Phiên bản ${report.data.policy.version}, áp dụng từ ${new Date(report.data.policy.activeFrom!).toLocaleString("vi-VN")}`
                  : "Chưa kích hoạt, chưa tự ghi nhận hoặc trừ điểm"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={btn("secondary")}
                disabled={busy || report.loading}
                onClick={refresh}
              >
                {busy ? "Đang đối chiếu…" : "Đối chiếu ngay"}
              </button>
              <button
                type="button"
                className={btn("primary")}
                disabled={busy || report.loading}
                onClick={() => setPolicyOpen(true)}
              >
                Cấu hình chính sách
              </button>
            </div>
          </div>
          <p className="text-body leading-6 text-muted-foreground">
            Cảnh báo từ lần <strong>{report.data.policy.warningFrom}</strong> ·
            Xét trừ điểm từ lần{" "}
            <strong>{report.data.policy.penaltyFrom}</strong>, Đề xuất thay từ
            lần <strong>{report.data.policy.replacementFrom}</strong>.{" "}
            {report.data.policy.penaltyPoints === null
              ? "Chưa đặt mức trừ điểm."
              : `${report.data.policy.penaltyPoints} điểm/lần, tối đa ${report.data.policy.penaltyCap} điểm/sinh viên/phiên.`}{" "}
            Giảng viên xác nhận điểm trừ khi chấm; đề xuất thay cần quyết định
            riêng.
          </p>
          {notice && (
            <p
              role="status"
              className="border-l border-border pl-3 text-body text-success"
            >
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="text-body text-destructive">
              {error}
            </p>
          )}
          <ParticipationSummary {...report.data.summary} />
          <p className="text-caption text-muted-foreground">
            Điểm ghi nhận là căn cứ xem xét, khác với điểm đã trừ ở bài được
            duyệt. Lần nộp hợp lệ đầu tiên quyết định trễ hạn.
          </p>
          <IncidentList
            items={report.data.items}
            manage
            onAction={(item, action) => setAction({ item, action })}
            onReplace={setReplacement}
          />
          <Pager
            page={page}
            total={report.data.summary.total}
            totalPages={Math.ceil(
              report.data.summary.total / report.data.pageSize,
            )}
            onChange={setPage}
            unit="ghi nhận"
          />
          {policyOpen && (
            <PolicyEditor
              sessionId={sessionId}
              policy={report.data.policy}
              onClose={() => setPolicyOpen(false)}
              onSaved={() =>
                saved(
                  "Đã lưu phiên bản chính sách mới. Ghi nhận cũ giữ nguyên mức đã áp dụng.",
                )
              }
            />
          )}
        </>
      )}
      {action && (
        <IncidentActionDialog
          {...action}
          onClose={() => setAction(null)}
          onSaved={() =>
            saved(
              "Đã lưu xử lý và gửi thông báo sinh viên. Điểm đã duyệt được giữ nguyên.",
            )
          }
        />
      )}
      {replacement && (
        <ReplacementDialog
          sessionId={sessionId}
          incidentId={replacement.id}
          studentName={replacement.displayName}
          onClose={() => setReplacement(null)}
          onSaved={() => {
            setNotice(
              "Đã lưu quyết định thay người. Quyền GitHub đang chờ đối chiếu riêng.",
            );
            report.reload();
          }}
        />
      )}
      <RepositoryAccessStatus sessionId={sessionId} />
    </section>
  );
}
