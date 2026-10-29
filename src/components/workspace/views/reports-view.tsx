"use client";

/**
 * Báo cáo — tạo snapshot báo cáo theo loại, tải xuống PDF/XLSX.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileBarChart, FileSpreadsheet, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchProjects } from "@/lib/api/academic";
import { createReport, downloadReportPdf, downloadReportXlsx, fetchReports } from "@/lib/api/insight";
import { saveBlob } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  Chip,
  EmptyState,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  SectionCard,
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

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const KIND_OPTIONS = [
  { value: "progress", label: "Tiến độ" },
  { value: "performance", label: "Hiệu suất" },
  { value: "evaluation", label: "Đánh giá" },
  { value: "review", label: "Review code" },
  { value: "risk", label: "Rủi ro" },
];

export function ReportsView() {
  const [kind, setKind] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reports", kind, page],
    queryFn: ({ signal }) => fetchReports({ kind: kind === "all" ? undefined : kind, page }, signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo"
        description="Sinh báo cáo theo đồ án / phiên thực tập rồi tải về PDF hoặc Excel."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo báo cáo
          </Button>
        }
      />

      <SectionCard>
        <Select
          value={kind}
          onValueChange={(v) => {
            setKind(v);
            setPage(1);
          }}
        >
          <SelectTrigger className={`${INPUT_CLS} w-full sm:w-[220px]`}>
            <SelectValue placeholder="Loại báo cáo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mọi loại</SelectItem>
            {KIND_OPTIONS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-4">
          {isLoading ? (
            <LoadingState label="Đang tải danh sách báo cáo…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="Chưa có báo cáo nào"
              description="Tạo báo cáo đầu tiên — hệ thống sẽ chụp lại số liệu hiện tại để tải xuống."
            />
          ) : (
            <>
              <ListTable
                rows={data.data}
                rowKey={(r) => r.id}
                emptyTitle="Không tìm thấy báo cáo"
                columns={[
                  {
                    key: "title",
                    header: "Tiêu đề",
                    render: (r) => (
                      <span className="font-bold">{r.title}</span>
                    ),
                  },
                  {
                    key: "kind",
                    header: "Loại",
                    render: (r) => <Chip tone="blue">{KIND_OPTIONS.find((k) => k.value === r.kind)?.label ?? r.kind}</Chip>,
                  },
                  { key: "createdAt", header: "Tạo lúc", render: (r) => fmtDateTime(r.createdAt) },
                  {
                    key: "actions",
                    header: "Tải về",
                    render: (r) => <ReportActions reportId={r.id} title={r.title} />,
                  },
                ]}
              />
              <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </SectionCard>

      <CreateReportDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function ReportActions({ reportId, title }: { reportId: string; title: string }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);

  const download = async (format: "pdf" | "xlsx") => {
    setBusy(format);
    try {
      const blob = format === "pdf" ? await downloadReportPdf(reportId) : await downloadReportXlsx(reportId);
      const safeName = title.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim() || "bao-cao";
      saveBlob(blob, `${safeName}.${format}`);
      toast({ title: `Đã tải báo cáo ${format.toUpperCase()} ✦` });
    } catch (e) {
      toast({ title: "Chưa tải được báo cáo", description: errorMessage(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={busy !== null}
        onClick={(e) => {
          e.stopPropagation();
          void download("pdf");
        }}
        className="gap-1.5"
      >
        {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <FileBarChart className="h-3.5 w-3.5" aria-hidden="true" />}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={busy !== null}
        onClick={(e) => {
          e.stopPropagation();
          void download("xlsx");
        }}
        className="gap-1.5"
      >
        {busy === "xlsx" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />}
        XLSX
      </Button>
    </div>
  );
}

function CreateReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("progress");
  const [projectId, setProjectId] = useState("");
  const [sessionId, setSessionId] = useState("");

  const { data: projects } = useQuery({
    queryKey: ["projects", "report-form"],
    queryFn: ({ signal }) => fetchProjects({ page: 1 }, signal),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      createReport({
        requestId: crypto.randomUUID(),
        title: title.trim(),
        kind,
        projectId,
        sessionId: sessionId.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast({ title: "Đã tạo báo cáo ✦", description: "Báo cáo đang được hệ thống dựng — tải xuống khi sẵn sàng." });
      setTitle("");
      setKind("progress");
      setProjectId("");
      setSessionId("");
      onClose();
    },
    onError: (e) => toast({ title: "Chưa tạo được báo cáo", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Tạo báo cáo mới</DialogTitle>
          <DialogDescription>Chọn loại và phạm vi — hệ thống sẽ chụp lại số liệu tại thời điểm hiện tại.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="report-title">Tiêu đề</Label>
            <Input id="report-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Báo cáo tiến độ tháng 3" className={INPUT_CLS} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Loại báo cáo</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger className={`${INPUT_CLS} w-full`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Đồ án</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className={`${INPUT_CLS} w-full`}>
                  <SelectValue placeholder="Chọn đồ án" />
                </SelectTrigger>
                <SelectContent>
                  {(projects?.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="report-session">Mã phiên thực tập (tuỳ chọn)</Label>
            <Input id="report-session" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Dán UUID phiên nếu cần" className={INPUT_CLS} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={create.isPending || !title.trim() || !projectId} onClick={() => create.mutate()}>
            {create.isPending ? "Đang tạo…" : "Tạo báo cáo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
