"use client";
import { StudentOutcomeHeading } from "@/components/intern/student-outcome-heading";
import { StudentPerformance } from "@/components/intern/student-performance";
import { StudentScore } from "@/components/intern/student-score";
import {
  StudentBadge,
  StudentCallout,
  StudentLink,
  StudentPanel,
} from "@/components/intern/student-ui";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  Bell,
  Check,
  CheckCheck,
  Copy,
  Download,
  FileText,
  History,
  Info,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useResource } from "@/lib/api/use-resource";
import { ApiError, errorMessage } from "@/lib/auth/api-client";
import { getSessionUser } from "@/lib/auth/session";
import { refreshSession } from "@/lib/auth/auth-service";
import {
  getCertificate,
  getCertificatePdf,
  getCertificates,
  getEvaluation,
  getEvaluations,
  getKpi,
  getKpis,
  getLedger,
  getNotifications,
  notificationLinkForRole,
  getNotificationPreferences,
  setNotificationPreference,
  getPerformance,
  getRecommendations,
  getSalary,
  markAllNotifications,
  markNotification,
  refreshRecommendations,
  verifyCertificate,
} from "@/lib/api/outcomes";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { NotificationText } from "./notification-text";
import {
  buttonClass,
  Empty,
  Field,
  InlineAlert,
  inputClass,
  PageTitle,
  Pager,
  Panel,
  StatusDot,
} from "./primitives";

const kpiMetricLabels: Record<string, string> = {
  delivery: "Tiến độ bàn giao",
  quality: "Chất lượng",
  timeliness: "Đúng hạn",
};
const ledgerMeta: Record<
  string,
  { label: string; tone: "green" | "blue" | "amber" | "rose" | "slate" }
> = {
  kpi_earning: { label: "Tích lũy KPI", tone: "green" },
  bonus: { label: "Thưởng", tone: "blue" },
  penalty: { label: "Khấu trừ", tone: "rose" },
  adjustment: { label: "Điều chỉnh", tone: "amber" },
  reversal: { label: "Hoàn tác", tone: "slate" },
};

/** Panel dùng chung: giữ giao diện cũ cho admin/giảng viên, dùng panel sinh viên
 * khi đang ở khu vực /intern. */
