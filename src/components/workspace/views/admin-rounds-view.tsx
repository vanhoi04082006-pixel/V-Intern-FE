"use client";

/**
 * Đợt tuyển dụng — tạo đợt, mở/đóng đợt, xem hồ sơ ứng viên nộp vào.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createRecruitmentRound,
  fetchRecruitmentRounds,
  fetchRoundApplications,
  setRoundStatus,
  type RecruitmentRound,
} from "@/lib/api/recruitment";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
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

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

function toIso(localValue: string): string {
  if (!localValue) return "";
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function AdminRoundsView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<RecruitmentRound | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-rounds"],
    queryFn: ({ signal }) => fetchRecruitmentRounds(signal),
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setRoundStatus(id, status),
    onSuccess: (_d, vars) => {
      toast({ title: vars.status === "open" ? "Đã mở đợt tuyển ✦" : "Đã đóng đợt tuyển" });
      void queryClient.invalidateQueries({ queryKey: ["admin-rounds"] });
    },
    onError: (e) => toast({ title: "Đổi trạng thái thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const columns: Column<RecruitmentRound>[] = [
    { key: "name", header: "Tên đợt", render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: "status", header: "Trạng thái", render: (r) => <StatusBadge status={r.status} /> },
    { key: "opensAt", header: "Mở", render: (r) => <span className="text-[13px] text-ink-soft">{fmtDateTime(r.opensAt)}</span> },
    { key: "closesAt", header: "Đóng", render: (r) => <span className="text-[13px] text-ink-soft">{fmtDateTime(r.closesAt)}</span> },
    { key: "count", header: "Số hồ sơ", render: (r) => <span className="font-bold">{r.applicationCount}</span> },
    {
      key: "actions",
      header: "Hành động",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          {r.status === "draft" ? (
            <Button
              variant="outline"
              size="sm"
              className="border-blue/40 font-bold text-blue hover:bg-blue-mist"
              disabled={changeStatus.isPending}
              onClick={() => changeStatus.mutate({ id: r.id, status: "open" })}
            >
              Mở đợt
            </Button>
          ) : null}
          {r.status === "open" ? (
            <Button
              variant="outline"
              size="sm"
              className="border-ink/25 font-bold text-ink-soft hover:bg-ink/5"
              disabled={changeStatus.isPending}
              onClick={() => changeStatus.mutate({ id: r.id, status: "closed" })}
            >
              Đóng đợt
            </Button>
          ) : null}
          <Button variant="outline" size="sm" className="font-bold" onClick={() => setViewing(r)}>
            Hồ sơ
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đợt tuyển dụng"
        description="Tạo và vận hành các đợt nhận hồ sơ ứng viên — mở, đóng, theo dõi số hồ sơ."
        actions={
          <Button
            className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            onClick={() => setCreateOpen(true)}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Tạo đợt tuyển
          </Button>
        }
      />

      <SectionCard title="Danh sách đợt tuyển dụng">
        {isLoading ? (
          <LoadingState label="Đang tải đợt tuyển dụng…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable columns={columns} rows={[]} rowKey={(r) => r.id} emptyTitle="Chưa có đợt tuyển nào" emptyDescription="Tạo đợt đầu tiên để bắt đầu nhận hồ sơ." />
        ) : (
          <ListTable columns={columns} rows={data.data} rowKey={(r) => r.id} />
        )}
      </SectionCard>

      <CreateRoundDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin-rounds"] });
          setCreateOpen(false);
        }}
      />
      <RoundApplicationsDialog round={viewing} onOpenChange={(open) => !open && setViewing(null)} />
    </div>
  );
}

/* ───────────────────────── Tạo đợt ───────────────────────── */

function CreateRoundDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createRecruitmentRound({
        name: name.trim(),
        opensAt: toIso(opensAt),
        closesAt: toIso(closesAt),
      }),
    onSuccess: () => {
      toast({ title: "Đã tạo đợt tuyển ✦", description: "Đợt ở trạng thái bản nháp — mở khi sẵn sàng." });
      setName("");
      setOpensAt("");
      setClosesAt("");
      onCreated();
    },
    onError: (e) => toast({ title: "Tạo đợt thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const valid = name.trim().length > 0 && opensAt.length > 0 && closesAt.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Tạo đợt tuyển mới</DialogTitle>
          <DialogDescription>Đặt tên và khung thời gian nhận hồ sơ. Đợt mới tạo ở trạng thái bản nháp.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="round-name">Tên đợt</Label>
            <Input id="round-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="vd: Thực tập Frontend 2025.1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="round-opens">Mở hồ sơ lúc</Label>
              <Input id="round-opens" type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} className={inputCls} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="round-closes">Đóng hồ sơ lúc</Label>
              <Input id="round-closes" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className={inputCls} />
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
            {create.isPending ? "Đang tạo…" : "Tạo đợt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Hồ sơ của đợt ───────────────────────── */

function RoundApplicationsDialog({
  round,
  onOpenChange,
}: {
  round: RecruitmentRound | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["round-applications", round?.id, page],
    queryFn: ({ signal }) => fetchRoundApplications(round!.id, page, signal),
    enabled: !!round,
  });

  const columns: Column<{
    id: string;
    fullName: string;
    email: string;
    roleCode: string | null;
    status: string;
    submittedAt: string | null;
  }>[] = [
    { key: "fullName", header: "Họ tên", render: (a) => <span className="font-semibold text-ink">{a.fullName}</span> },
    { key: "email", header: "Email", render: (a) => <span className="text-[13px] text-ink-soft">{a.email}</span> },
    { key: "role", header: "Vai trò", render: (a) => <span className="font-mono text-[12px]">{a.roleCode ?? "—"}</span> },
    { key: "status", header: "Trạng thái", render: (a) => <StatusBadge status={a.status} /> },
    { key: "submittedAt", header: "Nộp lúc", render: (a) => <span className="text-[13px] text-ink-soft">{fmtDateTime(a.submittedAt)}</span> },
  ];

  return (
    <Dialog open={!!round} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Hồ sơ đợt “{round?.name}”</DialogTitle>
          <DialogDescription>
            {round?.applicationCount ?? 0} hồ sơ — trạng thái đợt: {round ? <StatusBadge status={round.status} /> : null}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <LoadingState label="Đang tải hồ sơ…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} />
        ) : !data || data.data.length === 0 ? (
          <ListTable
            columns={columns}
            rows={[]}
            rowKey={(a) => a.id}
            emptyTitle="Chưa có hồ sơ nào"
            emptyDescription="Ứng viên nộp CV vào đợt này sẽ xuất hiện tại đây."
          />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(a) => a.id} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
