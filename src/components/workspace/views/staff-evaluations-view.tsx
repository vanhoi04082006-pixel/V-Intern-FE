"use client";

/**
 * Đánh giá (staff) — hai bảng: kỳ đánh giá (tạo/mở/đóng, tiêu chí)
 * và bảng chấm điểm (rubric từng sinh viên + gợi ý AI).
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Lock, Plus, Send, Sparkles, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createEvaluationCycle,
  fetchAiSuggestions,
  fetchCycleCriteria,
  fetchEvaluation,
  fetchEvaluationCycles,
  fetchEvaluations,
  finalizeEvaluation,
  requestAiSuggestion,
  saveEvaluationScores,
  submitEvaluation,
  transitionCycle,
  type AiSuggestion,
  type EvaluationCycle,
  type EvaluationItem,
} from "@/lib/api/evaluation";
import { errorMessage } from "@/lib/api/transport";
import { fmtDate, fmtDateTime } from "@/lib/api/client";
import {
  Chip,
  EmptyState,
  ErrorState,
  KeyVal,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  SectionCard,
  StatusBadge,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const TYPE_LABELS: Record<string, string> = {
  formative: "Đánh giá quá trình",
  summarize: "Đánh giá tổng kết",
};

export function StaffEvaluationsView() {
  const [tab, setTab] = useState("cycles");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đánh giá"
        description="Tạo kỳ đánh giá, chấm điểm từng sinh viên theo tiêu chí có trọng số, và nhờ AI gợi ý điểm."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-11 w-full rounded-xl border-2 border-ink/12 bg-paper p-1">
          <TabsTrigger value="cycles" className="flex-1 rounded-lg px-3 text-[13px] font-bold">
            Kỳ đánh giá
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex-1 rounded-lg px-3 text-[13px] font-bold">
            Bảng đánh giá
          </TabsTrigger>
        </TabsList>
        <TabsContent value="cycles" className="mt-4">
          <CyclesTab />
        </TabsContent>
        <TabsContent value="evaluations" className="mt-4">
          <EvaluationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ───────────────────────── Tab: kỳ đánh giá ───────────────────────── */