function OutcomeFrame({
  intern,
  title,
  icon,
  action,
  children,
}: {
  intern: boolean;
  title: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  return intern ? (
    <StudentPanel title={title} icon={icon} action={action}>
      {children}
    </StudentPanel>
  ) : (
    <Panel title={title} action={action}>
      {children}
    </Panel>
  );
}

function Resource<T>({
  resource,
  children,
}: {
  resource: { loading: boolean; error?: unknown; data?: T; reload: () => void };
  children: (data: T) => ReactNode;
}) {
  return resource.loading ? (
    <LoadingState />
  ) : resource.error ? (
    <ErrorState error={resource.error} onRetry={resource.reload} />
  ) : resource.data !== undefined ? (
    children(resource.data)
  ) : null;
}
export function Metrics({ values }: { values: [string, number | null][] }) {
  return (
    <dl
      className={`workspace-metrics grid gap-3 sm:grid-cols-2 ${values.length === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}
    >
      {values.map(([name, value]) => (
        <div
          key={name}
          className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs transition-colors hover:border-slate-300"
        >
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {name}
          </dt>
          <dd
            className={`mt-2.5 text-2xl font-bold tracking-tight tabular-nums ${value === null ? "text-slate-500" : "text-navy"}`}
          >
            {value === null ? "Chưa đo được" : value.toLocaleString("vi-VN")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function Evaluations({ id }: { id?: string }) {
  const evaluations = useResource(
    useCallback(
      (signal: AbortSignal) =>
        id
          ? getEvaluation(id, signal).then((x) => [x])
          : getEvaluations(signal),
      [id],
    ),
  );
  return (
    <>
      <StudentOutcomeHeading
        title="Đánh giá của tôi"
        subtitle="Chỉ hiển thị kết quả đã được giảng viên chốt chính thức"
      />
      <Resource resource={evaluations}>
        {(data) =>
          data.length ? (
            <div className="student-stack">
              {data.map((e) => (
                <StudentPanel
                  key={e.id}
                  icon={Award}
                  title={`Điểm chính thức: ${e.overallScore ?? "Chưa có"}/100`}
                  action={
                    !id && (
                      <StudentLink
                        secondary
                        href={`/intern/evaluations/${e.id}`}
                      >
                        Chi tiết
                      </StudentLink>
                    )
                  }
                >
                  <div className="student-kpi-hero">
                    <StudentScore
                      value={e.overallScore}
                      label="Điểm chính thức"
                      tone="green"
                    />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-500">
                        Nhận xét của giảng viên
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-8 text-slate-600">
                        {e.summary ?? "Chưa có nhận xét."}
                      </p>
                    </div>
                  </div>
                  <div className="student-eval-meta">
                    <StudentBadge tone="green">Đã chốt</StudentBadge>
                    <span>Lần hiệu chỉnh: {e.revisionNumber}</span>
                    <time>
                      {e.finalizedAt &&
                        new Date(e.finalizedAt).toLocaleString("vi-VN")}
                    </time>
                  </div>

                  <div
                    className="student-table-wrap mt-4"
                    role="region"
                    aria-label="Bảng điểm đánh giá"
                    tabIndex={0}
                  >
                    <table className="student-table">
                      <thead>
                        <tr>
                          {["Tiêu chí", "Điểm", "Nhận xét"].map((x) => (
                            <th key={x}>{x}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {e.scores.map((s, index) => (
                          <tr key={s.id}>
                            <td>
                              <span className="font-semibold text-slate-700">
                                Tiêu chí {index + 1}
                              </span>
                              <details className="mt-1 text-[10.5px] text-slate-500">
                                <summary className="cursor-pointer">
                                  Mã tham chiếu
                                </summary>
                                <span className="break-all">
                                  {s.criterionId}
                                </span>
                              </details>
                            </td>
                            <td className="font-semibold tabular-nums">
                              {s.score}
                            </td>
                            <td>{s.comment ?? "Chưa có"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </StudentPanel>
              ))}
            </div>
          ) : (
            <div className="student-outcome-empty-layout">
              <div className="student-panel student-empty">
                <Award size={42} aria-hidden="true" />
                <h3>Chưa có đánh giá được chốt.</h3>
                <p>
                  Nhận xét và điểm chính thức sẽ xuất hiện sau khi giảng viên
                  hoàn tất đánh giá.
                </p>
                <div className="mt-5">
                  <StudentLink secondary href="/intern/performance">
                    Xem tiến độ hiện tại
                  </StudentLink>
                </div>
              </div>
              <StudentPanel title="Đánh giá diễn ra thế nào?" icon={Info}>
                <ol className="student-step-list">
                  <li>
                    <div>
                      <strong>Giảng viên tổng hợp</strong>
                      <p>
                        Công việc đã hoàn thành, bài nộp và phản hồi được đối
                        chiếu với tiêu chí của dự án.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Điểm được chốt</strong>
                      <p>
                        Điểm và nhận xét chỉ hiển thị khi giảng viên xác nhận
                        chính thức, không dùng điểm tạm.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Bạn xem lại bất cứ lúc nào</strong>
                      <p>
                        Kết quả đã chốt được giữ nguyên để bạn đối chiếu với KPI
                        và chứng nhận sau này.
                      </p>
                    </div>
                  </li>
                </ol>
              </StudentPanel>
            </div>
          )
        }
      </Resource>
    </>
  );
}
export function Performance() {
  const performance = useResource(
    useCallback((signal: AbortSignal) => getPerformance(signal), []),
  );
  return (
    <>
      <StudentOutcomeHeading
        title="Hiệu suất của tôi"
        subtitle="Chỉ số được tính từ nhiệm vụ và đánh giá chính thức"
      />
      <Resource resource={performance}>
        {(m) => <StudentPerformance data={m} />}
      </Resource>
    </>
  );
}
export function Kpi({ id }: { id?: string }) {
  const results = useResource(
    useCallback(
      (signal: AbortSignal) =>
        id ? getKpi(id, signal).then((x) => [x]) : getKpis(signal),
      [id],
    ),
  );
  return (
    <>
      <StudentOutcomeHeading
        title="KPI & Lương ảo"
        subtitle="Điểm KPI có nguồn tính rõ ràng · Lương ảo phục vụ chương trình thực tập"
      />
      <Resource resource={results}>
        {(data) =>
          data.length ? (
            <div className="student-stack">
              {data.map((k) => (
                <StudentPanel
                  key={k.id}
                  title="Kết quả KPI"
                  icon={Target}
                  description={`Quy tắc ${k.ruleVersion} · cập nhật ${new Date(k.calculatedAt).toLocaleString("vi-VN")}`}
                  action={
                    !id && (
                      <StudentLink secondary href={`/intern/kpi/${k.id}`}>
                        Nguồn tính
                      </StudentLink>
                    )
                  }
                >
                  <div className="student-kpi-hero">
                    <StudentScore
                      value={k.finalScore}
                      label="Điểm KPI"
                      tone={
                        k.finalScore !== null && k.finalScore >= 70
                          ? "green"
                          : "blue"
                      }
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] leading-7 text-slate-600">
                        {k.finalScore === null
                          ? "Chưa đủ dữ liệu để tính điểm. Các chỉ số còn thiếu được giữ nguyên, không tự quy về 0."
                          : "Điểm được tính theo quy tắc của chương trình. Mở nguồn tính để xem các chỉ số và trọng số đóng góp."}
                      </p>
                      {k.finalScore !== null && (
                        <div className="mt-3">
                          <StudentBadge tone="green">Đã tổng hợp</StudentBadge>
                        </div>
                      )}
                    </div>
                  </div>
                  {"metrics" in k && Array.isArray(k.metrics) && (
                    <div className="student-kpi-metrics">
                      {k.metrics.map((m) => (
                        <div key={m.metricCode} className="student-kpi-row">
                          <div className="student-kpi-name">
                            <strong>
                              {kpiMetricLabels[m.metricCode] ?? m.metricCode}
                            </strong>
                            <span>{m.metricCode}</span>
                          </div>
                          <div>
                            <span>Giá trị</span>
                            <strong>{m.sourceValue ?? "Chưa đo"}</strong>
                          </div>
                          <div>
                            <span>Trọng số</span>
                            <strong>
                              {m.effectiveWeight === null
                                ? "Chưa có"
                                : `${m.effectiveWeight}%`}
                            </strong>
                          </div>
                          <div>
                            <span>Đóng góp</span>
                            <strong>
                              {m.weightedContribution ?? "Chưa có"}
                            </strong>
                          </div>
                          <details className="student-kpi-source">
                            <summary>Nguồn dữ liệu</summary>
                            <pre>{m.sourceJson}</pre>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </StudentPanel>
              ))}
            </div>
          ) : (
            <div className="student-dashboard-grid student-outcome-empty-grid">
              <div className="student-panel student-empty">
                <Sparkles size={36} aria-hidden="true" />
                <h3>Chưa có kết quả KPI</h3>
                <p>
                  Khi có đủ dữ liệu và kết quả được tính, bạn sẽ xem được điểm,
                  trọng số và nguồn tính tại đây.
                </p>
                <div className="mt-5">
                  <StudentLink secondary href="/intern/performance">
                    Xem hiệu suất hiện tại
                  </StudentLink>
                </div>
              </div>
              <StudentPanel title="KPI được tổng hợp thế nào?" icon={Info}>
                <ol className="student-step-list">
                  <li>
                    <div>
                      <strong>Nhiệm vụ được xác nhận</strong>
                      <p>
                        Công việc hoàn thành và được giảng viên duyệt là nguồn
                        dữ liệu đầu vào.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Đánh giá được chốt</strong>
                      <p>
                        Điểm chính thức được khóa theo từng kỳ, không thay đổi
                        khi xem lại.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>KPI tổng hợp theo trọng số</strong>
                      <p>
                        Ba chỉ số tiến độ, chất lượng và đúng hạn được tính theo
                        quy tắc công khai.
                      </p>
                    </div>
                  </li>
                </ol>
              </StudentPanel>
            </div>
          )
        }
      </Resource>
      <div className="mt-5">
        <Salary />
      </div>
    </>
  );
}
export function Salary() {
  const balance = useResource(
    useCallback((signal: AbortSignal) => getSalary(signal), []),
  );
  const [page, setPage] = useState(1);
  const ledger = useResource(
    useCallback((signal: AbortSignal) => getLedger(page, signal), [page]),
  );
  return (
    <div className="student-stack">
      <StudentPanel
        title="Lương ảo"
        icon={Wallet}
        description="Đơn vị ảo, không phải tiền lương thực tế. Chỉ dùng trong chương trình thực tập."
      >
        <Resource resource={balance}>
          {(b) => (
            <div className="student-balance-grid">
              <div className="student-balance-card" data-tone="blue">
                <span>Số dư từ sổ giao dịch</span>
                <strong>
                  {b.balance.toLocaleString("vi-VN")}
                  <small>{b.unit === "VND_VIRTUAL" ? "đồng ảo" : b.unit}</small>
                </strong>
                <p>Tổng tích lũy từ các giao dịch đã được ghi nhận.</p>
              </div>
              <div className="student-balance-card" data-tone="green">
                <span>Tích lũy từ KPI</span>
                <strong>
                  {b.earnedThisPeriod.toLocaleString("vi-VN")}
                  <small>{b.unit === "VND_VIRTUAL" ? "đồng ảo" : b.unit}</small>
                </strong>
                <p>Phần thưởng ghi nhận trong kỳ hiện tại.</p>
              </div>
            </div>
          )}
        </Resource>
      </StudentPanel>
      <StudentPanel
        title="Sổ giao dịch"
        icon={History}
        description="Mọi thay đổi số dư đều có nguồn và thời điểm rõ ràng."
        action={
          ledger.data ? (
            <span className="student-badge" data-tone="slate">
              {ledger.data.total} giao dịch
            </span>
          ) : undefined
        }
      >
        <Resource resource={ledger}>
          {(data) => (
            <>
              {data.items.length ? (
                <div
                  className="student-table-wrap"
                  role="region"
                  aria-label="Sổ giao dịch lương ảo"
                  tabIndex={0}
                >
                  <table className="student-table">
                    <thead>
                      <tr>
                        {["Thời gian", "Loại", "Số tiền ảo", "Nội dung"].map(
                          (x) => (
                            <th key={x}>{x}</th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((l) => {
                        const meta = ledgerMeta[l.type] ?? {
                          label: l.type,
                          tone: "slate" as const,
                        };
                        return (
                          <tr key={l.id}>
                            <td className="whitespace-nowrap">
                              {new Date(l.createdAt).toLocaleString("vi-VN")}
                            </td>
                            <td>
                              <StudentBadge tone={meta.tone}>
                                {meta.label}
                              </StudentBadge>
                            </td>
                            <td className="workspace-ledger-amount whitespace-nowrap font-semibold tabular-nums" data-negative={l.amount < 0 ? "true" : undefined}>
                              {l.amount > 0 ? "+" : ""}{l.amount.toLocaleString("vi-VN")}{" "}
                              <span className="text-[10.5px] font-normal text-slate-500">
                                {l.unit === "VND_VIRTUAL" ? "đồng ảo" : l.unit}
                              </span>
                            </td>
                            <td>{l.description}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="student-empty !py-10">
                  <Wallet size={34} aria-hidden="true" />
                  <h3>Chưa có giao dịch lương ảo</h3>
                  <p>
                    Khi KPI được chốt hoặc có điều chỉnh, giao dịch sẽ xuất hiện
                    tại đây kèm nguồn và thời điểm.
                  </p>
                </div>
              )}
              {data.totalPages > 1 && <Pager {...data} onChange={setPage} />}
            </>
          )}
        </Resource>
      </StudentPanel>
    </div>
  );
}
export function Certificates({ id }: { id?: string }) {
  const certificates = useResource(
    useCallback(
      (signal: AbortSignal) =>
        id
          ? getCertificate(id, signal).then((x) => [x])
          : getCertificates(signal),
      [id],
    ),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);
  async function copyVerificationCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setError(undefined);
      setCopied(true);
    } catch {
      setError(
        new Error(
          "Không thể sao chép mã xác minh. Hãy chọn mã và sao chép thủ công.",
        ),
      );
    }
  }
  async function download(certificateId: string, number: string) {
    setBusy(true);
    setError(undefined);
    try {
      const blob = await getCertificatePdf(certificateId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${number}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <StudentOutcomeHeading
        title={id ? "Chi tiết chứng nhận" : "Chứng nhận"}
        subtitle={
          id
            ? "Thông tin xác minh và bản PDF chính thức của chứng nhận"
            : "Chứng nhận được cấp sau khi đáp ứng chính sách chương trình"
        }
        action={
          id ? (
            <Link
              className="student-action student-action-secondary"
              href="/intern/certificates"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Quay lại danh sách
            </Link>
          ) : undefined
        }
      />
      {Boolean(error) && <ErrorState error={error} />}
      <Resource resource={certificates}>
        {(data) =>
          data.length ? (
            id ? (
              <CertificateDetail
                certificate={data[0]}
                busy={busy}
                copied={copied}
                onDownload={() =>
                  void download(data[0].id, data[0].certificateNumber)
                }
                onCopy={() =>
                  void copyVerificationCode(data[0].verificationCode)
                }
              />
            ) : (
              <div className="student-cert-grid">
                {data.map((c) => (
                  <article key={c.id} className="student-cert-card">
                    <div className="student-cert-head">
                      <span className="student-cert-seal" aria-hidden="true">
                        <Award size={24} />
                      </span>
                      <div className="min-w-0">
                        <h2>{c.certificateNumber}</h2>
                        <p>
                          {[c.projectName, c.sessionName]
                            .filter(Boolean)
                            .join(" · ") || "Chứng nhận thực tập V-Intern"}
                        </p>
                      </div>
                      <StudentBadge
                        tone={c.status === "issued" ? "green" : "rose"}
                      >
                        {c.status === "issued" ? "Đã cấp" : "Đã thu hồi"}
                      </StudentBadge>
                    </div>
                    <dl className="student-cert-meta">
                      <div>
                        <dt>Ngày cấp</dt>
                        <dd>
                          {new Date(c.issuedAt).toLocaleDateString("vi-VN")}
                        </dd>
                      </div>
                      <div>
                        <dt>Hoàn thành</dt>
                        <dd>
                          {c.completedAt
                            ? new Date(c.completedAt).toLocaleDateString(
                                "vi-VN",
                              )
                            : "Chưa ghi nhận"}
                        </dd>
                      </div>
                      <div>
                        <dt>Chính sách</dt>
                        <dd>
                          {c.policyCode} · v{c.policyVersion}
                        </dd>
                      </div>
                    </dl>
                    {c.status === "revoked" && (
                      <div role="status" className="mt-3">
                        <StudentCallout
                          tone="rose"
                          title="Chứng nhận đã bị thu hồi"
                        >
                          {c.revokedAt &&
                            new Date(c.revokedAt).toLocaleDateString("vi-VN")}
                          {c.revokedAt ? " · " : ""}
                          {c.revokeReason}
                        </StudentCallout>
                      </div>
                    )}
                    <div className="student-cert-actions">
                      <button
                        className="student-action student-action-sm"
                        disabled={busy || c.status !== "issued"}
                        onClick={() => void download(c.id, c.certificateNumber)}
                      >
                        <Download size={15} aria-hidden="true" />
                        {busy ? "Đang tải..." : "Tải PDF"}
                      </button>
                      {!id && (
                        <Link
                          className="student-action student-action-secondary student-action-sm"
                          href={`/intern/certificates/${c.id}`}
                        >
                          Chi tiết
                        </Link>
                      )}
                      <Link
                        className="student-link ml-auto"
                        href={`/verify?code=${encodeURIComponent(c.verificationCode)}`}
                      >
                        <ShieldCheck size={15} aria-hidden="true" />
                        Xác minh công khai
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : (
            <div className="student-outcome-empty-layout">
              <div className="student-panel student-empty">
                <Award size={48} aria-hidden="true" />
                <h3>Chưa có chứng nhận được cấp.</h3>
                <p>
                  Chứng nhận được cấp theo chính sách chương trình sau khi kết
                  quả thực tập được xác nhận.
                </p>
                <div className="mt-5">
                  <StudentLink secondary href="/intern/evaluations">
                    Xem đánh giá của tôi
                  </StudentLink>
                </div>
              </div>
              <StudentPanel title="Điều kiện cấp chứng nhận" icon={ShieldCheck}>
                <ol className="student-step-list">
                  <li>
                    <div>
                      <strong>Hoàn thành chương trình</strong>
                      <p>
                        Các nhiệm vụ và kỳ đánh giá của bạn được giảng viên xác
                        nhận hoàn tất.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Đáp ứng chính sách</strong>
                      <p>
                        Kết quả thực tập đạt điều kiện tối thiểu theo chính sách
                        chương trình đang áp dụng.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Nhận chứng nhận</strong>
                      <p>
                        Chứng nhận có mã xác minh và bản PDF; bạn có thể gửi
                        link xác minh cho nhà tuyển dụng.
                      </p>
                    </div>
                  </li>
                </ol>
              </StudentPanel>
            </div>
          )
        }
      </Resource>
    </>
  );
}
type Certificate = Awaited<ReturnType<typeof getCertificate>>;
function CertificateDetail({
  certificate: c,
  busy,
  copied,
  onDownload,
  onCopy,
}: {
  certificate: Certificate;
  busy: boolean;
  copied: boolean;
  onDownload: () => void;
  onCopy: () => void;
}) {
  const issued = c.status === "issued";
  const issuedAt = new Date(c.issuedAt).toLocaleDateString("vi-VN");
  const completedAt = c.completedAt
    ? new Date(c.completedAt).toLocaleDateString("vi-VN")
    : "Chưa ghi nhận";
  return (
    <div className="student-cert-detail">
      <article
        className="student-cert-document"
        aria-labelledby="certificate-title"
      >
        <div className="student-cert-document-head">
          <span className="student-cert-document-seal" aria-hidden="true">
            <Award size={30} />
          </span>
          <div>
            <p className="student-cert-document-brand">
              V-INTERN · LEARN · BUILD · BELONG
            </p>
            <p className="student-cert-document-type">
              Chứng nhận hoàn thành thực tập
            </p>
          </div>
        </div>
        <h2 id="certificate-title">
          {c.projectName ?? "Chương trình thực tập V-Intern"}
        </h2>
        {c.sessionName && (
          <p className="student-cert-document-session">{c.sessionName}</p>
        )}
        <dl className="student-cert-document-meta">
          <div>
            <dt>Số chứng nhận</dt>
            <dd>{c.certificateNumber}</dd>
          </div>
          <div>
            <dt>Ngày cấp</dt>
            <dd>{issuedAt}</dd>
          </div>
          <div>
            <dt>Hoàn thành</dt>
            <dd>{completedAt}</dd>
          </div>
        </dl>
        <p className="student-cert-document-note">
          Chứng nhận được cấp theo chính sách {c.policyCode} · phiên bản{" "}
          {c.policyVersion}. Mã xác minh công khai ở cột bên cạnh giúp đơn vị
          tuyển dụng kiểm tra tính hợp lệ của chứng nhận.
        </p>
      </article>

      <aside className="student-cert-detail-side">
        <StudentPanel title="Thông tin xác minh" icon={ShieldCheck}>
          <dl className="student-cert-detail-list">
            <div>
              <dt>Trạng thái</dt>
              <dd>
                <StudentBadge tone={issued ? "green" : "rose"}>
                  {issued ? "Đã cấp" : "Đã thu hồi"}
                </StudentBadge>
              </dd>
            </div>
            <div>
              <dt>Dự án</dt>
              <dd>{c.projectName ?? "Chưa ghi nhận"}</dd>
            </div>
            <div>
              <dt>Phiên thực tập</dt>
              <dd>{c.sessionName ?? "Chưa ghi nhận"}</dd>
            </div>
            <div>
              <dt>Chính sách</dt>
              <dd>
                {c.policyCode} · v{c.policyVersion}
              </dd>
            </div>
          </dl>
          <div className="student-cert-code">
            <span>Mã xác minh công khai</span>
            <code>{c.verificationCode}</code>
            <button
              type="button"
              className="student-action student-action-secondary student-action-sm"
              onClick={onCopy}
            >
              {copied ? (
                <Check size={14} aria-hidden="true" />
              ) : (
                <Copy size={14} aria-hidden="true" />
              )}
              {copied ? "Đã sao chép" : "Sao chép mã"}
            </button>
          </div>
          <p className="sr-only" role="status">
            {copied ? "Đã sao chép mã xác minh" : ""}
          </p>
          {c.status === "revoked" && (
            <div className="mt-4">
              <StudentCallout tone="rose" title="Chứng nhận đã bị thu hồi">
                {c.revokedAt
                  ? `${new Date(c.revokedAt).toLocaleDateString("vi-VN")} · `
                  : ""}
                {c.revokeReason ?? "Không có lý do được ghi nhận."}
              </StudentCallout>
            </div>
          )}
        </StudentPanel>

        <StudentPanel title="Tệp chính thức" icon={FileText}>
          <p className="text-[12px] leading-6 text-slate-600">
            Bản PDF có cùng thông tin với chứng nhận trực tuyến và có thể lưu
            trữ hoặc chia sẻ.
          </p>
          <div className="student-cert-detail-actions">
            <button
              type="button"
              className="student-action"
              disabled={busy || !issued}
              onClick={onDownload}
            >
              <Download size={15} aria-hidden="true" />
              {busy ? "Đang tải..." : "Tải PDF"}
            </button>
            <Link
              className="student-action student-action-secondary"
              href={`/verify?code=${encodeURIComponent(c.verificationCode)}`}
            >
              <ShieldCheck size={15} aria-hidden="true" />
              Xác minh công khai
            </Link>
          </div>
        </StudentPanel>
      </aside>
    </div>
  );
}
export function Verify({ initialCode = "" }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [result, setResult] =
      useState<Awaited<ReturnType<typeof verifyCertificate>>>();
  async function verify() {
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    try {
      setResult(await verifyCertificate(code.trim()));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-10 sm:pt-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded text-[15px] font-bold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        V-Intern
      </Link>
      <div className="mt-8">
        <PageTitle
          title="Xác minh chứng nhận"
          subtitle="Nhập mã xác minh in trên chứng nhận để kiểm tra hiệu lực — kết quả đọc trực tiếp từ hệ thống."
        />
      </div>
      <Panel title="Tra cứu theo mã">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <Field
            label="Mã xác minh"
            htmlFor="verify-code"
            required
            hint="Tối đa 128 ký tự; mã nằm ở góc chứng nhận hoặc trong email cấp chứng nhận."
          >
            <input
              id="verify-code"
              required
              maxLength={128}
              value={code}
              placeholder="Dán mã xác minh"
              onChange={(e) => setCode(e.target.value)}
              className={inputClass}
            />
          </Field>
          <button disabled={busy || !code.trim()} className={buttonClass}>
            {busy ? "Đang xác minh..." : "Xác minh"}
          </button>
        </form>
      </Panel>
      {Boolean(error) && (
        <div className="mt-4">
          <ErrorState title="Không thể xác minh" error={error} />
        </div>
      )}
      {result && (
        <div className="mt-4">
          {result.valid ? (
            <Panel title="Chứng nhận hợp lệ">
              <div className="mb-4">
                <StatusDot tone="green">Còn hiệu lực</StatusDot>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <dt className="text-xs text-slate-500">Số chứng nhận</dt>
                  <dd className="mt-1 font-semibold text-navy">
                    {result.certificateNumber}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <dt className="text-xs text-slate-500">Người nhận</dt>
                  <dd className="mt-1 font-semibold text-navy">
                    {result.holderName ?? "Chưa có"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <dt className="text-xs text-slate-500">Vai trò</dt>
                  <dd className="mt-1 text-navy">{result.role ?? "Chưa có"}</dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <dt className="text-xs text-slate-500">Dự án</dt>
                  <dd className="mt-1 text-navy">
                    {result.projectName ?? "Chưa có"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <dt className="text-xs text-slate-500">Phiên thực tập</dt>
                  <dd className="mt-1 text-navy">
                    {result.sessionName ?? "Chưa ghi nhận"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <dt className="text-xs text-slate-500">Ngày hoàn thành</dt>
                  <dd className="mt-1 text-navy">
                    {result.completedAt
                      ? new Date(result.completedAt).toLocaleDateString("vi-VN")
                      : "Chưa ghi nhận"}
                  </dd>
                </div>
              </dl>
            </Panel>
          ) : (
            <Panel title="Chứng nhận đã thu hồi">
              <div className="mb-4">
                <StatusDot tone="red">Không còn hiệu lực</StatusDot>
              </div>
              <p role="status" className="text-sm leading-6 text-rose-700">
                Chứng nhận không còn hiệu lực. Ngày thu hồi:{" "}
                {result.revokedAt
                  ? new Date(result.revokedAt).toLocaleDateString("vi-VN")
                  : "Chưa có"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Số chứng nhận: {result.certificateNumber}
              </p>
            </Panel>
          )}
        </div>
      )}
    </main>
  );
}
export function Notifications() {
  const role = usePathname().split("/")[1];
  const intern = role === "intern";
  const [preferencePending, setPreferencePending] = useState<{
    category: string;
    enabled: boolean;
  }>();
  const [page, setPage] = useState(1),
    [unread, setUnread] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState<string>();
  const notifications = useResource(
    useCallback(
      (signal: AbortSignal) => getNotifications(page, unread, signal),
      [page, unread],
    ),
  );
  const preferences = useResource(
    useCallback(
      (signal: AbortSignal) => getNotificationPreferences(signal),
      [],
    ),
  );
  const preferenceLabels = {
    system: "Hệ thống",
    task: "Nhiệm vụ",
    session: "Phiên thực tập",
    evaluation: "Đánh giá",
    announcement: "Thông báo chung",
    recruitment: "Tuyển dụng",
    kpi: "KPI",
    salary: "Lương ảo",
    certificate: "Chứng nhận",
  };
  async function read(id?: string) {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      if (id) {
        await markNotification(id);
        setNotice('Đã đánh dấu thông báo là đã đọc.');
      } else {
        const updated = await markAllNotifications();
        setNotice(updated ? `Đã đánh dấu ${updated.toLocaleString('vi-VN')} thông báo là đã đọc.` : 'Không có thông báo chưa đọc cần cập nhật.');
      }
      notifications.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <StudentOutcomeHeading
        title="Thông báo"
        subtitle="Cập nhật mới nhất từ phiên thực tập, nhiệm vụ, đánh giá và hệ thống"
        action={
          <button
            disabled={busy}
            className={intern ? "student-action" : buttonClass}
            onClick={() => void read()}
          >
            {intern && <CheckCheck size={16} aria-hidden="true" />}
            {busy && !preferencePending ? 'Đang cập nhật…' : 'Đánh dấu tất cả đã đọc'}
          </button>
        }
      />
      <label
        className={
          intern
            ? "student-filter-chip mb-4"
            : "mb-4 inline-flex cursor-pointer select-none items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-xs transition-colors hover:border-slate-300 focus-within:ring-2 focus-within:ring-blue-600/30"
        }
      >
        <input
          type="checkbox"
          className="size-4 accent-blue-600"
          checked={unread}
          onChange={(e) => {
            setUnread(e.target.checked);
            setPage(1);
          }}
        />
        Chỉ hiện chưa đọc
      </label>
      {Boolean(error) && <ErrorState error={error} />}
      {notice && <InlineAlert tone="success" className="mb-5">{notice}</InlineAlert>}
      <div
        className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_280px]"
      >
        <OutcomeFrame
          intern={intern}
          icon={Bell}
          title={
            <span className="flex items-center gap-2">
              Thông báo của bạn
              {notifications.data && (
                <span className="student-board-count">
                  {notifications.data.total}
                </span>
              )}
            </span>
          }
        >
          <Resource resource={notifications}>
            {(data) => (
              <>
                {data.items.length ? (
                  <div className="workspace-notification-feed">
                    {data.items
                      .map((n) => ({
                        ...n,
                        linkUrl: notificationLinkForRole(n.linkUrl, role),
                      }))
                      .map((n, index) => (
                        <div key={n.id}>
                        {(index === 0 || new Date(data.items[index - 1].createdAt).toLocaleDateString("vi-VN") !== new Date(n.createdAt).toLocaleDateString("vi-VN")) && <p className="workspace-notification-day"><time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleDateString("vi-VN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</time></p>}
                        <article
                          className={
                            intern
                              ? "student-notification"
                              : "workspace-notification"
                          }
                          data-unread={n.readAt ? undefined : "true"}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={
                                intern
                                  ? "student-notification-title"
                                  : "font-semibold text-navy"
                              }
                            >
                              {n.title}
                            </h3>
                            {!n.readAt && intern && (
                              <StudentBadge tone="blue">Chưa đọc</StudentBadge>
                            )}
                            {!n.readAt && !intern && (
                              <StatusDot tone="sky">Chưa đọc</StatusDot>
                            )}
                          </div>
                          <NotificationText
                            body={n.body}
                            className={
                              intern
                                ? "student-notification-body"
                                : "mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600"
                            }
                          />
                          <div
                            className={
                              intern
                                ? "student-notification-foot"
                                : "mt-3 flex flex-wrap items-center justify-between gap-3"
                            }
                          >
                            <time
                              className={
                                intern
                                  ? "student-notification-time"
                                  : "text-xs text-slate-500"
                              }
                              dateTime={n.createdAt}
                            >
                              {new Date(n.createdAt).toLocaleString("vi-VN")}
                            </time>
                            <div className="flex flex-wrap items-center gap-2">
                              {n.linkUrl && (
                                <Link
                                  href={n.linkUrl}
                                  className={
                                    intern
                                      ? "student-action student-action-secondary student-action-sm"
                                      : "rounded text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                                  }
                                >
                                  Mở nội dung
                                  {intern && (
                                    <ArrowUpRight
                                      size={14}
                                      aria-hidden="true"
                                    />
                                  )}
                                </Link>
                              )}
                              {!n.readAt ? (
                                <button
                                  disabled={busy}
                                  aria-label={`Đánh dấu đã đọc: ${n.title}`}
                                  onClick={() => void read(n.id)}
                                  className={
                                    intern
                                      ? "student-action student-action-ghost student-action-sm"
                                      : "rounded text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 disabled:opacity-50"
                                  }
                                >
                                  Đánh dấu đã đọc
                                </button>
                              ) : <span className="notebook-notification-read"><CheckCheck size={13} aria-hidden="true" />Đã đọc</span>}
                            </div>
                          </div>
                        </article>
                        </div>
                      ))}
                  </div>
                ) : intern ? (
                  <div className="student-empty !py-12">
                    <Bell size={34} aria-hidden="true" />
                    <h3>Chưa có thông báo phù hợp</h3>
                    <p>
                      {unread
                        ? "Bạn đã đọc hết thông báo. Bỏ lọc để xem lại toàn bộ."
                        : "Cập nhật từ phiên thực tập, nhiệm vụ và đánh giá sẽ xuất hiện tại đây."}
                    </p>
                  </div>
                ) : (
                  <Empty>Chưa có thông báo phù hợp.</Empty>
                )}
                {data.totalPages > 1 && <Pager {...data} onChange={setPage} />}
              </>
            )}
          </Resource>
        </OutcomeFrame>
        <div>
          <OutcomeFrame
            intern={intern}
            icon={Bell}
            title="Tùy chọn nhận thông báo"
          >
            {role === "intern" && (
              <p className="mb-4 text-xs leading-6 text-slate-500">
                Chọn những cập nhật bạn muốn nhận. Thay đổi sẽ được lưu khi bạn
                bật hoặc tắt từng mục.
              </p>
            )}
            <Resource resource={preferences}>
              {(data) => (
                <div
                  className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-1"
                >
                  {data.map((p) => (
                    <label
                      key={p.category}
                      className={
                        intern
                          ? "student-pref-row notebook-pref-row"
                          : "notebook-pref-row"
                      }
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-blue-600"
                        checked={
                          preferencePending?.category === p.category
                            ? preferencePending.enabled
                            : p.enabled
                        }
                        disabled={busy}
                        onChange={async (e) => {
                          const enabled = e.target.checked;
                          setPreferencePending({
                            category: p.category,
                            enabled,
                          });
                          setBusy(true);
                          setError(undefined);
                          setNotice(undefined);
                          try {
                            await setNotificationPreference(
                              p.category,
                              enabled,
                            );
                            setNotice(`Đã ${enabled ? 'bật' : 'tắt'} thông báo ${preferenceLabels[p.category].toLowerCase()}.`);
                            preferences.reload();
                          } catch (e) {
                            setError(e);
                          } finally {
                            setBusy(false);
                            setPreferencePending(undefined);
                          }
                        }}
                      />
                      {preferenceLabels[p.category]}
                    </label>
                  ))}
                </div>
              )}
            </Resource>
          </OutcomeFrame>
        </div>
      </div>
    </>
  );
}
export function Recommendations() {
  const recommendations = useResource(
    useCallback((signal: AbortSignal) => getRecommendations(signal), []),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  async function refresh() {
    setBusy(true);
    setError(undefined);
    try {
      await refreshRecommendations();
      recommendations.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <StudentOutcomeHeading
        title="Khuyến nghị phát triển"
        subtitle="Gợi ý AI từ các chỉ số thực tế, không thay đổi đánh giá/KPI"
        action={
          <button
            className="student-action"
            disabled={busy}
            onClick={() => void refresh()}
          >
            <Sparkles size={16} aria-hidden="true" />
            {busy ? "Đang cập nhật..." : "Cập nhật khuyến nghị"}
          </button>
        }
      />
      {Boolean(error) && <ErrorState error={error} />}{" "}
      {recommendations.error instanceof ApiError &&
      recommendations.error.statusCode === 404 ? (
        <div className="student-dashboard-grid">
          <div className="student-panel student-chat-welcome">
            <Sparkles size={42} className="text-blue-600" aria-hidden="true" />
            <h2>Một kế hoạch phát triển dành cho bạn</h2>
            <p>
              Chưa có khuyến nghị. Cập nhật để yêu cầu AI phân tích dữ liệu hiện
              tại: kết quả công việc, điểm đã chốt và các chỉ số hiệu suất.
            </p>
            <div className="mt-5">
              <StudentLink secondary href="/intern/performance">
                Xem hiệu suất của tôi
              </StudentLink>
            </div>
          </div>
          <StudentPanel title="Dữ liệu được dùng" icon={Info}>
            <ol className="student-step-list">
              <li>
                <div>
                  <strong>Kết quả công việc</strong>
                  <p>
                    Nhiệm vụ đã hoàn thành và được giảng viên xác nhận trong
                    phiên thực tập.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Điểm đánh giá đã chốt</strong>
                  <p>
                    Chỉ điểm chính thức được khóa theo kỳ, không dùng điểm tạm
                    hoặc dữ liệu nháp.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Chỉ số hiệu suất</strong>
                  <p>
                    Tiến độ, chất lượng và đúng hạn được tổng hợp từ dữ liệu
                    thật của bạn.
                  </p>
                </div>
              </li>
            </ol>
            <p className="mt-4 text-[11px] leading-6 text-slate-500">
              Khuyến nghị chỉ giúp định hướng học tập, không thay đổi điểm số
              hay KPI.
            </p>
          </StudentPanel>
        </div>
      ) : (
        <Resource resource={recommendations}>
          {(data) => (
            <div className="student-stack">
              <StudentPanel
                title="Tổng hợp AI"
                icon={Sparkles}
                className="student-panel-accent"
                description={`Tạo lúc ${new Date(data.createdAt).toLocaleString("vi-VN")}`}
              >
                <p className="text-[13px] leading-8 text-slate-600">
                  {data.summary}
                </p>
              </StudentPanel>
              {data.recommendations.map((r, i) => (
                <StudentPanel
                  key={i}
                  title={r.title}
                  icon={Target}
                  action={
                    <StudentBadge
                      tone={
                        r.priority === "high"
                          ? "rose"
                          : r.priority === "medium"
                            ? "amber"
                            : "slate"
                      }
                    >
                      {{
                        high: "Ưu tiên cao",
                        medium: "Ưu tiên vừa",
                        low: "Ưu tiên thấp",
                      }[r.priority] ?? r.priority}
                    </StudentBadge>
                  }
                >
                  <p className="text-[12.5px] leading-7 text-slate-600">
                    {r.reason}
                  </p>
                  <ol className="student-step-list mt-4">
                    {r.actions.map((a) => (
                      <li key={a}>
                        <div>
                          <p>{a}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-[10.5px] text-slate-500">
                    Chỉ số tham chiếu:{" "}
                    {r.evidenceMetricCodes
                      .map((code) => kpiMetricLabels[code] ?? code)
                      .join(", ")}
                  </p>
                </StudentPanel>
              ))}
            </div>
          )}
        </Resource>
      )}
    </>
  );
}
export function Profile() {
  const pathname = usePathname();
  const intern = pathname.startsWith("/intern");
  const instructor = pathname.startsWith("/instructor");
  const workspaceRole = intern ? "intern" : "instructor";
  const [user, setUser] = useState(() => getSessionUser());
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "danger";
    text: string;
  } | null>(null);

  async function refresh() {
    setBusy(true);
    setFeedback(null);
    try {
      const next = await refreshSession();
      if (!next) {
        setFeedback({
          tone: "danger",
          text: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        });
      } else {
        setUser(next);
        setFeedback({
          tone: "success",
          text: "Đã cập nhật thông tin tài khoản từ hệ thống.",
        });
      }
    } catch (cause) {
      setFeedback({ tone: "danger", text: errorMessage(cause) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StudentOutcomeHeading
        title="Hồ sơ"
        subtitle="Thông tin tài khoản được xác minh từ hệ thống"
        action={
          <button
            type="button"
            className={
              intern ? "student-action student-action-secondary" : buttonClass
            }
            disabled={busy}
            onClick={() => void refresh()}
          >
            {intern && <RefreshCw size={15} aria-hidden="true" />}
            {busy ? "Đang làm mới..." : "Làm mới"}
          </button>
        }
      />
      {feedback && (
        <div className="mb-4">
          <InlineAlert tone={feedback.tone}>{feedback.text}</InlineAlert>
        </div>
      )}
      {(intern || instructor) && user && (
        <div className="workspace-profile-identity">
          <div className="flex min-w-0 items-center gap-4">
            <span className="workspace-profile-avatar" aria-hidden="true">
              {user.displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi")}
            </span>
            <div className="min-w-0">
              <h2>{user.displayName}</h2>
              <p className="break-all">{user.email}</p>
            </div>
          </div>
          <StudentLink secondary href={`/${workspaceRole}/github`}>
            Liên kết GitHub
          </StudentLink>
        </div>
      )}
      <div className={intern || instructor ? "workspace-profile-grid" : undefined}>
        <OutcomeFrame intern={intern} icon={UserRound} title="Tài khoản">
          <dl className="workspace-profile-info grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Họ tên
              </dt>
              <dd className="mt-1.5 font-semibold text-navy">
                {user?.displayName ?? "—"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Email
              </dt>
              <dd className="mt-1.5 break-all text-navy">
                {user?.email ?? "—"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Vai trò
              </dt>
              <dd className="mt-1.5 text-navy">
                {user?.roles.length
                  ? user.roles
                      .map(
                        (role) =>
                          ({
                            intern: "Sinh viên",
                            instructor: "Giảng viên",
                            admin: "Quản trị viên",
                          })[role] ?? role,
                      )
                      .join(", ")
                  : "Chưa gán vai trò"}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-slate-500">
            Liên hệ quản trị viên để cập nhật tài khoản.
          </p>
        </OutcomeFrame>
        {(intern || instructor) && (
          <StudentPanel title="Kết nối & hỗ trợ" icon={Info}>
            <div className="student-profile-links">
              <StudentLink secondary href={`/${workspaceRole}/github`}>
                Kiểm tra liên kết GitHub
              </StudentLink>
              <StudentLink secondary href={`/${workspaceRole}/notifications`}>
                Xem thông báo cập nhật
              </StudentLink>
              <StudentLink secondary href={`/${workspaceRole}/performance`}>
                Xem hiệu suất thực tập
              </StudentLink>
            </div>
            <p className="mt-5 text-xs leading-6 text-slate-500">
              Hồ sơ được đọc trực tiếp từ tài khoản V-Intern. Tài khoản không
              chứa mật khẩu GitHub; liên kết repository được xác minh trên trang
              GitHub.
            </p>
          </StudentPanel>
        )}
      </div>
    </>
  );
}
