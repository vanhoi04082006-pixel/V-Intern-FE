"use client";

/**
 * Phân công — gán sinh viên vào đồ án thuộc một phiên thực tập,
 * hoàn tất hoặc huỷ phân công.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  completeAssignment,
  createAssignment,
  fetchAssignments,
  fetchProjects,
  fetchSessions,
  cancelAssignment,
  type AssignmentSummary,
} from "@/lib/api/academic";
import { fetchUsers } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";
const triggerCls =
  "h-11 w-full rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

export function AssignmentsView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [completing, setCompleting] = useState<AssignmentSummary | null>(null);
  const [cancelling, setCancelling] = useState<AssignmentSummary | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["assignments", sessionId, status, page],
    queryFn: ({ signal }) =>
      fetchAssignments(
        {
          sessionId: sessionId === "all" ? undefined : sessionId,
          status: status === "all" ? undefined : status,
          page,
        },
        signal,
      ),
  });

  const { data: sessions } = useQuery({
    queryKey: ["assignment-sessions"],
    queryFn: ({ signal }) => fetchSessions({}, signal),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["assignments"] });
  };

  const complete = useMutation({
    mutationFn: (id: string) => completeAssignment(id),
    onSuccess: () => {
      toast({ title: "Đã hoàn tất phân công ✦" });
      invalidate();
      setCompleting(null);
    },
    onError: (e) => toast({ title: "Hoàn tất thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelAssignment(id),
    onSuccess: () => {
      toast({ title: "Đã huỷ phân công" });
      invalidate();
      setCancelling(null);
    },
    onError: (e) => toast({ title: "Huỷ phân công thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const columns: Column<AssignmentSummary>[] = [
    { key: "intern", header: "Sinh viên", render: (a) => <span className="font-semibold text-ink">{a.internName}</span> },
    { key: "project", header: "Đồ án", render: (a) => <span className="font-medium">{a.projectName}</span> },
    { key: "session", header: "Phiên", render: (a) => <span className="text-[13px] text-ink-soft">{a.sessionName}</span> },
    { key: "status", header: "Trạng thái", render: (a) => <StatusBadge status={a.status} /> },
    {
      key: "actions",
      header: "Hành động",
      className: "text-right",
      render: (a) =>
        a.status === "active" ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="border-emerald-300 font-bold text-emerald-700 hover:bg-emerald-50" onClick={() => setCompleting(a)}>
              Hoàn tất
            </Button>
            <Button variant="outline" size="sm" className="border-rose-300 font-bold text-rose-600 hover:bg-rose-50" onClick={() => setCancelling(a)}>
              Huỷ
            </Button>
          </div>
        ) : (
          <span className="text-[12px] text-ink-faint">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân công"
        description="Gán sinh viên vào đồ án của từng phiên thực tập, theo dõi và kết thúc phân công."
        actions={
          <Button
            className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            onClick={() => setCreateOpen(true)}
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Tạo phân công
          </Button>
        }
      />

      <SectionCard title="Danh sách phân công">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Select
            value={sessionId}
            onValueChange={(v) => {
              setSessionId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={triggerCls} aria-label="Lọc phiên">
              <SelectValue placeholder="Phiên thực tập" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi phiên</SelectItem>
              {(sessions?.data ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${triggerCls} sm:w-[200px]`} aria-label="Lọc trạng thái">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="cancelled">Đã huỷ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState label="Đang tải phân công…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable columns={columns} rows={[]} rowKey={(a) => a.id} emptyTitle="Chưa có phân công nào" emptyDescription="Tạo phân công để gán sinh viên vào đồ án." />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(a) => a.id} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <CreateAssignmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          invalidate();
          setCreateOpen(false);
        }}
      />

      <AlertDialog open={!!completing} onOpenChange={(open) => !open && setCompleting(null)}>
        <AlertDialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
          <AlertDialogHeader>
            <AlertDialogTitle>Hoàn tất phân công?</AlertDialogTitle>
            <AlertDialogDescription>
              Xác nhận “{completing?.internName}” đã hoàn thành đồ án “{completing?.projectName}”. Hành động này sẽ đóng phân công.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-xl">Để sau</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
              disabled={complete.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (completing) complete.mutate(completing.id);
              }}
            >
              {complete.isPending ? "Đang xử lý…" : "Hoàn tất"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cancelling} onOpenChange={(open) => !open && setCancelling(null)}>
        <AlertDialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600">Huỷ phân công?</AlertDialogTitle>
            <AlertDialogDescription>
              Phân công của “{cancelling?.internName}” cho đồ án “{cancelling?.projectName}” sẽ bị huỷ. Bạn chắc chứ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-xl">Giữ lại</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700"
              disabled={cancel.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (cancelling) cancel.mutate(cancelling.id);
              }}
            >
              {cancel.isPending ? "Đang xử lý…" : "Huỷ phân công"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ───────────────────────── Tạo phân công ───────────────────────── */

function CreateAssignmentDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [internId, setInternId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sessionId, setSessionId] = useState("");

  const { data: interns } = useQuery({
    queryKey: ["assignment-interns"],
    queryFn: ({ signal }) => fetchUsers({ roleCode: "intern" }, signal),
    enabled: open,
  });

  const { data: projects } = useQuery({
    queryKey: ["assignment-projects"],
    queryFn: ({ signal }) => fetchProjects({}, signal),
    enabled: open,
  });

  const { data: sessions } = useQuery({
    queryKey: ["assignment-sessions"],
    queryFn: ({ signal }) => fetchSessions({}, signal),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      createAssignment({
        internId,
        projectId,
        sessionId,
      }),
    onSuccess: () => {
      toast({ title: "Đã tạo phân công ✦" });
      setInternId("");
      setProjectId("");
      setSessionId("");
      onCreated();
    },
    onError: (e) => toast({ title: "Tạo phân công thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Tạo phân công mới</DialogTitle>
          <DialogDescription>Chọn sinh viên, đồ án và phiên thực tập tương ứng.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Sinh viên (intern)</Label>
            <Select value={internId} onValueChange={setInternId}>
              <SelectTrigger className={triggerCls} aria-label="Chọn sinh viên">
                <SelectValue placeholder="Chọn sinh viên…" />
              </SelectTrigger>
              <SelectContent>
                {(interns?.data ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.displayName} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Đồ án</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className={triggerCls} aria-label="Chọn đồ án">
                <SelectValue placeholder="Chọn đồ án…" />
              </SelectTrigger>
              <SelectContent>
                {(projects?.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Phiên thực tập</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger className={triggerCls} aria-label="Chọn phiên">
                <SelectValue placeholder="Chọn phiên…" />
              </SelectTrigger>
              <SelectContent>
                {(sessions?.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
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
            disabled={!internId || !projectId || !sessionId || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang tạo…" : "Tạo phân công"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
