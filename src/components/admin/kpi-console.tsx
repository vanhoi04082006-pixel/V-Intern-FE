"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarRange, Calculator, Lock, Plus, Trophy } from "lucide-react";
import {
  calculateKpiPeriod,
  createKpiPeriod,
  finalizeKpiPeriod,
  getKpiResult,
  kpiPeriodStatuses,
  listKpiPeriods,
  listKpiResults,
  transitionKpiPeriod,
  updateKpiPeriod,
  type KpiPeriod,
  type KpiResultRow,
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
import { useInternNames } from "./use-intern-names";

export const kpiStatusLabels: Record<KpiPeriod["status"], string> = {
  draft: "Bản nháp",
  open: "Đang mở",
  calculating: "Đang tính",
  finalized: "Đã chốt",
  closed: "Đã đóng",
};

const kpiStatusTones: Record<KpiPeriod["status"], "gray" | "blue" | "amber" | "green" | "red"> = {
  draft: "gray",
  open: "blue",
  calculating: "amber",
  finalized: "green",
  closed: "red",
};

/** One shared directory of intern names for results and consoles. */

const dateInput = (value: string) => value.slice(0, 10);

export function KpiConsole() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [editor, setEditor] = useState<KpiPeriod | "new" | null>(null);
  const [results, setResults] = useState<KpiPeriod | null>(null);
  const [notice, setNotice] = useState("");
  const [busyPeriod, setBusyPeriod] = useState<
    | { id: string; phase: "calculate" | "finalize" }
    | null
  >(null);
  const action = useAction();

  const periods = useResource(
    useCallback(
      (signal: AbortSignal) => listKpiPeriods(status, page, signal),
      [status, page],
    ),
  );

  const saved = (message: string) => {
    setEditor(null);
    setNotice(message);
    periods.reload();
  };

  /** Run calculate/finalize for one period with its own pending row state. */
  const runPeriodAction = (
    period: KpiPeriod,
    phase: "calculate" | "finalize",
    run: () => Promise<string>,
  ) => {
    void action.run(async () => {
      setBusyPeriod({ id: period.id, phase });
      try {
        saved(await run());
      } finally {
        setBusyPeriod(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="Kỳ KPI"
        subtitle="Tạo kỳ đo lường, tính KPI theo quy tắc kpi-v1 và chốt kỳ để sinh lương ảo cũng như cấp chứng nhận. Kỳ đã chốt không tính lại."
        action={
          <button
            className={buttonClass}
            onClick={() => {
              setNotice("");
              setEditor("new");
            }}
          >
            <Plus size={16} aria-hidden />
            Thêm kỳ KPI
          </button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <p className="max-w-2xl text-body leading-6 text-muted-foreground">
          Quy trình: tạo bản nháp → mở kỳ → tính KPI (có thể tính lại khi còn mở) → chốt kỳ. Kết quả
          thiếu dữ liệu được ghi nhận trung thực, không suy diễn số liệu.
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
            {kpiPeriodStatuses.map((s) => (
              <option key={s} value={s}>
                {kpiStatusLabels[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {periods.loading && !periods.data ? (
        <LoadingState />
      ) : periods.error ? (
        <ErrorState error={periods.error} onRetry={periods.reload} />
      ) : periods.data?.items.length ? (
        <ul className="divide-y divide-border border-y border-border" aria-label="Danh sách kỳ KPI">
          {periods.data.items.map((period) => {
            const calculating =
                busyPeriod?.id === period.id && busyPeriod.phase === "calculate",
              finalizing =
                busyPeriod?.id === period.id && busyPeriod.phase === "finalize";
            return (
            <li
              key={period.id}
              className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_13rem_auto] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-subsection font-semibold text-foreground">{period.name}</h2>
                  <span className="break-all font-mono text-caption text-muted-foreground">
                    {period.code}
                  </span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
                  <CalendarRange size={14} aria-hidden />
                  {dateInput(period.startDate)} → {dateInput(period.endDate)} · quy tắc{" "}
                  <span className="font-mono">{period.ruleVersion}</span>
                </p>
              </div>
              <div className="space-y-1">
                <StatusDot tone={kpiStatusTones[period.status]}>
                  {kpiStatusLabels[period.status]}
                </StatusDot>
                {(period.status === "calculating" || calculating) && (
                  <p className="text-caption text-muted-foreground">Đợt tính đang chạy…</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-body">
                {period.status === "draft" && (
                  <button
                    className="font-semibold text-primary hover:underline"
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(async () => {
                        await transitionKpiPeriod(period.id, "open");
                        saved(`Đã mở kỳ ${period.name}.`);
                      })
                    }
                  >
                    Mở kỳ
                  </button>
                )}
                {(period.status === "draft" || period.status === "open") && (
                  <button
                    className="font-semibold text-primary hover:underline"
                    aria-label={`Sửa ${period.name}`}
                    onClick={() => {
                      setNotice("");
                      setEditor(period);
                    }}
                  >
                    Sửa
                  </button>
                )}
                {period.status === "open" && (
                  <>
                    <button
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:cursor-wait disabled:opacity-60"
                      aria-label={`Tính KPI ${period.name}`}
                      aria-busy={calculating}
                      disabled={action.busy}
                      onClick={() =>
                        runPeriodAction(period, "calculate", async () => {
                          const outcome = await calculateKpiPeriod(period.id);
                          return `Đã tính ${outcome.calculated} kết quả, ${outcome.insufficientData} sinh viên thiếu dữ liệu.`;
                        })
                      }
                    >
                      <Calculator size={15} aria-hidden />
                      {calculating ? "Đang tính…" : "Tính KPI"}
                    </button>
                    <button
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:cursor-wait disabled:opacity-60"
                      aria-label={`Chốt kỳ ${period.name}`}
                      aria-busy={finalizing}
                      disabled={action.busy}
                      onClick={() =>
                        runPeriodAction(period, "finalize", async () => {
                          await finalizeKpiPeriod(period.id);
                          return `Đã chốt kỳ ${period.name}.`;
                        })
                      }
                    >
                      <Lock size={15} aria-hidden />
                      {finalizing ? "Đang chốt…" : "Chốt kỳ"}
                    </button>
                  </>
                )}
                <button
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  aria-label={`Kết quả ${period.name}`}
                  onClick={() => {
                    setNotice("");
                    setResults(period);
                  }}
                >
                  <Trophy size={15} aria-hidden />
                  Kết quả
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      ) : (
        <Empty>Chưa có kỳ KPI nào. Tạo bản nháp để bắt đầu một kỳ đo lường.</Empty>
      )}
      {periods.data && (
        <Pager
          page={page}
          total={periods.data.total}
          totalPages={Math.ceil(periods.data.total / periods.data.pageSize)}
          onChange={setPage}
          unit="kỳ"
        />
      )}
      {Boolean(action.error) && <ErrorState error={action.error} />}

      {editor && (
        <Modal
          title={editor === "new" ? "Thêm kỳ KPI" : `Sửa ${editor.name}`}
          onClose={() => setEditor(null)}
        >
          <KpiPeriodForm period={editor === "new" ? undefined : editor} onSaved={saved} />
        </Modal>
      )}
      {results && (
        <Modal title={`Kết quả · ${results.name}`} wide onClose={() => setResults(null)}>
          <KpiResults period={results} />
        </Modal>
      )}
    </div>
  );
}

function KpiPeriodForm({
  period,
  onSaved,
}: {
  period?: KpiPeriod;
  onSaved: (message: string) => void;
}) {
  const action = useAction();
  const [form, setForm] = useState({
    code: period?.code ?? "",
    name: period?.name ?? "",
    startDate: period ? dateInput(period.startDate) : "",
    endDate: period ? dateInput(period.endDate) : "",
  });
  const submit = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.startDate || !form.endDate) return;
    const body = {
      code: form.code.trim(),
      name: form.name.trim(),
      startDate: new Date(`${form.startDate}T00:00:00Z`).toISOString(),
      endDate: new Date(`${form.endDate}T00:00:00Z`).toISOString(),
    };
    if (period) await updateKpiPeriod(period.id, body);
    else await createKpiPeriod(body);
    onSaved(period ? `Đã cập nhật ${body.name}.` : `Đã tạo kỳ ${body.name}.`);
  };
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void action.run(submit);
      }}
    >
      <label className="block text-body font-medium">
        Mã kỳ <span className="text-destructive">*</span>
        <input
          className={inputClass}
          value={form.code}
          maxLength={64}
          required
          readOnly={Boolean(period)}
          placeholder="KPI-2026-Q1"
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />
      </label>
      <label className="block text-body font-medium">
        Tên kỳ <span className="text-destructive">*</span>
        <input
          className={inputClass}
          value={form.name}
          maxLength={256}
          required
          placeholder="KPI quý 1 năm 2026"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-body font-medium">
          Bắt đầu (UTC) <span className="text-destructive">*</span>
          <input
            type="date"
            className={inputClass}
            value={form.startDate}
            required
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </label>
        <label className="block text-body font-medium">
          Kết thúc (UTC) <span className="text-destructive">*</span>
          <input
            type="date"
            className={inputClass}
            value={form.endDate}
            required
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </label>
      </div>
      <p className="text-caption leading-5 text-muted-foreground">
        Mã kỳ và quy tắc tính không đổi sau khi tạo. Ngày kết thúc là độc quyền (UTC).
      </p>
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <button className={buttonClass} disabled={action.busy} type="submit">
        {action.busy ? "Đang lưu…" : period ? "Lưu thay đổi" : "Tạo kỳ KPI"}
      </button>
    </form>
  );
}

function KpiResults({ period }: { period: KpiPeriod }) {
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<KpiResultRow | null>(null);
  const names = useInternNames();
  const results = useResource(
    useCallback((signal: AbortSignal) => listKpiResults(period.id, page, signal), [period.id, page]),
  );
  const nameOf = (userId: string) => names.data?.get(userId) ?? userId.slice(0, 8);
  return (
    <>
      <p className="mb-4 text-body leading-6 text-muted-foreground">
        Kết quả được sắp xếp theo điểm cao nhất. Sinh viên thiếu dữ liệu nền tảng được ghi nhận là
        “Thiếu dữ liệu” thay vì phóng điểm.
      </p>
      {results.loading && !results.data ? (
        <LoadingState />
      ) : results.error ? (
        <ErrorState error={results.error} onRetry={results.reload} />
      ) : results.data?.items.length ? (
        <div className="overflow-x-auto border-y border-border">
          <table className="product-table w-full border-collapse text-body">
            <thead>
              <tr>
                <th className="whitespace-nowrap border-b border-border/70 bg-background/80 px-4 py-3 text-left text-caption font-semibold text-muted-foreground">
                  #
                </th>
                <th className="whitespace-nowrap border-b border-border/70 bg-background/80 px-4 py-3 text-left text-caption font-semibold text-muted-foreground">
                  Sinh viên
                </th>
                <th className="whitespace-nowrap border-b border-border/70 bg-background/80 px-4 py-3 text-left text-caption font-semibold text-muted-foreground">
                  Điểm KPI
                </th>
                <th className="whitespace-nowrap border-b border-border/70 bg-background/80 px-4 py-3 text-left text-caption font-semibold text-muted-foreground">
                  Trạng thái
                </th>
                <th className="whitespace-nowrap border-b border-border/70 bg-background/80 px-4 py-3 text-left text-caption font-semibold text-muted-foreground">
                  Tính lúc
                </th>
                <th aria-hidden />
              </tr>
            </thead>
            <tbody>
              {results.data.items.map((row, index) => (
                <tr key={row.id} className="transition-colors hover:bg-background/70">
                  <td className="border-b border-border px-4 py-3 tabular-nums text-muted-foreground">
                    {(page - 1) * results.data!.pageSize + index + 1}
                  </td>
                  <td className="border-b border-border px-4 py-3 font-medium text-foreground">
                    {nameOf(row.userId)}
                  </td>
                  <td className="border-b border-border px-4 py-3 tabular-nums text-foreground">
                    {row.finalScore === null ? "—" : row.finalScore.toFixed(1)}
                  </td>
                  <td className="border-b border-border px-4 py-3">
                    <StatusDot tone={row.status === "calculated" ? "green" : "amber"}>
                      {row.status === "calculated" ? "Đã tính" : "Thiếu dữ liệu"}
                    </StatusDot>
                  </td>
                  <td className="border-b border-border px-4 py-3 text-muted-foreground">
                    {new Date(row.calculatedAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="border-b border-border px-4 py-3 text-right">
                    <button
                      className="font-semibold text-primary hover:underline"
                      aria-label={`Chi tiết kết quả ${nameOf(row.userId)}`}
                      onClick={() => setDetail(row)}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Chưa có kết quả. Hãy tính KPI cho kỳ này khi nó đang mở.</Empty>
      )}
      {results.data && (
        <Pager
          page={page}
          total={results.data.total}
          totalPages={Math.ceil(results.data.total / results.data.pageSize)}
          onChange={setPage}
          unit="kết quả"
        />
      )}
      {detail && (
        <Modal title="Truy xuất gốc kết quả" wide onClose={() => setDetail(null)}>
          <KpiResultDetail result={detail} nameOf={nameOf} />
        </Modal>
      )}
    </>
  );
}

const metricLabels: Record<string, string> = {
  delivery: "Khối lượng hoàn thành",
  quality: "Chất lượng công việc",
  timeliness: "Tính đúng hạn",
};

function KpiResultDetail({
  result,
  nameOf,
}: {
  result: KpiResultRow;
  nameOf: (userId: string) => string;
}) {
  const state = useResource(
    useCallback(async () => getKpiResult(result.id), [result.id]),
  );
  const metricHint = useMemo(
    () =>
      state.data
        ? `Điểm tổng ${state.data.result.finalScore?.toFixed(1) ?? "—"} = tổng đóng góp của ba thành phần.`
        : "",
    [state.data],
  );
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return <LoadingState />;
  return (
    <>
      <p className="mb-4 text-body leading-6 text-muted-foreground">
        {nameOf(result.userId)} · quy tắc <span className="font-mono">{result.ruleVersion}</span> ·{" "}
        {metricHint}
      </p>
      <div className="overflow-x-auto border-y border-border">
        <table className="product-table w-full border-collapse text-body">
          <thead>
            <tr>
              {["Thành phần", "Giá trị gốc", "Trọng số hiệu lực", "Đóng góp"].map((label) => (
                <th
                  key={label}
                  className="whitespace-nowrap border-b border-border/70 bg-background/80 px-4 py-3 text-left text-caption font-semibold text-muted-foreground"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.data.metrics.map((metric) => (
              <tr key={metric.metricCode} className="transition-colors hover:bg-background/70">
                <td className="border-b border-border px-4 py-3 font-medium text-foreground">
                  {metricLabels[metric.metricCode] ?? metric.metricCode}
                </td>
                <td className="border-b border-border px-4 py-3 tabular-nums">
                  {metric.sourceValue === null ? "—" : metric.sourceValue.toFixed(1)}
                </td>
                <td className="border-b border-border px-4 py-3 tabular-nums text-muted-foreground">
                  {metric.effectiveWeight === null ? "—" : `${metric.effectiveWeight}%`}
                </td>
                <td className="border-b border-border px-4 py-3 tabular-nums">
                  {metric.weightedContribution === null
                    ? "—"
                    : metric.weightedContribution.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-caption leading-5 text-muted-foreground">
        Giá trị gốc và nguồn dữ liệu của từng thành phần được lưu kèm kết quả để đối chiếu lại bất
        cứ lúc nào.
      </p>
    </>
  );
}
