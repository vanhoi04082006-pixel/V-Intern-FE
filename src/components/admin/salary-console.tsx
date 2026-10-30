"use client";

import { useCallback, useState } from "react";
import { BadgeDollarSign, Coins, Plus, Wallet } from "lucide-react";
import {
  createSalaryAdjustment,
  generateSalaryForPeriod,
  getUserSalaryBalance,
  listKpiPeriods,
  listSalaryLedger,
  salaryAdjustmentTypes,
  salaryLedgerTypes,
  type SalaryLedgerRow,
} from "@/lib/api/finance";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  buttonClass,
  Empty,
  inputClass,
  MetricCard,
  Modal,
  PageTitle,
  Pager,
  StatusDot,
} from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { PerformanceMemberPicker } from "@/components/product/performance-member-picker";
import { useInternNames } from "./use-intern-names";

export const ledgerTypeLabels: Record<SalaryLedgerRow["type"], string> = {
  kpi_earning: "Thu nhập KPI",
  bonus: "Thưởng",
  penalty: "Phạt",
  adjustment: "Điều chỉnh",
  reversal: "Hoàn đảo",
};

const ledgerTypeTones: Record<SalaryLedgerRow["type"], "green" | "blue" | "amber" | "gray" | "red"> = {
  kpi_earning: "green",
  bonus: "green",
  penalty: "red",
  adjustment: "blue",
  reversal: "amber",
};

const vnd = (value: number, unit: string) =>
  `${new Intl.NumberFormat("vi-VN").format(value)} ${unit}`;

