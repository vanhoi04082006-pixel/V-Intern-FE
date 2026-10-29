"use client";

/**
 * Lương ảo — sinh lương từ kỳ KPI đã chốt, tạo điều chỉnh
 * (thưởng/phạt/chi trả) và xem sổ cái giao dịch.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Sparkles, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createSalaryAdjustment,
  fetchKpiPeriods,
  fetchSalaryLedger,
  fetchUserBalance,
  generateVirtualSalary,
} from "@/lib/api/finance";
import { fetchUsers } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime, fmtVnd } from "@/lib/api/client";
import type { SalaryEntry } from "@/lib/api/intern";
import {
  ErrorState,
  KeyVal,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  SectionCard,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";
const triggerCls =
  "h-11 w-full rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const TYPE_META: Record<string, { label: string; cls: string }> = {
  payout: { label: "Lương", cls: "bg-blue-mist text-blue border-blue/40" },
  bonus: { label: "Thưởng", cls: "bg-emerald-50 text-emerald-700 border-emerald-400/50" },
  penalty: { label: "Phạt", cls: "bg-rose-50 text-rose-600 border-rose-300" },
  adjustment: { label: "Điều chỉnh", cls: "bg-ink/5 text-ink-soft border-ink/25" },
};

export function AdminSalaryView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [generatePeriodId, setGeneratePeriodId] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [userFilter, setUserFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: finalizedPeriods } = useQuery({
    queryKey: ["admin-kpi-periods", "finalized"],
    queryFn: ({ signal }) => fetchKpiPeriods({ status: "finalized" }, signal),
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users", "salary"],
    queryFn: ({ signal }) => fetchUsers({}, signal),
  });

  const selectedUserName =
    userFilter === "all" ? null : (users?.data ?? []).find((u) => u.id === userFilter)?.displayName ?? null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-salary-ledger", userFilter, typeFilter, page],
    queryFn: ({ signal }) =>
      fetchSalaryLedger(
        {
          userId: userFilter === "all" ? undefined : userFilter,
          type: typeFilter === "all" ? undefined : typeFilter,
          page,
        },
        signal,
      ),
  });

  const { data: balance } = useQuery({
    queryKey: ["admin-user-balance", userFilter],
    queryFn: ({ signal }) => fetchUserBalance(userFilter, undefined, signal),
    enabled: userFilter !== "all",
  });

  const generate = useMutation({
    mutationFn: () => generateVirtualSalary(generatePeriodId),
    onSuccess: () => {
      toast({ title: "Đã sinh lương ảo từ kỳ KPI ✦", description: "Sổ cái đã được cập nhật." });
      void queryClient.invalidateQueries({ queryKey: ["admin-salary-ledger"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-user-balance"] });
      setGeneratePeriodId("");
    },
    onError: (e) => toast({ title: "Sinh lương thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const columns: Column<SalaryEntry>[] = [
    {
      key: "type",
      header: "Loại",
      render: (e) => {
        const meta = TYPE_META[e.type] ?? { label: e.type, cls: "bg-ink/5 text-ink-soft border-ink/25" };
        return (
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", meta.cls)}>
            {meta.label}
          </span>
        );
      },
    },
    {
      key: "user",
      header: "Người dùng",
      render: () => <span className="text-[13px] text-ink-soft">{selectedUserName ?? "—"}</span>,
    },
    {
      key: "amount",
      header: "Số tiền",
      render: (e) => <span className={cn("font-mono text-[13px] font-bold", e.amount < 0 ? "text-rose-600" : "text-ink")}>{fmtVnd(e.amount)}</span>,
    },
    { key: "reason", header: "Lý do", render: (e) => <span className="text-[13px] text-ink-soft">{e.reason ?? "—"}</span> },
    { key: "period", header: "Kỳ", render: (e) => <span className="text-[13px]">{e.kpiPeriodName ?? "—"}</span> },
    { key: "createdAt", header: "Thời gian", render: (e) => <span className="text-[13px] text-ink-soft">{fmtDateTime(e.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lương ảo"
        description="Sinh lương từ kỳ KPI đã chốt, tạo điều chỉnh thưởng/phạt và theo dõi sổ cái."
        actions={
          <Button
            className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            onClick={() => setAdjustOpen(true)}
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Tạo điều chỉnh
          </Button>
        }
      />

      <SectionCard
        title="Sinh lương từ kỳ KPI"
        description="Chọn một kỳ KPI đã chốt — hệ thống sẽ tạo bút toán lương cho toàn bộ sinh viên có kết quả."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={generatePeriodId} onValueChange={setGeneratePeriodId}>
            <SelectTrigger className={triggerCls} aria-label="Chọn kỳ KPI đã chốt">
              <SelectValue placeholder="Chọn kỳ KPI đã chốt…" />
            </SelectTrigger>
            <SelectContent>
              {(finalizedPeriods?.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="h-11 shrink-0 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={!generatePeriodId || generate.isPending}
            onClick={() => generate.mutate()}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {generate.isPending ? "Đang sinh…" : "Sinh lương"}
          </Button>
        </div>
        {(finalizedPeriods?.data ?? []).length === 0 ? (
          <p className="mt-3 text-[13px] text-ink-faint">Chưa có kỳ KPI nào ở trạng thái “Đã chốt” — hãy chốt một kỳ trước khi sinh lương.</p>
        ) : null}
      </SectionCard>

      <SectionCard title="Sổ cái lương ảo" description="Toàn bộ bút toán lương, thưởng, phạt và điều chỉnh.">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Select
            value={userFilter}
            onValueChange={(v) => {
              setUserFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={triggerCls} aria-label="Lọc người dùng">
              <SelectValue placeholder="Người dùng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi người dùng</SelectItem>
              {(users?.data ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.displayName} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${triggerCls} sm:w-[200px]`} aria-label="Lọc loại">
              <SelectValue placeholder="Loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi loại</SelectItem>
              <SelectItem value="payout">Lương</SelectItem>
              <SelectItem value="bonus">Thưởng</SelectItem>
              <SelectItem value="penalty">Phạt</SelectItem>
              <SelectItem value="adjustment">Điều chỉnh</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {userFilter !== "all" ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border-2 border-blue/30 bg-blue-mist/50 px-4 py-3">
            <Wallet className="h-4 w-4 text-blue" aria-hidden="true" />
            <KeyVal label="Số dư">
              <span className="font-mono font-bold text-blue">{balance != null ? fmtVnd(balance) : "Đang tải…"}</span>
            </KeyVal>
          </div>
        ) : null}

        {isLoading ? (
          <LoadingState label="Đang tải sổ cái…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable
            columns={columns}
            rows={[]}
            rowKey={(e) => e.id}
            emptyTitle="Chưa có bút toán nào"
            emptyDescription="Sinh lương từ kỳ KPI hoặc tạo điều chỉnh để sổ cái có dữ liệu."
          />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(e) => e.id} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <CreateAdjustmentDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        periods={finalizedPeriods?.data ?? []}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin-salary-ledger"] });
          void queryClient.invalidateQueries({ queryKey: ["admin-user-balance"] });
          setAdjustOpen(false);
        }}
      />
    </div>
  );
}

/* ───────────────────────── Tạo điều chỉnh ───────────────────────── */

