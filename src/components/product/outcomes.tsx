"use client";
import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useResource } from "@/lib/api/use-resource";
import { ApiError } from "@/lib/auth/api-client";
import { getSessionUser } from "@/lib/auth/session";
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
import {
  Badge,
  buttonClass,
  Empty,
  inputClass,
  PageTitle,
  Pager,
  Panel,
} from "./primitives";
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
      className={`grid gap-3 sm:grid-cols-2 ${values.length === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}
    >
      {values.map(([name, value]) => (
        <div
          key={name}
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <dt className="text-sm text-slate-500">{name}</dt>
          <dd
            className={`mt-3 text-2xl font-bold ${value === null ? "text-slate-400" : "text-navy"}`}
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
      <PageTitle
        title="Đánh giá của tôi"
        subtitle="Chỉ hiển thị kết quả đã được giảng viên chốt chính thức"
      />
      <Resource resource={evaluations}>
        {(data) =>
          data.length ? (
            <div className="space-y-4">
              {data.map((e) => (
                <Panel
                  key={e.id}
                  title={`Điểm chính thức: ${e.overallScore ?? "Chưa có"}/100`}
                  action={
                    !id && (
                      <Link
                        className="text-sm text-blue-600"
                        href={`/intern/evaluations/${e.id}`}
                      >
                        Chi tiết
                      </Link>
                    )
                  }
                >
                  <div className="flex flex-wrap gap-3 text-sm">
                    <Badge>Đã chốt</Badge>
                    <span>Lần hiệu chỉnh: {e.revisionNumber}</span>
                    <time>
                      {e.finalizedAt &&
                        new Date(e.finalizedAt).toLocaleString("vi-VN")}
                    </time>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm">
                    {e.summary ?? "Chưa có nhận xét."}
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-3">Tiêu chí</th>
                          <th className="p-3">Điểm</th>
                          <th className="p-3">Nhận xét</th>
                        </tr>
                      </thead>
                      <tbody>
                        {e.scores.map((s) => (
                          <tr key={s.id} className="border-b border-slate-100">
                            <td className="p-3 break-all">{s.criterionId}</td>
                            <td className="p-3 font-semibold">{s.score}</td>
                            <td className="p-3">{s.comment ?? "Chưa có"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              ))}
            </div>
          ) : (
            <Empty>Chưa có đánh giá được chốt.</Empty>
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
      <PageTitle
        title="Hiệu suất của tôi"
        subtitle="Chỉ số được tính từ nhiệm vụ và đánh giá chính thức"
      />
      <Resource resource={performance}>
        {(m) => (
          <>
            <Metrics
              values={[
                ["Nhiệm vụ được giao", m.totalTaskCount],
                ["Đã hoàn thành", m.completedTaskCount],
                ["Hoàn thành (%)", m.taskCompletionRate],
                ["Điểm đánh giá trung bình", m.averageEvaluationScore],
                ["Story points cam kết", m.committedStoryPoints],
                ["Story points hoàn thành", m.completedStoryPoints],
                ["Đúng hạn (%)", m.onTimeCompletionRate],
                ["Nhiệm vụ đang quá hạn", m.overdueOpenTaskCount],
                ["Sprint hiện tại (%)", m.activeSprintProgress],
              ]}
            />
            <p className="mt-4 text-sm text-slate-500">
              Chưa đo được nghĩa là chưa có đủ dữ liệu. Hệ thống không suy diễn
              xu hướng từ một thời điểm.
            </p>
          </>
        )}
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
      <PageTitle
        title="KPI & Lương ảo"
        subtitle="Điểm KPI có nguồn tính rõ ràng · Lương ảo phục vụ chương trình thực tập"
      />
      <Resource resource={results}>
        {(data) =>
          data.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.map((k) => (
                <Panel
                  key={k.id}
                  title={`KPI: ${k.finalScore ?? "Chưa đủ dữ liệu"}`}
                  action={
                    !id && (
                      <Link
                        className="text-sm text-blue-600"
                        href={`/intern/kpi/${k.id}`}
                      >
                        Nguồn tính
                      </Link>
                    )
                  }
                >
                  <Badge>{k.ruleVersion}</Badge>
                  <p className="mt-2 text-sm">
                    {new Date(k.calculatedAt).toLocaleString("vi-VN")}
                  </p>
                  {"metrics" in k && Array.isArray(k.metrics) && (
                    <div className="mt-4 space-y-3">
                      {k.metrics.map((m) => (
                        <div
                          key={m.metricCode}
                          className="rounded-lg bg-slate-50 p-3 text-sm"
                        >
                          <strong>{m.metricCode}</strong>
                          <p>
                            Giá trị: {m.sourceValue ?? "Chưa đo được"} · Trọng
                            số: {m.effectiveWeight ?? "Chưa có"}% · Đóng góp:{" "}
                            {m.weightedContribution ?? "Chưa có"}
                          </p>
                          <details className="mt-2">
                            <summary>Nguồn dữ liệu</summary>
                            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-xs">
                              {m.sourceJson}
                            </pre>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              ))}
            </div>
          ) : (
            <Empty>Chưa có kết quả KPI.</Empty>
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
    <div className="space-y-4">
      <Panel title="Lương ảo">
        <p className="mb-4 text-sm text-slate-500">
          Đơn vị ảo, không phải tiền lương thực tế.
        </p>
        <Resource resource={balance}>
          {(b) => (
            <dl className="flex flex-wrap gap-8">
              <div>
                <dt className="text-sm text-slate-500">
                  Số dư từ sổ giao dịch
                </dt>
                <dd className="mt-2 text-2xl font-bold text-blue-600">
                  {b.balance.toLocaleString("vi-VN")}{" "}
                  <span className="text-sm">{b.unit}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Tích lũy từ KPI</dt>
                <dd className="mt-2 text-xl font-bold">
                  {b.earnedThisPeriod.toLocaleString("vi-VN")} {b.unit}
                </dd>
              </div>
            </dl>
          )}
        </Resource>
      </Panel>
      <Panel title="Sổ giao dịch">
        <Resource resource={ledger}>
          {(data) => (
            <>
              {data.items.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Thời gian", "Loại", "Số tiền ảo", "Nội dung"].map(
                          (x) => (
                            <th key={x} className="p-3">
                              {x}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((l) => (
                        <tr key={l.id} className="border-b border-slate-100">
                          <td className="p-3 whitespace-nowrap">
                            {new Date(l.createdAt).toLocaleString("vi-VN")}
                          </td>
                          <td className="p-3">
                            <Badge>{l.type}</Badge>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {l.amount.toLocaleString("vi-VN")} {l.unit}
                          </td>
                          <td className="p-3">{l.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>Chưa có giao dịch lương ảo.</Empty>
              )}
              <Pager {...data} onChange={setPage} />
            </>
          )}
        </Resource>
      </Panel>
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
    [error, setError] = useState<unknown>();
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
      <PageTitle
        title="Chứng nhận"
        subtitle="Chứng nhận được cấp sau khi đáp ứng chính sách chương trình"
      />
      {Boolean(error) && <ErrorState error={error} />}
      <Resource resource={certificates}>
        {(data) =>
          data.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.map((c) => (
                <Panel key={c.id} title={c.certificateNumber}>
                  <Badge>
                    {c.status === "issued" ? "Đã cấp" : "Đã thu hồi"}
                  </Badge>
                  <p className="mt-3 text-sm">
                    Ngày cấp: {new Date(c.issuedAt).toLocaleDateString("vi-VN")}
                  </p>
                  <p className="mt-2 text-sm">Hoàn thành: {c.completedAt ? new Date(c.completedAt).toLocaleDateString('vi-VN') : 'Chưa ghi nhận ngày hoàn thành'}</p>
                  {(c.projectName || c.sessionName) && <p className="mt-2 break-words text-sm text-slate-600">{[c.projectName, c.sessionName].filter(Boolean).join(' · ')}</p>}
                  <p className="mt-2 text-xs text-slate-500">
                    {c.policyCode} · phiên bản {c.policyVersion}
                  </p>
                  {c.status === "revoked" && (
                    <p
                      role="status"
                      className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                    >
                      Đã thu hồi{" "}
                      {c.revokedAt &&
                        new Date(c.revokedAt).toLocaleDateString("vi-VN")}
                      : {c.revokeReason}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {!id && (
                      <Link
                        className="text-sm text-blue-600"
                        href={`/intern/certificates/${c.id}`}
                      >
                        Chi tiết
                      </Link>
                    )}
                    <Link
                      className="text-sm text-blue-600"
                      href={`/verify?code=${encodeURIComponent(c.verificationCode)}`}
                    >
                      Xác minh công khai
                    </Link>
                    <button
                      className={buttonClass}
                      disabled={busy || c.status !== "issued"}
                      onClick={() => void download(c.id, c.certificateNumber)}
                    >
                      Tải PDF
                    </button>
                  </div>
                </Panel>
              ))}
            </div>
          ) : (
            <Empty>Chưa có chứng nhận được cấp.</Empty>
          )
        }
      </Resource>
    </>
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
    <main className="mx-auto min-h-dvh max-w-2xl p-6 sm:pt-20">
      <Link href="/" className="font-bold text-blue-600">
        V-Intern
      </Link>
      <div className="mt-8">
        <PageTitle
          title="Xác minh chứng nhận"
          subtitle="Tra cứu bằng mã xác minh trên chứng nhận"
        />
      </div>
      <Panel title="Mã xác minh">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <label className="block text-sm">
            Mã xác minh
            <input
              required
              maxLength={128}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`${inputClass} mt-2`}
            />
          </label>
          <button disabled={busy || !code.trim()} className={buttonClass}>
            {busy ? "Đang xác minh..." : "Xác minh"}
          </button>
        </form>
      </Panel>
      {Boolean(error) && <ErrorState error={error} />}{" "}
      {result && (
        <div className="mt-4">
          <Panel
            title={result.valid ? "Chứng nhận hợp lệ" : "Chứng nhận đã thu hồi"}
          >
            <dl className="space-y-3 text-sm">
              <div>
                <dt>Số chứng nhận</dt>
                <dd className="font-semibold">{result.certificateNumber}</dd>
              </div>
              {result.valid ? (
                <>
                  <div>
                    <dt>Người nhận</dt>
                    <dd>{result.holderName ?? "Chưa có"}</dd>
                  </div>
                  <div>
                    <dt>Vai trò</dt>
                    <dd>{result.role ?? "Chưa có"}</dd>
                  </div>
                  <div>
                    <dt>Dự án</dt>
                    <dd>{result.projectName ?? "Chưa có"}</dd>
                  </div>
                  <div><dt>Phiên thực tập</dt><dd>{result.sessionName ?? 'Chưa ghi nhận'}</dd></div>
                  <div><dt>Ngày hoàn thành</dt><dd>{result.completedAt ? new Date(result.completedAt).toLocaleDateString('vi-VN') : 'Chưa ghi nhận'}</dd></div>
                </>
              ) : (
                <p role="status" className="text-red-700">
                  Chứng nhận không còn hiệu lực. Ngày thu hồi:{" "}
                  {result.revokedAt
                    ? new Date(result.revokedAt).toLocaleDateString("vi-VN")
                    : "Chưa có"}
                </p>
              )}
            </dl>
          </Panel>
        </div>
      )}
    </main>
  );
}
export function Notifications() {
  const role = usePathname().split("/")[1];
  const [preferencePending, setPreferencePending] = useState<{
    category: string;
    enabled: boolean;
  }>();
  const [page, setPage] = useState(1),
    [unread, setUnread] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
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
    try {
      if (id) await markNotification(id);
      else await markAllNotifications();
      notifications.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Thông báo"
        action={
          <button
            disabled={busy}
            className={buttonClass}
            onClick={() => void read()}
          >
            Đánh dấu tất cả đã đọc
          </button>
        }
      />
      <label className="mb-4 flex gap-2 text-sm">
        <input
          type="checkbox"
          checked={unread}
          onChange={(e) => {
            setUnread(e.target.checked);
            setPage(1);
          }}
        />
        Chỉ chưa đọc
      </label>
      {Boolean(error) && <ErrorState error={error} />}
      <Panel title="Thông báo của bạn">
        <Resource resource={notifications}>
          {(data) => (
            <>
              {data.items.length ? (
                <div className="space-y-3">
                  {data.items
                    .map((n) => ({
                      ...n,
                      linkUrl: notificationLinkForRole(n.linkUrl, role),
                    }))
                    .map((n) => (
                      <article
                        key={n.id}
                        className={`rounded-lg border p-4 ${n.readAt ? "border-slate-100" : "border-blue-200 bg-blue-50/50"}`}
                      >
                        <h3 className="font-semibold text-navy">{n.title}</h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm">
                          {n.body}
                        </p>
                        <time className="mt-2 block text-xs text-slate-400">
                          {new Date(n.createdAt).toLocaleString("vi-VN")}
                        </time>
                        <div className="mt-3 flex gap-3">
                          {n.linkUrl && (
                            <Link
                              href={n.linkUrl}
                              className="text-sm text-blue-600"
                            >
                              Mở nội dung
                            </Link>
                          )}
                          {!n.readAt && (
                            <button
                              disabled={busy}
                              onClick={() => void read(n.id)}
                              className="text-sm text-blue-600"
                            >
                              Đã đọc
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              ) : (
                <Empty>Chưa có thông báo phù hợp.</Empty>
              )}
              <Pager {...data} onChange={setPage} />
            </>
          )}
        </Resource>
      </Panel>
      <div className="mt-5">
        <Panel title="Tùy chọn nhận thông báo">
          <Resource resource={preferences}>
            {(data) => (
              <div className="grid gap-3 sm:grid-cols-3">
                {data.map((p) => (
                  <label
                    key={p.category}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={
                        preferencePending?.category === p.category
                          ? preferencePending.enabled
                          : p.enabled
                      }
                      disabled={busy}
                      onChange={async (e) => {
                        const enabled = e.target.checked;
                        setPreferencePending({ category: p.category, enabled });
                        setBusy(true);
                        setError(undefined);
                        try {
                          await setNotificationPreference(p.category, enabled);
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
        </Panel>
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
      <PageTitle
        title="Khuyến nghị phát triển"
        subtitle="Gợi ý AI từ các chỉ số thực tế, không thay đổi đánh giá/KPI"
        action={
          <button
            className={buttonClass}
            disabled={busy}
            onClick={() => void refresh()}
          >
            {busy ? "Đang cập nhật..." : "Cập nhật khuyến nghị"}
          </button>
        }
      />
      {Boolean(error) && <ErrorState error={error} />}{" "}
      {recommendations.error instanceof ApiError &&
      recommendations.error.statusCode === 404 ? (
        <Empty>
          Chưa có khuyến nghị. Cập nhật để yêu cầu AI phân tích dữ liệu hiện
          tại.
        </Empty>
      ) : (
        <Resource resource={recommendations}>
          {(data) => (
            <div className="space-y-4">
              <Panel title="Tổng hợp AI">
                <p className="text-sm">{data.summary}</p>
                <time className="mt-2 block text-xs text-slate-400">
                  {new Date(data.createdAt).toLocaleString("vi-VN")}
                </time>
              </Panel>
              {data.recommendations.map((r, i) => (
                <Panel key={i} title={r.title}>
                  <Badge>{r.priority}</Badge>
                  <p className="mt-3 text-sm">{r.reason}</p>
                  <ul className="mt-3 list-inside list-disc text-sm">
                    {r.actions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-slate-400">
                    Chỉ số tham chiếu: {r.evidenceMetricCodes.join(", ")}
                  </p>
                </Panel>
              ))}
            </div>
          )}
        </Resource>
      )}
    </>
  );
}
export function Profile() {
  const user = getSessionUser();
  return (
    <>
      <PageTitle
        title="Hồ sơ"
        subtitle="Thông tin tài khoản được xác minh từ hệ thống"
      />
      <Panel title="Tài khoản">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-slate-500">Họ tên</dt>
            <dd className="mt-1 font-semibold">{user?.displayName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="mt-1 break-all">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Vai trò</dt>
            <dd className="mt-1">{user?.roles.join(", ")}</dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-slate-500">
          Liên hệ quản trị viên để cập nhật tài khoản.
        </p>
      </Panel>
    </>
  );
}