export function SalaryConsole() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("");
  const [kpiPeriodId, setKpiPeriodId] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [notice, setNotice] = useState("");
  const action = useAction();

  const periods = useResource(
    useCallback((signal: AbortSignal) => listKpiPeriods("", 1, signal), []),
  );
  const finalizedPeriods = (periods.data?.items ?? []).filter((p) => p.status === "finalized");

  const ledger = useResource(
    useCallback(
      (signal: AbortSignal) =>
        listSalaryLedger(
          {
            page,
            ...(userId ? { userId } : {}),
            ...(type ? { type } : {}),
            ...(kpiPeriodId ? { kpiPeriodId } : {}),
          },
          signal,
        ),
      [page, userId, type, kpiPeriodId],
    ),
  );

  const [balanceUser, setBalanceUser] = useState("");
  const names = useInternNames();
  const nameOf = (id: string) => names.data?.get(id) ?? `${id.slice(0, 8)}…`;
  const balance = useResource(
    useCallback(
      (signal: AbortSignal) =>
        balanceUser
          ? getUserSalaryBalance(balanceUser, kpiPeriodId || undefined, signal)
          : Promise.resolve(null),
      [balanceUser, kpiPeriodId],
    ),
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title="Lương ảo"
        subtitle="Đơn vị ảo dùng để động viên sinh viên — không phải lương thật. Số dư luôn được tính lại từ sổ ghi, không có số dư lưu sẵn."
        action={
          <button
            className={buttonClass}
            onClick={() => {
              setNotice("");
              setAdjusting(true);
            }}
          >
            <Plus size={16} aria-hidden />
            Ghi điều chỉnh
          </button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <GenerateCard
          periods={finalizedPeriods}
          busy={action.busy}
          error={action.error}
          onGenerate={async (periodId) => {
            const outcome = await generateSalaryForPeriod(periodId);
            setNotice(
              `Đã sinh ${outcome.generated} dòng thu nhập, bỏ qua ${outcome.skipped} dòng (đã có hoặc điểm bằng 0).`,
            );
            ledger.reload();
          }}
        />
        <section className="product-panel min-w-0 p-6">
          <h2 className="product-panel-title text-body font-bold leading-6 text-foreground sm:text-subsection">
            Tra số dư sinh viên
          </h2>
          <p className="mt-1 text-caption leading-5 text-muted-foreground">
            Số dư là tổng sổ ghi của sinh viên, kèm thu nhập kỳ đang chọn.
          </p>
          <div className="mt-4 space-y-4">
            <PerformanceMemberPicker
              value={balanceUser}
              onChange={(id) => setBalanceUser(id)}
              label="Sinh viên cần tra"
            />
            {balance.error ? (
              <ErrorState error={balance.error} onRetry={balance.reload} />
            ) : balanceUser && balance.data ? (
              <div className="space-y-3">
                <MetricCard
                  icon={Wallet}
                  label="Số dư hiện tại"
                  value={vnd(balance.data.balance, balance.data.unit)}
                  sub={`Đơn vị ảo (${balance.data.unit}) · không phải tiền thật`}
                />
                <p className="text-body text-muted-foreground">
                  Thu nhập kỳ đang chọn:{" "}
                  <strong className="tabular-nums text-foreground">
                    {vnd(balance.data.earnedThisPeriod, balance.data.unit)}
                  </strong>
                </p>
              </div>
            ) : balance.loading && balanceUser ? (
              <LoadingState />
            ) : (
              <p className="text-body text-muted-foreground">
                Chọn sinh viên để xem số dư từ sổ ghi.
              </p>
            )}
          </div>
        </section>
      </div>
      {notice && (
        <p role="status" className="border-l border-success pl-3 text-body text-success">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-72">
          <PerformanceMemberPicker
            value={userId}
            onChange={(id) => {
              setUserId(id);
              setPage(1);
            }}
            label="Lọc theo sinh viên"
          />
        </div>
        <label className="w-full text-body font-medium sm:w-56">
          Loại dòng
          <select
            className={inputClass}
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả loại</option>
            {salaryLedgerTypes.map((t) => (
              <option key={t} value={t}>
                {ledgerTypeLabels[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="w-full text-body font-medium sm:w-64">
          Kỳ KPI
          <select
            className={inputClass}
            value={kpiPeriodId}
            onChange={(e) => {
              setKpiPeriodId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả kỳ</option>
            {(periods.data?.items ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {ledger.loading && !ledger.data ? (
        <LoadingState />
      ) : ledger.error ? (
        <ErrorState error={ledger.error} onRetry={ledger.reload} />
      ) : ledger.data?.items.length ? (
        <div className="overflow-x-auto border-y border-border" role="region" aria-label="Sổ lương ảo theo kỳ" tabIndex={0}>
          <table className="product-table w-full border-collapse text-body">
            <thead>
              <tr>
                {["Khi", "Sinh viên", "Loại", "Số tiền", "Diễn giải"].map((label) => (
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
              {ledger.data.items.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-background/70">
                  <td className="whitespace-nowrap border-b border-border px-4 py-3 text-muted-foreground">
                    {new Date(row.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="border-b border-border px-4 py-3 font-medium text-foreground">
                    {nameOf(row.userId)}
                  </td>
                  <td className="border-b border-border px-4 py-3">
                    <StatusDot tone={ledgerTypeTones[row.type]}>
                      {ledgerTypeLabels[row.type]}
                    </StatusDot>
                  </td>
                  <td
                    className={`border-b border-border px-4 py-3 tabular-nums font-semibold ${
                      row.amount < 0 ? "text-destructive" : "text-success"
                    }`}
                  >
                    {row.amount > 0 ? "+" : ""}
                    {vnd(row.amount, row.unit)}
                  </td>
                  <td className="border-b border-border px-4 py-3 text-foreground">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Chưa có dòng lương ảo nào. Sinh lương từ một kỳ KPI đã chốt hoặc ghi điều chỉnh.</Empty>
      )}
      {ledger.data && (
        <Pager
          page={page}
          total={ledger.data.total}
          totalPages={Math.ceil(ledger.data.total / ledger.data.pageSize)}
          onChange={setPage}
          unit="dòng"
        />
      )}

      {adjusting && (
        <Modal title="Ghi điều chỉnh lương ảo" onClose={() => setAdjusting(false)}>
          <SalaryAdjustmentForm
            onSaved={(message) => {
              setAdjusting(false);
              setNotice(message);
              ledger.reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function GenerateCard({
  periods,
  busy,
  error,
  onGenerate,
}: {
  periods: { id: string; name: string; code: string }[];
  busy: boolean;
  error: unknown;
  onGenerate: (periodId: string) => Promise<void>;
}) {
  const [periodId, setPeriodId] = useState("");
  return (
    <section className="product-panel min-w-0 p-6">
      <h2 className="product-panel-title text-body font-bold leading-6 text-foreground sm:text-subsection">
        Sinh lương từ kỳ KPI đã chốt
      </h2>
      <p className="mt-1 text-caption leading-5 text-muted-foreground">
        Mỗi sinh viên có điểm KPI trong kỳ nhận một dòng thu nhập. Chạy lại không tạo dòng trùng.
      </p>
      <div className="mt-4 space-y-4">
        <label className="block text-body font-medium">
          Kỳ KPI đã chốt
          <select
            className={inputClass}
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
          >
            <option value="">Chọn kỳ đã chốt</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </label>
        {periods.length === 0 && (
          <p className="text-body text-muted-foreground">
            Chưa có kỳ KPI nào ở trạng thái “Đã chốt”. Hãy chốt kỳ ở trang Kỳ KPI trước.
          </p>
        )}
        {Boolean(error) && <ErrorState error={error} />}
        <button
          className={buttonClass}
          disabled={busy || !periodId}
          onClick={() => void onGenerate(periodId)}
        >
          <Coins size={16} aria-hidden />
          {busy ? "Đang sinh…" : "Sinh lương cho kỳ"}
        </button>
      </div>
    </section>
  );
}

function SalaryAdjustmentForm({ onSaved }: { onSaved: (message: string) => void }) {
  const action = useAction();
  const [userId, setUserId] = useState("");
  const [type, setType] = useState<(typeof salaryAdjustmentTypes)[number]>("bonus");
  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [reason, setReason] = useState("");
  const needsAmount = type === "bonus" || type === "penalty" || type === "adjustment";
  const submit = async () => {
    if (!userId || !reason.trim()) return;
    if (needsAmount && !amount) return;
    if (type === "reversal" && !sourceId.trim()) return;
    await createSalaryAdjustment({
      userId,
      type,
      ...(needsAmount ? { amount: Number(amount) } : {}),
      ...(type === "reversal" ? { sourceId: sourceId.trim() } : {}),
      reason: reason.trim(),
      requestId: crypto.randomUUID(),
    });
    onSaved("Đã ghi điều chỉnh vào sổ lương ảo.");
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
      <label className="block text-body font-medium">
        Loại điều chỉnh
        <select
          className={inputClass}
          value={type}
          onChange={(e) => setType(e.target.value as (typeof salaryAdjustmentTypes)[number])}
        >
          {salaryAdjustmentTypes.map((t) => (
            <option key={t} value={t}>
              {ledgerTypeLabels[t]}
            </option>
          ))}
        </select>
      </label>
      {needsAmount && (
        <label className="block text-body font-medium">
          Số tiền (đơn vị ảo) <span className="text-destructive">*</span>
          <input
            type="number"
            step="any"
            className={inputClass}
            value={amount}
            required
            placeholder="Ví dụ 50000"
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      )}
      {type === "reversal" && (
        <label className="block text-body font-medium">
          Mã dòng gốc cần hoàn đảo <span className="text-destructive">*</span>
          <input
            className={inputClass}
            value={sourceId}
            required
            placeholder="UUID của dòng trong sổ"
            onChange={(e) => setSourceId(e.target.value)}
          />
        </label>
      )}
      <label className="block text-body font-medium">
        Lý do (ghi vào nhật ký) <span className="text-destructive">*</span>
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          value={reason}
          maxLength={512}
          required
          placeholder="Nêu rõ hoàn cảnh và căn cứ điều chỉnh."
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <p className="text-caption leading-5 text-muted-foreground">
        Thưởng nhập số dương, phạt nhập số dương (hệ thống lưu âm), điều chỉnh nhập số mang dấu.
        Mọi dòng đều kèm lý do và gửi thông báo đến sinh viên.
      </p>
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <button className={buttonClass} disabled={action.busy} type="submit">
        <BadgeDollarSign size={16} aria-hidden />
        {action.busy ? "Đang ghi…" : "Ghi vào sổ"}
      </button>
    </form>
  );
}
