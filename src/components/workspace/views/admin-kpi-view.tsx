"use client";

/**
 * Kỳ KPI — tạo kỳ, mở/chốt kỳ, tính toán điểm và xem bảng xếp hạng.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  calculateKpi,
  createKpiPeriod,
  fetchKpiPeriods,
  fetchKpiResults,
  finalizeKpi,
  transitionKpiPeriod,
  type KpiPeriod,
} from "@/lib/api/finance";
import { errorMessage } from "@/lib/api/transport";
import { fmtDate } from "@/lib/api/client";
import {
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";
const triggerCls =
  "h-11 w-full rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

export function AdminKpiView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<KpiPeriod | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-kpi-periods", status, page],
    queryFn: ({ signal }) => fetchKpiPeriods({ status: status === "all" ? undefined : status, page }, signal),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-kpi-periods"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-kpi-results"] });
  };

  const columns: Column<KpiPeriod>[] = [
    {
      key: "code",
      header: "Mã",
      render: (p) => <span className="font-mono text-[12px] font-bold text-blue">{p.code}</span>,
    },
    { key: "name", header: "Tên kỳ", render: (p) => <span className="font-semibold text-ink">{p.name}</span> },
    { key: "status", header: "Trạng thái", render: (p) => <StatusBadge status={p.status} /> },
    { key: "startDate", header: "Bắt đầu", render: (p) => <span className="text-[13px] text-ink-soft">{fmtDate(p.startDate)}</span> },
    { key: "endDate", header: "Kết thúc", render: (p) => <span className="text-[13px] text-ink-soft">{fmtDate(p.endDate)}</span> },
    { key: "resultCount", header: "Số kết quả", render: (p) => <span className="font-bold">{p.resultCount}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kỳ KPI"
        description="Vòng đời kỳ KPI: tạo nháp → mở → tính toán → chốt. Chỉ kỳ đã chốt mới sinh được lương ảo."
        actions={
          <Button
            className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            onClick={() => setCreateOpen(true)}
          >
            <Target className="h-4 w-4" aria-hidden="true" />
            Tạo kỳ KPI
          </Button>
        }
      />

      <SectionCard title="Danh sách kỳ KPI" description="Nhấn vào một kỳ để xem chi tiết, chuyển trạng thái và bảng kết quả.">
        <div className="mb-4">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${triggerCls} sm:w-[240px]`} aria-label="Lọc trạng thái">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="open">Đang mở</SelectItem>
              <SelectItem value="calculating">Đang tính</SelectItem>
              <SelectItem value="finalized">Đã chốt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState label="Đang tải kỳ KPI…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable columns={columns} rows={[]} rowKey={(p) => p.id} emptyTitle="Chưa có kỳ KPI nào" emptyDescription="Tạo kỳ KPI đầu tiên để bắt đầu đánh giá." />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(p) => p.id} onRowClick={(p) => setDetail(p)} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <CreateKpiPeriodDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          invalidate();
          setCreateOpen(false);
        }}
      />
      <KpiPeriodDetailDialog
        period={detail}
        onOpenChange={(open) => !open && setDetail(null)}
        onChanged={invalidate}
      />
    </div>
  );
}

/* ───────────────────────── Tạo kỳ KPI ───────────────────────── */

function CreateKpiPeriodDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createKpiPeriod({
        code: code.trim(),
        name: name.trim(),
        startDate,
        endDate,
      }),
    onSuccess: () => {
      toast({ title: "Đã tạo kỳ KPI ✦", description: "Kỳ đang ở trạng thái bản nháp." });
      setCode("");
      setName("");
      setStartDate("");
      setEndDate("");
      onCreated();
    },
    onError: (e) => toast({ title: "Tạo kỳ KPI thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const valid = code.trim().length > 0 && name.trim().length > 0 && startDate.length > 0 && endDate.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Tạo kỳ KPI mới</DialogTitle>
          <DialogDescription>Đặt mã, tên và khoảng thời gian áp dụng của kỳ đánh giá.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="kpi-code">Mã kỳ</Label>
              <Input id="kpi-code" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="vd: KPI-2025-Q1" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kpi-name">Tên kỳ</Label>
              <Input id="kpi-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="vd: KPI Quý 1/2025" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="kpi-start">Ngày bắt đầu</Label>
              <Input id="kpi-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kpi-end">Ngày kết thúc</Label>
              <Input id="kpi-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={!valid || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang tạo…" : "Tạo kỳ KPI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Chi tiết kỳ KPI ───────────────────────── */

function KpiPeriodDetailDialog({
  period,
  onOpenChange,
  onChanged,
}: {
  period: KpiPeriod | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();

  const { data: results, isLoading } = useQuery({
    queryKey: ["admin-kpi-results", period?.id],
    queryFn: ({ signal }) => fetchKpiResults(period!.id, signal),
    enabled: !!period,
  });

  const notifyDone = (title: string) => {
    toast({ title });
    onChanged();
  };

  const openPeriod = useMutation({
    mutationFn: () => transitionKpiPeriod(period!.id, "open"),
    onSuccess: () => notifyDone("Đã mở kỳ KPI ✦"),
    onError: (e) => toast({ title: "Mở kỳ thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const calc = useMutation({
    mutationFn: () => calculateKpi(period!.id),
    onSuccess: () => notifyDone("Đã chạy tính toán KPI — kết quả sẽ dần được cập nhật"),
    onError: (e) => toast({ title: "Tính toán thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const finalize = useMutation({
    mutationFn: () => finalizeKpi(period!.id),
    onSuccess: () => notifyDone("Đã chốt kỳ KPI ✦"),
    onError: (e) => toast({ title: "Chốt kỳ thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const busy = openPeriod.isPending || calc.isPending || finalize.isPending;

  return (
    <Dialog open={!!period} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">{period?.name}</DialogTitle>
          <DialogDescription>
            Mã <span className="font-mono text-blue">{period?.code}</span> · {fmtDate(period?.startDate ?? null)} → {fmtDate(period?.endDate ?? null)} ·{" "}
            {period ? <StatusBadge status={period.status} /> : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {period?.status === "draft" ? (
            <Button
              className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
              disabled={busy}
              onClick={() => openPeriod.mutate()}
            >
              {openPeriod.isPending ? "Đang mở…" : "Mở kỳ"}
            </Button>
          ) : null}
          {period?.status === "open" ? (
            <>
              <Button
                variant="outline"
                className="h-11 gap-2 rounded-xl border-2 border-blue/40 font-bold text-blue hover:bg-blue-mist"
                disabled={busy}
                onClick={() => calc.mutate()}
              >
                <Calculator className="h-4 w-4" aria-hidden="true" />
                {calc.isPending ? "Đang tính…" : "Tính toán"}
              </Button>
              <Button
                className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
                disabled={busy}
                onClick={() => finalize.mutate()}
              >
                {finalize.isPending ? "Đang chốt…" : "Chốt kỳ"}
              </Button>
            </>
          ) : null}
          {period && !["draft", "open"].includes(period.status) ? (
            <p className="text-[13px] text-ink-soft">
              Kỳ này đã qua giai đoạn điều chỉnh — xem bảng kết quả bên dưới.
            </p>
          ) : null}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-ink-soft">Bảng kết quả</h3>
          {isLoading ? (
            <LoadingState label="Đang tải kết quả…" />
          ) : !results || results.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-ink/15 bg-paper px-4 py-8 text-center text-[13px] text-ink-faint">
              Chưa có kết quả — chạy “Tính toán” để hệ thống chấm điểm sinh viên.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {results.map((r) => (
                <li key={r.id} className="rounded-xl border-2 border-ink/10 bg-paper-raised p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-extrabold text-ink">{r.internName}</p>
                      <p className="text-[12px] text-ink-soft">
                        Hạng {r.rank ?? "—"} · Tổng điểm {r.totalScore ?? "—"}
                      </p>
                    </div>
                    {r.periodStatus ? <StatusBadge status={r.periodStatus} /> : null}
                  </div>
                  {r.components.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.components.map((c) => (
                        <span
                          key={c.code}
                          className="rounded-full border border-ink/15 bg-paper px-2 py-0.5 text-[11px] font-bold text-ink-soft"
                          title={c.detail ?? undefined}
                        >
                          {c.name}: {c.score ?? "—"}
                          {c.weight != null ? ` (trọng số ${c.weight})` : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