function CreateAdjustmentDialog({
  open,
  onOpenChange,
  periods,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periods: { id: string; code: string; name: string }[];
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("bonus");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [kpiPeriodId, setKpiPeriodId] = useState("");

  const { data: users } = useQuery({
    queryKey: ["admin-users", "salary"],
    queryFn: ({ signal }) => fetchUsers({}, signal),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      createSalaryAdjustment({
        userId,
        type,
        amount: Number(amount),
        reason: reason.trim(),
        kpiPeriodId: kpiPeriodId || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Đã tạo điều chỉnh lương ✦" });
      setUserId("");
      setType("bonus");
      setAmount("");
      setReason("");
      setKpiPeriodId("");
      onCreated();
    },
    onError: (e) => toast({ title: "Tạo điều chỉnh thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const valid = userId.length > 0 && reason.trim().length > 0 && Number.isFinite(Number(amount)) && Number(amount) !== 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Tạo điều chỉnh lương</DialogTitle>
          <DialogDescription>Thêm bút toán thưởng / phạt / chi trả / điều chỉnh vào ví người dùng.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Người dùng</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className={triggerCls} aria-label="Chọn người dùng">
                <SelectValue placeholder="Chọn người dùng…" />
              </SelectTrigger>
              <SelectContent>
                {(users?.data ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.displayName} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Loại</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className={triggerCls} aria-label="Loại điều chỉnh">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payout">Lương</SelectItem>
                  <SelectItem value="bonus">Thưởng</SelectItem>
                  <SelectItem value="penalty">Phạt</SelectItem>
                  <SelectItem value="adjustment">Điều chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adjust-amount">Số tiền (VND)</Label>
              <Input id="adjust-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="vd: 500000" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="adjust-reason">Lý do</Label>
            <Textarea
              id="adjust-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[70px] rounded-xl border-2 border-ink/20 bg-raised px-4 py-2 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
              placeholder="vd: Thưởng đích danh cho sprint xuất sắc"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Kỳ KPI (tuỳ chọn)</Label>
            <Select value={kpiPeriodId} onValueChange={setKpiPeriodId}>
              <SelectTrigger className={triggerCls} aria-label="Kỳ KPI liên quan">
                <SelectValue placeholder="Không gắn kỳ…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không gắn kỳ</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {create.isPending ? "Đang tạo…" : "Tạo điều chỉnh"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
