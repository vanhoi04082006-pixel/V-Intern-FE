"use client";

/**
 * Lương ảo — số dư và sổ ghi chi tiết các khoản: lương, thưởng, phạt, điều chỉnh.
 */

import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { fetchMySalary, type SalaryEntry } from "@/lib/api/intern";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime, fmtVnd } from "@/lib/api/client";
import {
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  type Column,
} from "@/components/shared/kit";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { label: string; cls: string }> = {
  payout: { label: "Lương", cls: "border-blue/40 bg-blue-mist text-blue" },
  bonus: { label: "Thưởng", cls: "border-emerald-400/50 bg-emerald-50 text-emerald-700" },
  penalty: { label: "Phạt", cls: "border-rose-300 bg-rose-50 text-rose-600" },
  adjustment: { label: "Điều chỉnh", cls: "border-ink/20 bg-ink/5 text-ink-soft" },
};

export function InternSalaryView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["intern-salary"],
    queryFn: ({ signal }) => fetchMySalary(signal),
  });

  const columns: Column<SalaryEntry>[] = [
    {
      key: "type",
      header: "Loại",
      render: (row) => {
        const meta = TYPE_META[row.type];
        return meta ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              meta.cls,
            )}
          >
            {meta.label}
          </span>
        ) : (
          <span className="text-ink-soft">{row.type}</span>
        );
      },
    },
    {
      key: "amount",
      header: "Số tiền",
      render: (row) =>
        row.amount >= 0 ? (
          <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600">
            <ArrowUpCircle className="h-3.5 w-3.5" aria-hidden="true" />+{fmtVnd(row.amount)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-extrabold text-rose-600">
            <ArrowDownCircle className="h-3.5 w-3.5" aria-hidden="true" />
            -{fmtVnd(Math.abs(row.amount))}
          </span>
        ),
    },
    {
      key: "reason",
      header: "Lý do",
      render: (row) =>
        row.reason ? (
          <span className="text-[13px] leading-relaxed text-ink-soft">{row.reason}</span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      key: "kpi",
      header: "Kỳ KPI",
      render: (row) => <span className="text-ink-soft">{row.kpiPeriodName ?? "—"}</span>,
    },
    {
      key: "time",
      header: "Thời gian",
      render: (row) => <span className="font-mono text-[12px] text-ink-faint">{fmtDateTime(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lương ảo"
        description="Tiền thưởng trong hệ thống thực tập — dùng để xếp hạng và đổi phần thưởng, không phải tiền thật nhé."
      />

      {isLoading ? (
        <LoadingState label="Đang tải lương ảo…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data ? null : (
        <>
          <StatCard
            label="Số dư lương ảo"
            value={fmtVnd(data.balance)}
            hint="càng làm tốt, ví càng căng nhé"
            icon={Wallet}
            tone="green"
          />

          <SectionCard
            title="Sổ ghi chi tiết"
            description="Mọi khoản lương, thưởng, phạt theo từng kỳ KPI."
          >
            <ListTable
              columns={columns}
              rows={data.entries}
              rowKey={(row) => row.id}
              emptyTitle="Chưa có khoản nào"
              emptyDescription="Kết thúc kỳ KPI đầu tiên, lương ảo sẽ được ghi vào sổ này."
            />
          </SectionCard>

          <p className="flex items-center justify-center gap-1.5 text-center font-hand text-[16px] text-ink-faint">
            <Wallet className="h-4 w-4" aria-hidden="true" />
            làm tốt được thưởng, trễ hạn bị phạt — cứ đều tay là ví luôn đầy ✦
          </p>
        </>
      )}
    </div>
  );
}
