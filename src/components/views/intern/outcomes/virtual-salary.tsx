"use client";

import * as React from "react";
import { Coins, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { outcomeApi, type SalaryEntry, type VirtualSalary } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDateTime, formatVnd } from "@/lib/client/labels";
import { ViewFrame } from "@/components/shared/view";
import { Empty, PageHeader, Panel, PanelHeader, Pager, ToneBadge } from "@/components/shared/primitives";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { AnimatedNumber } from "@/components/shared/counters";

const PAGE_SIZE = 8;

const LEDGER_TYPE_META: Record<
  SalaryEntry["type"],
  { label: string; tone: "emerald" | "teal" | "rose" | "zinc" }
> = {
  kpi_earning: { label: "Thu nhập KPI", tone: "emerald" },
  bonus: { label: "Thưởng", tone: "teal" },
  penalty: { label: "Phạt", tone: "rose" },
  adjustment: { label: "Điều chỉnh", tone: "zinc" },
};

function SalaryHero({ salary }: { salary: VirtualSalary }) {
  return (
    <div className="glow-brand rounded-3xl bg-gradient-to-br from-brand/50 via-teal/25 to-transparent p-[1px]">
      <div className="noise relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-panel p-6 md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-brand/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium uppercase tracking-[0.14em] text-faint">
              <span className="flex items-center gap-1.5">
                <Wallet className="size-4 icon text-brand-bright" />
                Số dư ví
              </span>
              <ToneBadge tone="brand">Đồng ảo</ToneBadge>
            </div>
            <div className="mt-3 font-mono text-4xl font-bold tracking-tight text-ink md:text-5xl">
              <AnimatedNumber value={salary.balance} suffix=" ₫" duration={900} />
              <span className="ml-2 align-middle font-sans text-sm font-semibold text-faint">
                (ảo)
              </span>
            </div>
            <p className="mt-3.5 flex flex-wrap items-center gap-1.5 text-sm text-dim">
              <TrendingUp className="size-4 icon text-brand-bright" />
              <span className="font-mono font-semibold text-brand-bright">
                +<AnimatedNumber value={salary.earnedThisPeriod} suffix=" ₫" duration={900} />
              </span>
              thu nhập trong 30 ngày qua
              <span className="text-faint">· đơn vị {salary.unit}</span>
            </p>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-deep/50 px-4 py-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand/12 text-brand-bright">
              <Coins className="size-5 icon" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-faint">
                Ví V-Intern
              </p>
              <p className="mt-0.5 text-xs font-semibold text-ink">
                Tiền tệ mô phỏng dùng trong thực tập
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LedgerTable({
  entries,
  page,
  total,
  totalPages,
  onChange,
}: {
  entries: SalaryEntry[];
  page: number;
  total?: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        icon={<ReceiptText />}
        title="Sổ giao dịch"
        description="Toàn bộ biến động số dư ví của bạn — mới nhất lên đầu"
        actions={
          total !== undefined ? (
            <span className="font-mono text-xs text-faint">{total} giao dịch</span>
          ) : null
        }
      />
      {entries.length === 0 ? (
        <Empty
          icon={<ReceiptText />}
          title="Chưa có giao dịch nào"
          description="Thu nhập theo KPI, thưởng và phạt sẽ được ghi vào sổ này theo từng kỳ."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                  <th className="px-5 py-3 font-medium">Loại</th>
                  <th className="px-5 py-3 font-medium">Nội dung</th>
                  <th className="px-5 py-3 text-right font-medium">Số tiền</th>
                  <th className="px-5 py-3 text-right font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {entries.map((entry) => {
                  const meta = LEDGER_TYPE_META[entry.type] ?? LEDGER_TYPE_META.adjustment;
                  return (
                    <tr key={entry.id} className="transition-colors hover:bg-panel-2/60">
                      <td className="px-5 py-3.5">
                        <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>
                      </td>
                      <td className="max-w-[300px] px-5 py-3.5 text-dim">
                        <span className="block truncate" title={entry.description}>
                          {entry.description}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-5 py-3.5 text-right font-mono font-semibold tabular-nums",
                          entry.amount >= 0 ? "text-emerald-300" : "text-rose"
                        )}
                      >
                        {entry.amount >= 0 ? "+" : "−"}
                        {formatVnd(Math.abs(entry.amount))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-faint">
                        {formatDateTime(entry.at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={totalPages} total={total} onChange={onChange} />
        </>
      )}
    </Panel>
  );
}

export function VirtualSalaryView() {
  const summary = useResource(() => outcomeApi.virtualSalary());

  const [page, setPage] = React.useState(1);
  const ledger = useResource(
    () => outcomeApi.salaryLedger({ page, pageSize: PAGE_SIZE }),
    [page]
  );

  const entries = ledger.data?.data ?? [];
  const meta = ledger.data?.meta;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Kết quả & tăng trưởng"
        title="Lương ảo"
        description="Ví đồng ảo V-Intern ghi nhận thu nhập theo KPI, thưởng, phạt và điều chỉnh trong kỳ thực tập."
      />

      <div className="space-y-4">
        {summary.loading ? (
          <div className="card-surface space-y-4 p-8">
            <div className="skeleton-shimmer h-4 w-24 rounded-md bg-white/[0.06]" />
            <div className="skeleton-shimmer h-12 w-72 rounded-lg bg-white/[0.06]" />
            <div className="skeleton-shimmer h-4 w-56 rounded-md bg-white/[0.06]" />
          </div>
        ) : summary.error ? (
          <ErrorBlock error={summary.error} onRetry={summary.reload} />
        ) : summary.data ? (
          <SalaryHero salary={summary.data} />
        ) : null}

        {ledger.loading ? (
          <LoadingBlock rows={6} />
        ) : ledger.error ? (
          <ErrorBlock error={ledger.error} onRetry={ledger.reload} />
        ) : (
          <LedgerTable
            entries={entries}
            page={page}
            total={meta?.total}
            totalPages={meta?.totalPages ?? 1}
            onChange={setPage}
          />
        )}
      </div>
    </ViewFrame>
  );
}