function CyclesTab() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<EvaluationCycle | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["evaluation-cycles", status, page],
    queryFn: ({ signal }) =>
      fetchEvaluationCycles({ status: status === "all" ? undefined : status, page }, signal),
  });

  return (
    <>
      <SectionCard
        title="Các kỳ đánh giá"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Tạo kỳ đánh giá
          </Button>
        }
      >
        <div className="mb-4">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${INPUT_CLS} w-full sm:w-[200px]`}>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="open">Đang mở</SelectItem>
              <SelectItem value="closed">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState label="Đang tải kỳ đánh giá…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="Chưa có kỳ đánh giá nào"
            description="Tạo kỳ đánh giá để bắt đầu chấm điểm sinh viên theo tiêu chí."
          />
        ) : (
          <>
            <ListTable
              rows={data.data}
              rowKey={(c) => c.id}
              onRowClick={(c) => setSelectedCycle(c)}
              emptyTitle="Không tìm thấy kỳ đánh giá"
              columns={[
                { key: "code", header: "Mã", render: (c) => <span className="font-mono text-[12px] font-bold text-ink-soft">{c.code}</span> },
                { key: "name", header: "Tên", render: (c) => <span className="font-bold">{c.name}</span> },
                { key: "type", header: "Loại", render: (c) => TYPE_LABELS[c.type] ?? c.type },
                { key: "status", header: "Trạng thái", render: (c) => <StatusBadge status={c.status} /> },
                { key: "start", header: "Bắt đầu", render: (c) => fmtDate(c.startDate) },
                { key: "end", header: "Kết thúc", render: (c) => fmtDate(c.endDate) },
              ]}
            />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <CreateCycleDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <CycleDetailDialog cycle={selectedCycle} onClose={() => setSelectedCycle(null)} />
    </>
  );
}

function CreateCycleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("formative");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [useDefaultTemplate, setUseDefaultTemplate] = useState(true);

  const create = useMutation({
    mutationFn: () =>
      createEvaluationCycle({
        code: code.trim(),
        name: name.trim(),
        type,
        startDate,
        endDate,
        dueDate: dueDate || undefined,
        useDefaultTemplate,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["evaluation-cycles"] });
      toast({ title: "Đã tạo kỳ đánh giá ✦", description: name });
      setCode("");
      setName("");
      setType("formative");
      setStartDate("");
      setEndDate("");
      setDueDate("");
      setUseDefaultTemplate(true);
      onClose();
    },
    onError: (e) => toast({ title: "Chưa tạo được kỳ đánh giá", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Tạo kỳ đánh giá mới</DialogTitle>
          <DialogDescription>Chọn mẫu tiêu chí mặc định hoặc để trống rồi tự thêm sau.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cycle-code">Mã kỳ</Label>
              <Input id="cycle-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: EVAL-2025-1" className={INPUT_CLS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cycle-name">Tên kỳ</Label>
              <Input id="cycle-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Đánh giá giữa kỳ" className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Loại đánh giá</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className={`${INPUT_CLS} w-full`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formative">Đánh giá quá trình</SelectItem>
                <SelectItem value="summarize">Đánh giá tổng kết</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cycle-start">Bắt đầu</Label>
              <Input id="cycle-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cycle-end">Kết thúc</Label>
              <Input id="cycle-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cycle-due">Hạn chấm</Label>
              <Input id="cycle-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-ink/15 bg-paper px-4 text-sm font-bold text-ink hover:border-blue/50">
            <input
              type="checkbox"
              checked={useDefaultTemplate}
              onChange={(e) => setUseDefaultTemplate(e.target.checked)}
              className="h-4.5 w-4.5 accent-[var(--blue)]"
            />
            Dùng bộ tiêu chí mặc định
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={create.isPending || !code.trim() || !name.trim() || !startDate || !endDate} onClick={() => create.mutate()}>
            {create.isPending ? "Đang tạo…" : "Tạo kỳ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CycleDetailDialog({ cycle, onClose }: { cycle: EvaluationCycle | null; onClose: () => void }) {
  const open = !!cycle;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: criteria, isLoading } = useQuery({
    queryKey: ["cycle-criteria", cycle?.id],
    queryFn: ({ signal }) => fetchCycleCriteria(cycle!.id, signal),
    enabled: open,
  });

  const transition = useMutation({
    mutationFn: (status: string) => transitionCycle(cycle!.id, status),
    onSuccess: (_c, status) => {
      void queryClient.invalidateQueries({ queryKey: ["evaluation-cycles"] });
      toast({ title: status === "open" ? "Đã mở kỳ đánh giá ✦" : "Đã đóng kỳ đánh giá ✦" });
    },
    onError: (e) => toast({ title: "Chưa chuyển được trạng thái", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {cycle?.name ?? "Chi tiết kỳ đánh giá"}
            {cycle ? <StatusBadge status={cycle.status} /> : null}
          </DialogTitle>
          <DialogDescription>
            {cycle ? `Mã ${cycle.code} · ${TYPE_LABELS[cycle.type] ?? cycle.type}` : "…"}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !cycle ? (
          <LoadingState label="Đang tải kỳ đánh giá…" />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-paper p-4 sm:grid-cols-2">
              <KeyVal label="Bắt đầu">{fmtDate(cycle.startDate)}</KeyVal>
              <KeyVal label="Kết thúc">{fmtDate(cycle.endDate)}</KeyVal>
              <KeyVal label="Hạn chấm">{fmtDate(cycle.dueDate)}</KeyVal>
            </div>

            <div className="flex flex-wrap gap-2">
              {cycle.status === "draft" ? (
                <Button size="sm" disabled={transition.isPending} onClick={() => transition.mutate("open")} className="gap-2">
                  <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                  Mở kỳ
                </Button>
              ) : null}
              {cycle.status === "open" ? (
                <Button size="sm" variant="outline" disabled={transition.isPending} onClick={() => transition.mutate("closed")} className="gap-2">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Đóng kỳ
                </Button>
              ) : null}
              {cycle.status === "closed" ? (
                <p className="font-hand text-[15px] text-ink-faint">Kỳ đã đóng — chỉ xem lại.</p>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-sm font-extrabold text-ink">Tiêu chí &amp; trọng số</p>
              {!criteria || criteria.length === 0 ? (
                <p className="font-hand text-[15px] text-ink-faint">Kỳ này chưa có tiêu chí nào.</p>
              ) : (
                <ul className="divide-y-2 divide-dashed divide-ink/10 rounded-xl border-2 border-ink/12 bg-paper">
                  {criteria.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">
                          {c.name}
                          {c.isRequired ? <span className="ml-1 text-rose-500">*</span> : null}
                        </p>
                        {c.description ? <p className="truncate text-[12px] text-ink-faint">{c.description}</p> : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {c.maxScore != null ? <Chip>tối đa {c.maxScore}</Chip> : null}
                        <Chip tone="blue">trọng số {c.weight}</Chip>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Tab: bảng đánh giá ───────────────────────── */

function EvaluationsTab() {
  const [cycleId, setCycleId] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: cycles } = useQuery({
    queryKey: ["evaluation-cycles", "eval-filter"],
    queryFn: ({ signal }) => fetchEvaluationCycles({ page: 1 }, signal),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["evaluations", cycleId, status, page],
    queryFn: ({ signal }) =>
      fetchEvaluations(
        { cycleId: cycleId === "all" ? undefined : cycleId, status: status === "all" ? undefined : status, page },
        signal,
      ),
  });

  return (
    <>
      <SectionCard title="Bảng chấm điểm" description="Chọn phiếu đánh giá để chấm từng tiêu chí, gửi chấm và chốt điểm.">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <Select
            value={cycleId}
            onValueChange={(v) => {
              setCycleId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${INPUT_CLS} w-full`}>
              <SelectValue placeholder="Kỳ đánh giá" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi kỳ</SelectItem>
              {(cycles?.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
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
            <SelectTrigger className={`${INPUT_CLS} w-full`}>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="submitted">Đã nộp</SelectItem>
              <SelectItem value="finalized">Đã chốt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState label="Đang tải bảng đánh giá…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="Chưa có phiếu đánh giá nào"
            description="Phiếu được tạo khi sinh viên được xếp vào kỳ đánh giá."
          />
        ) : (
          <>
            <ListTable
              rows={data.data}
              rowKey={(e) => e.id}
              onRowClick={(e) => setSelectedId(e.id)}
              emptyTitle="Không tìm thấy phiếu phù hợp"
              columns={[
                { key: "intern", header: "Sinh viên", render: (e) => <span className="font-bold">{e.internName}</span> },
                { key: "cycle", header: "Kỳ", render: (e) => e.cycleName ?? "—" },
                { key: "evaluator", header: "Người chấm", render: (e) => e.evaluatorName ?? "—" },
                { key: "status", header: "Trạng thái", render: (e) => <StatusBadge status={e.status} /> },
                {
                  key: "score",
                  header: "Điểm",
                  render: (e) => (e.overallScore != null ? <span className="font-bold text-blue">{e.overallScore.toFixed(1)}</span> : "—"),
                },
              ]}
            />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <ScoringDialog evaluationId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}

function ScoringDialog({ evaluationId, onClose }: { evaluationId: string | null; onClose: () => void }) {
  const open = !!evaluationId;

  const { data: evaluation, isLoading, error, refetch } = useQuery({
    queryKey: ["evaluation", evaluationId],
    queryFn: ({ signal }) => fetchEvaluation(evaluationId!, signal),
    enabled: open,
  });

  const { data: suggestions } = useQuery({
    queryKey: ["ai-suggestions", evaluationId],
    queryFn: ({ signal }) => fetchAiSuggestions(evaluationId!, signal),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue" aria-hidden="true" />
            Chấm: {evaluation?.internName ?? "…"}
            {evaluation ? <StatusBadge status={evaluation.status} /> : null}
          </DialogTitle>
          <DialogDescription>
            {evaluation ? `Kỳ ${evaluation.cycleName ?? "—"} · người chấm ${evaluation.evaluatorName ?? "—"}` : "…"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState label="Đang tải phiếu đánh giá…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !evaluation ? null : (
          <ScoringForm key={evaluation.id} evaluation={evaluation} suggestions={suggestions ?? []} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Form chấm điểm — state khởi tạo từ phiếu; mount lại theo key=evaluation.id
 * để đổi phiếu khác thì form tự reset, không cần effect.
 */
function ScoringForm({
  evaluation,
  suggestions,
}: {
  evaluation: EvaluationItem;
  suggestions: AiSuggestion[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const evaluationId = evaluation.id;
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const s of evaluation.scores) init[s.criterionId] = s.score != null ? String(s.score) : "";
    return init;
  });
  const [comments, setComments] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const s of evaluation.scores) init[s.criterionId] = s.comment ?? "";
    return init;
  });
  const [summary, setSummary] = useState(evaluation.summary ?? "");
  const [draft, setDraft] = useState<AiSuggestion | null>(null);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    void queryClient.invalidateQueries({ queryKey: ["evaluation", evaluationId] });
  };

  const buildPayload = () => ({
    scores: evaluation.scores
      .filter((s) => scores[s.criterionId] !== "" && scores[s.criterionId] != null)
      .map((s) => ({
        criterionId: s.criterionId,
        score: Number(scores[s.criterionId]),
        comment: comments[s.criterionId]?.trim() || undefined,
      })),
    summary: summary.trim() || undefined,
  });

  const save = useMutation({
    mutationFn: () => saveEvaluationScores(evaluationId, buildPayload()),
    onSuccess: () => {
      invalidate();
      toast({ title: "Đã lưu điểm ✦" });
    },
    onError: (e) => toast({ title: "Chưa lưu được điểm", description: errorMessage(e), variant: "destructive" }),
  });

  const submit = useMutation({
    mutationFn: () => submitEvaluation(evaluationId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Đã gửi chấm ✦", description: "Điểm sẽ chờ chốt sau khi đủ người chấm." });
    },
    onError: (e) => toast({ title: "Chưa gửi được", description: errorMessage(e), variant: "destructive" }),
  });

  const finalize = useMutation({
    mutationFn: () => finalizeEvaluation(evaluationId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Đã chốt đánh giá ✦" });
    },
    onError: (e) => toast({ title: "Chưa chốt được", description: errorMessage(e), variant: "destructive" }),
  });

  const requestAi = useMutation({
    mutationFn: () => requestAiSuggestion(evaluationId),
    onSuccess: (suggestion) => {
      setDraft(suggestion);
      void queryClient.invalidateQueries({ queryKey: ["ai-suggestions", evaluationId] });
      toast({ title: "Đã nhận gợi ý AI ✦", description: "Nhấn “Áp dụng gợi ý” để điền nhanh điểm." });
    },
    onError: (e) => toast({ title: "AI chưa trả lời được", description: errorMessage(e), variant: "destructive" }),
  });

  const applyDraft = (s: AiSuggestion) => {
    const next: Record<string, string> = { ...scores };
    for (const row of evaluation.scores) {
      const hit = s.draftScores.find((d) => d.code === row.code);
      if (hit) next[row.criterionId] = String(hit.score);
    }
    setScores(next);
    if (s.draftSummary) setSummary(s.draftSummary);
    toast({ title: "Đã áp dụng bản nháp AI ✦", description: "Kiểm tra lại trước khi lưu nhé." });
  };

  return (
    <>
      <div className="space-y-4">
        {evaluation.scores.length === 0 ? (
          <EmptyState title="Phiếu chưa có tiêu chí" description="Kỳ đánh giá này chưa cấu hình tiêu chí chấm." />
        ) : (
          <div className="space-y-2">
            {evaluation.scores.map((row) => (
              <div
                key={row.criterionId}
                className="grid gap-2 rounded-xl border-2 border-ink/12 bg-paper p-3 sm:grid-cols-[1fr_110px_1fr] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{row.name}</p>
                  <p className="text-[11px] text-ink-faint">
                    trọng số {row.weight}
                    {row.maxScore != null ? ` · tối đa ${row.maxScore}` : ""}
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={row.maxScore ?? 10}
                  step={0.5}
                  value={scores[row.criterionId] ?? ""}
                  onChange={(e) => setScores((s) => ({ ...s, [row.criterionId]: e.target.value }))}
                  placeholder="0–10"
                  className="h-10 rounded-lg border-2 border-ink/20 bg-raised px-3 text-sm font-bold focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
                />
                <Input
                  value={comments[row.criterionId] ?? ""}
                  onChange={(e) => setComments((c) => ({ ...c, [row.criterionId]: e.target.value }))}
                  placeholder="Ghi chú tiêu chí…"
                  className="h-10 rounded-lg border-2 border-ink/15 bg-raised px-3 text-[13px] font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="eval-summary">Tổng kết</Label>
          <Textarea
            id="eval-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Nhận xét chung về sinh viên trong kỳ này…"
            className="min-h-[80px] rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
          />
        </div>

        {/* Gợi ý AI */}
        <div className="rounded-2xl border-2 border-blue/30 bg-blue-mist/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
              <Sparkles className="h-4 w-4 text-blue" aria-hidden="true" />
              Gợi ý AI
            </p>
            <Button variant="outline" size="sm" disabled={requestAi.isPending} onClick={() => requestAi.mutate()} className="gap-2">
              {requestAi.isPending ? "Đang suy nghĩ…" : "Lấy gợi ý mới"}
            </Button>
          </div>

          {draft ? (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {draft.draftScores.map((d) => (
                  <Chip key={d.code} tone="blue">
                    {d.code}: {d.score}
                  </Chip>
                ))}
              </div>
              {draft.draftSummary ? (
                <p className="whitespace-pre-line rounded-xl border-2 border-dashed border-blue/30 bg-raised p-3 text-[13px] leading-relaxed text-ink-soft">
                  {draft.draftSummary}
                </p>
              ) : null}
              <Button size="sm" onClick={() => applyDraft(draft)} className="gap-2">
                Áp dụng gợi ý
              </Button>
            </div>
          ) : (
            <p className="mt-1.5 font-hand text-[15px] text-ink-faint">
              AI sẽ đọc kết quả nhiệm vụ, bài nộp và hiệu suất để gợi ý điểm + nhận xét.
            </p>
          )}

          {suggestions.length > 0 ? (
            <div className="mt-3 border-t-2 border-dashed border-blue/30 pt-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">Lịch sử gợi ý</p>
              <ul className="mt-1 space-y-1">
                {suggestions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-[12px] text-ink-soft">
                    <span className="truncate">{fmtDateTime(s.createdAt)}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={s.status} />
                      <button
                        type="button"
                        onClick={() => applyDraft(s)}
                        className="font-bold text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
                      >
                        dùng lại
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t-2 border-dashed border-ink/10 pt-3">
          <Button variant="outline" size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Đang lưu…" : "Lưu điểm"}
          </Button>
          <Button size="sm" disabled={submit.isPending} onClick={() => submit.mutate()} className="gap-2">
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {submit.isPending ? "Đang gửi…" : "Gửi chấm"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={finalize.isPending}
            onClick={() => setConfirmFinalize(true)}
            className="gap-2 border-ink/30"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Chốt
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmFinalize} onOpenChange={setConfirmFinalize}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chốt đánh giá này?</AlertDialogTitle>
            <AlertDialogDescription>
              Sau khi chốt, điểm sẽ không còn chỉnh sửa được nữa và sinh viên sẽ thấy kết quả chính thức.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Để sau</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmFinalize(false);
                finalize.mutate();
              }}
            >
              Chốt đánh giá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
