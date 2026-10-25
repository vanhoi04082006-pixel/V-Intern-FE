"use client";
import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import {
  Modal,
  Field,
  btn,
  textareaClass,
} from "@/components/product/primitives";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { errorMessage } from "@/lib/auth/api-client";
import { useResource } from "@/lib/api/use-resource";
import {
  ownRepositoryAccess,
  sessionRepositoryAccess,
  retryRepositoryAccess,
  type RepositoryAccessItem,
} from "@/lib/api/repository-access";
const labels: Record<RepositoryAccessItem["displayStatus"], string> = {
  pending: "Chờ xử lý",
  leased: "Đang đối chiếu",
  retry: "Sẽ thử lại",
  waiting_user: "Cần bổ sung kết nối",
  done: "Đã đối chiếu",
  failed: "Cần xử lý",
  review_required: "Admin cần đối chiếu",
};
const date = (value: string) => new Date(value).toLocaleString("vi-VN");
export function RepositoryAccessStatus({ sessionId }: { sessionId?: string }) {
  const report = useResource(
    useCallback(
      (signal: AbortSignal) =>
        sessionId
          ? sessionRepositoryAccess(sessionId, signal)
          : ownRepositoryAccess(signal),
      [sessionId],
    ),
  );
  const [selected, setSelected] = useState<RepositoryAccessItem | null>(null),
    [notice, setNotice] = useState("");
  return (
    <section
      aria-label="Quyền GitHub sau bàn giao"
      className="space-y-4 border-t border-slate-200 pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Quyền GitHub sau bàn giao
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Quyết định thay người và quyền GitHub được xác nhận riêng. Hệ thống
            đối chiếu theo lượt nền mỗi phút.
          </p>
        </div>
        <button
          className={btn("secondary")}
          disabled={report.loading}
          onClick={report.reload}
        >
          Cập nhật quyền
        </button>
      </div>
      {notice && (
        <p
          role="status"
          className="border-l-2 border-emerald-400 pl-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {report.loading && <LoadingState label="Đang tải quyền GitHub…" />}
      {Boolean(report.error) && (
        <ErrorState error={report.error} onRetry={report.reload} />
      )}
      {report.data && (
        <>
          <dl className="flex flex-wrap gap-x-7 gap-y-3 text-sm">
            {report.data.summary.map((s) => (
              <div key={s.status} className="flex gap-2">
                <dt className="text-slate-500">{labels[s.status]}</dt>
                <dd className="font-semibold tabular-nums">{s.total}</dd>
              </div>
            ))}
          </dl>
          {!report.data.items.length ? (
            <p className="text-sm text-slate-500">
              Chưa có lượt đối chiếu quyền sau bàn giao.
            </p>
          ) : (
            <ol className="divide-y divide-slate-200">
              {report.data.items.map((job) => (
                <li key={job.id} className="space-y-3 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {job.sessionName} ·{" "}
                        {job.role === "joining"
                          ? "Tiếp nhận phân công"
                          : "Kết thúc phân công"}
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-900">
                        {job.projectName}
                      </h3>
                      {sessionId && (
                        <p className="mt-1 text-sm text-slate-600">
                          {job.displayName}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${job.displayStatus === "done" ? "text-emerald-700" : job.displayStatus === "review_required" || job.displayStatus === "failed" ? "text-amber-800" : "text-slate-600"}`}
                    >
                      {labels[job.displayStatus]}
                    </span>
                  </div>
                  {job.displayStatus === "review_required" && (
                    <p className="max-w-3xl border-l-2 border-amber-300 pl-3 text-sm leading-6 text-amber-900">
                      Admin cần kiểm tra quyền hiện tại trên GitHub. Hệ thống
                      giữ nguyên quyền chưa xác minh được nguồn gốc. Sau khi xử
                      lý, giảng viên yêu cầu đối chiếu lại để cập nhật kết quả.
                    </p>
                  )}
                  {job.errorCode === "GITHUB_IDENTITY_CHANGED" && (
                    <p className="text-sm text-amber-900">
                      Danh tính GitHub khác lần ghi nhận trước. Kết nối lại tài
                      khoản cũ hoặc liên hệ Admin kiểm tra; quyền cũ được giữ
                      nguyên.
                    </p>
                  )}
                  {job.errorCode === "GITHUB_MEMBER_NOT_CONNECTED" && (
                    <p className="text-sm text-slate-600">
                      Sinh viên cần kết nối GitHub để kiểm tra lời mời và quyền
                      truy cập.
                    </p>
                  )}
                  {job.outcome === "invitation_pending" &&
                    job.status === "done" && (
                      <p className="text-sm text-slate-600">
                        Lời mời đang chờ sinh viên chấp nhận trên GitHub.
                      </p>
                    )}
                  {job.outcome === "access_present" &&
                    job.status === "done" && (
                      <p className="text-sm text-emerald-700">
                        Đã xác nhận quyền truy cập.
                      </p>
                    )}
                  <p className="text-xs leading-5 text-slate-500">
                    Cập nhật {date(job.updatedAt)}
                    {["retry", "waiting_user"].includes(job.status) &&
                      ` · Dự kiến đối chiếu lại ${date(job.nextAttemptAt)}`}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    {!sessionId &&
                      job.errorCode === "GITHUB_MEMBER_NOT_CONNECTED" && (
                        <Link
                          className="font-medium text-blue-700 hover:underline"
                          href="/intern/github"
                        >
                          Kết nối GitHub
                        </Link>
                      )}
                    {job.repositoryUrl && (
                      <a
                        href={job.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-700 hover:underline"
                      >
                        Mở repository
                      </a>
                    )}
                    {sessionId && job.retryAllowed && (
                      <button
                        className="font-medium text-blue-700 hover:underline"
                        onClick={() => {
                          setNotice("");
                          setSelected(job);
                        }}
                      >
                        Đối chiếu lại
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {report.data.items.length > 0 && (
            <p className="text-xs text-slate-500">
              Tối đa {report.data.limit} lượt gần nhất. “Đã đối chiếu” mô tả kết
              quả kiểm tra; lời mời đang chờ vẫn cần sinh viên chấp nhận.
            </p>
          )}
        </>
      )}
      {selected && sessionId && (
        <RetryDialog
          job={selected}
          sessionId={sessionId}
          onClose={() => setSelected(null)}
          onReload={() => {
            setSelected(null);
            report.reload();
          }}
          onSaved={() => {
            setSelected(null);
            setNotice(
              "Đã đưa vào hàng đợi đối chiếu lại. Chờ lượt nền rồi cập nhật; quyền GitHub chưa được xác nhận thay đổi.",
            );
            report.reload();
          }}
        />
      )}
    </section>
  );
}
function RetryDialog({
  job,
  sessionId,
  onClose,
  onReload,
  onSaved,
}: {
  job: RepositoryAccessItem;
  sessionId: string;
  onClose: () => void;
  onReload: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || reason.trim().length < 10) return;
    setBusy(true);
    setError("");
    try {
      await retryRepositoryAccess(sessionId, job.id, {
        expectedRevision: job.revision,
        reason: reason.trim(),
      });
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Đối chiếu lại quyền GitHub"
      description={`${job.displayName} · ${job.projectName}`}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
        <p className="text-sm leading-6 text-slate-600">
          Kiểm tra kết nối hoặc quyền GitHub trước khi thử lại. Thao tác này ghi
          lý do và đưa lượt hiện tại vào hàng đợi; không tự cho phép thu hồi
          quyền đang cần Admin xem xét.
        </p>
        <Field
          htmlFor="repository-access-reason"
          label="Lý do đối chiếu lại"
          hint="Từ 10 đến 1000 ký tự, được lưu trong lịch sử."
        >
          <textarea
            id="repository-access-reason"
            className={textareaClass}
            minLength={10}
            maxLength={1000}
            value={reason}
            disabled={busy}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={btn("secondary")}
            disabled={busy}
            onClick={onReload}
          >
            Đóng và tải lại
          </button>
          <button
            className={btn("primary")}
            disabled={busy || reason.trim().length < 10}
          >
            {busy ? "Đang lưu…" : "Đưa vào hàng đợi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
