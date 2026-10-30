"use client";

import { useCallback, useState } from "react";
import { Award, Ban, Download, ExternalLink, Plus, ShieldCheck } from "lucide-react";
import {
  downloadCertificatePdf,
  issueCertificate,
  listCertificates,
  revokeCertificate,
  type AdminCertificate,
} from "@/lib/api/finance";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  buttonClass,
  Empty,
  inputClass,
  Modal,
  PageTitle,
  Pager,
  StatusDot,
} from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { PerformanceMemberPicker } from "@/components/product/performance-member-picker";
import { ApiError } from "@/lib/auth/api-client";

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function CertificateConsole() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [revoking, setRevoking] = useState<AdminCertificate | null>(null);
  const [notice, setNotice] = useState("");
  const action = useAction();

  const certificates = useResource(
    useCallback(
      (signal: AbortSignal) => listCertificates({ status, page }, signal),
      [status, page],
    ),
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title="Chứng nhận"
        subtitle="Cấp và thu hồi chứng nhận hoàn thành thực tập theo chính sách V-INTERN-COMPLETE. Điều kiện cấp được kiểm định phía hệ thống, không cấp tay."
        action={
          <button
            className={buttonClass}
            onClick={() => {
              setNotice("");
              setIssuing(true);
            }}
          >
            <Plus size={16} aria-hidden />
            Cấp chứng nhận
          </button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <p className="max-w-2xl text-body leading-6 text-muted-foreground">
          Điều kiện: qua tuyển chọn, hoàn thành phân công, đánh giá chốt ≥ 70 và KPI chốt ≥ 70. Sinh
          viên chưa đạt sẽ hiện rõ lý do thay vì cấp thử.
        </p>
      </div>
      {notice && (
        <p role="status" className="border-l border-success pl-3 text-body text-success">
          {notice}
        </p>
      )}
      <div className="flex flex-wrap gap-4">
        <label className="w-full text-body font-medium sm:w-56">
          Trạng thái
          <select
            className={inputClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="issued">Đang hiệu lực</option>
            <option value="revoked">Đã thu hồi</option>
          </select>
        </label>
      </div>

      {certificates.loading && !certificates.data ? (
        <LoadingState />
      ) : certificates.error ? (
        <ErrorState error={certificates.error} onRetry={certificates.reload} />
      ) : certificates.data?.items.length ? (
        <div className="overflow-x-auto border-y border-border" role="region" aria-label="Danh sách chứng nhận" tabIndex={0}>
          <table className="product-table w-full border-collapse text-body">
            <thead>
              <tr>
                {["Số chứng nhận", "Người giữ", "Vai trò · Dự án", "Trạng thái", "Hành động"].map(
                  (label) => (
                    <th
                      key={label}
                      className="whitespace-nowrap border-b border-border/70 bg-background/80 px-4 py-3 text-left text-caption font-semibold text-muted-foreground"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {certificates.data.items.map((certificate) => (
                <tr
                  key={certificate.id}
                  className="align-top transition-colors hover:bg-background/70"
                >
                  <td className="border-b border-border px-4 py-3">
                    <span className="font-mono text-caption font-semibold text-foreground">
                      {certificate.certificateNumber}
                    </span>
                    <p className="mt-1 text-caption text-muted-foreground">
                      Cấp {new Date(certificate.issuedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </td>
                  <td className="border-b border-border px-4 py-3">
                    <p className="font-medium text-foreground">
                      {certificate.holderName ?? "—"}
                    </p>
                    <p className="mt-0.5 text-caption text-muted-foreground">
                      {certificate.roleName ?? "—"}
                    </p>
                  </td>
                  <td className="border-b border-border px-4 py-3 text-muted-foreground">
                    {certificate.projectName ?? "—"}
                    {certificate.sessionName ? (
                      <span className="block text-caption">{certificate.sessionName}</span>
                    ) : null}
                  </td>
                  <td className="border-b border-border px-4 py-3">
                    <StatusDot tone={certificate.status === "issued" ? "green" : "red"}>
                      {certificate.status === "issued" ? "Đang hiệu lực" : "Đã thu hồi"}
                    </StatusDot>
                    {certificate.revokedAt && (
                      <p className="mt-1 max-w-44 text-caption text-muted-foreground">
                        {new Date(certificate.revokedAt).toLocaleDateString("vi-VN")} ·{" "}
                        {certificate.revokeReason ?? ""}
                      </p>
                    )}
                  </td>
                  <td className="border-b border-border px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                        href={`/verify?code=${encodeURIComponent(certificate.verificationCode)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={14} aria-hidden />
                        Trang xác minh
                      </a>
                      {certificate.status === "issued" && (
                        <>
                          <button
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                            aria-label={`Tải PDF ${certificate.certificateNumber}`}
                            onClick={() =>
                              void action.run(async () => {
                                const blob = await downloadCertificatePdf(certificate.id);
                                saveBlob(blob, `${certificate.certificateNumber}.pdf`);
                              })
                            }
                          >
                            <Download size={14} aria-hidden />
                            Tải PDF
                          </button>
                          <button
                            className="inline-flex items-center gap-1 font-semibold text-destructive hover:underline"
                            aria-label={`Thu hồi ${certificate.certificateNumber}`}
                            onClick={() => {
                              setNotice("");
                              setRevoking(certificate);
                            }}
                          >
                            <Ban size={14} aria-hidden />
                            Thu hồi
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Chưa có chứng nhận nào. Cấp chứng nhận cho sinh viên đủ điều kiện.</Empty>
      )}
      {certificates.data && (
        <Pager
          page={page}
          total={certificates.data.total}
          totalPages={Math.ceil(certificates.data.total / certificates.data.pageSize)}
          onChange={setPage}
          unit="chứng nhận"
        />
      )}
      {Boolean(action.error) && <ErrorState error={action.error} />}

      {issuing && (
        <Modal
          title="Cấp chứng nhận"
          description="Chọn sinh viên để kiểm tra điều kiện. Hệ thống tự chối nếu chưa đủ điều kiện."
          onClose={() => setIssuing(false)}
        >
          <IssueForm
            onSaved={(message) => {
              setIssuing(false);
              setNotice(message);
              certificates.reload();
            }}
          />
        </Modal>
      )}
      {revoking && (
        <Modal title={`Thu hồi ${revoking.certificateNumber}`} onClose={() => setRevoking(null)}>
          <RevokeForm
            certificate={revoking}
            onSaved={(message) => {
              setRevoking(null);
              setNotice(message);
              certificates.reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function IssueForm({ onSaved }: { onSaved: (message: string) => void }) {
  const action = useAction();
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState<AdminCertificate | null>(null);
  const [ineligible, setIneligible] = useState<string[] | null>(null);
  const submit = async () => {
    if (!userId) return;
    try {
      const certificate = await issueCertificate(userId);
      setResult(certificate);
      setIneligible(null);
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        const reasons = extractReasons(error.details);
        if (reasons.length) {
          setIneligible(reasons);
          setResult(null);
          return;
        }
      }
      throw error;
    }
  };
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void action.run(submit);
      }}
    >
      <PerformanceMemberPicker value={userId} onChange={setUserId} required />
      {Boolean(action.error) && <ErrorState error={action.error} />}
      {ineligible && (
        <div
          role="alert"
          className="rounded-control border border-warning/20 bg-warning-subtle px-4 py-3 text-body text-warning"
        >
          <p className="font-semibold">Sinh viên chưa đủ điều kiện cấp</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {ineligible.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
      {result && (
        <div
          role="status"
          className="rounded-control border border-success/20 bg-success-subtle px-4 py-3 text-body text-success"
        >
          <p className="inline-flex items-center gap-2 font-semibold">
            <ShieldCheck size={16} aria-hidden />
            Đã cấp {result.certificateNumber}
          </p>
          <p className="mt-1">
            Mã xác minh <span className="font-mono">{result.verificationCode}</span> đã sẵn sàng để
            chia sẻ.
          </p>
          <button
            type="button"
            className={`${buttonClass} mt-3`}
            onClick={() => onSaved(`Đã cấp chứng nhận ${result.certificateNumber}.`)}
          >
            Hoàn tất
          </button>
        </div>
      )}
      {!result && (
        <button className={buttonClass} disabled={action.busy} type="submit">
          <Award size={16} aria-hidden />
          {action.busy ? "Đang kiểm tra…" : "Kiểm tra và cấp"}
        </button>
      )}
    </form>
  );
}

/** The 409 payload carries a reasons array (spec: structured, honest refusal). */
function extractReasons(details: unknown): string[] {
  if (Array.isArray(details)) return details.map(String);
  if (details && typeof details === "object" && "reasons" in details) {
    const raw = (details as { reasons: unknown }).reasons;
    if (Array.isArray(raw)) return raw.map(String);
  }
  return [];
}

function RevokeForm({
  certificate,
  onSaved,
}: {
  certificate: AdminCertificate;
  onSaved: (message: string) => void;
}) {
  const action = useAction();
  const [reason, setReason] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void action.run(async () => {
          await revokeCertificate(certificate.id, reason.trim());
          onSaved(`Đã thu hồi ${certificate.certificateNumber}.`);
        });
      }}
    >
      <p className="text-body leading-6 text-muted-foreground">
        Thu hồi làm mã xác minh công khai trả về “không còn hiệu lực”. Bản ghi và lịch sử vẫn được
        giữ nguyên phục vụ đối chiếu; sinh viên nhận được thông báo.
      </p>
      <label className="block text-body font-medium">
        Lý do thu hồi <span className="text-destructive">*</span>
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          value={reason}
          maxLength={512}
          required
          placeholder="Nêu rõ lý do, ví dụ phát hiện vi phạm gian lận."
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <button
        className={`${buttonClass} bg-destructive hover:bg-destructive/90`}
        disabled={action.busy || !reason.trim()}
        type="submit"
      >
        {action.busy ? "Đang thu hồi…" : "Xác nhận thu hồi"}
      </button>
    </form>
  );
}
