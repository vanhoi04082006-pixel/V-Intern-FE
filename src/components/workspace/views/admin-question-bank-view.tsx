"use client";

/**
 * Ngân hàng câu hỏi phỏng vấn — thêm câu hỏi theo mục (giới thiệu /
 * chuyên môn / tiếng Anh), nghỉ hưu câu hỏi lỗi thời.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createBankQuestion, fetchQuestionBank, retireBankQuestion, type BankQuestion } from "@/lib/api/recruitment";
import { errorMessage } from "@/lib/api/transport";
import {
  Chip,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const triggerCls =
  "h-11 w-full rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const SECTIONS: { value: string; label: string }[] = [
  { value: "intro", label: "Giới thiệu" },
  { value: "technical", label: "Chuyên môn" },
  { value: "english", label: "Tiếng Anh" },
];

const SECTION_LABELS: Record<string, string> = Object.fromEntries(SECTIONS.map((s) => [s.value, s.label]));

function truncate(text: string, max = 90): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function AdminQuestionBankView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [section, setSection] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [retiring, setRetiring] = useState<BankQuestion | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-question-bank", section, page],
    queryFn: ({ signal }) =>
      fetchQuestionBank({ section: section === "all" ? undefined : section, page }, signal),
  });

  const retire = useMutation({
    mutationFn: (q: BankQuestion) => retireBankQuestion(q.id, q.version),
    onSuccess: () => {
      toast({ title: "Đã cho câu hỏi nghỉ hưu" });
      void queryClient.invalidateQueries({ queryKey: ["admin-question-bank"] });
      setRetiring(null);
    },
    onError: (e) => toast({ title: "Nghỉ hưu thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const columns: Column<BankQuestion>[] = [
    { key: "section", header: "Mục", render: (q) => <Chip tone="blue">{SECTION_LABELS[q.section] ?? q.section}</Chip> },
    {
      key: "prompt",
      header: "Câu hỏi",
      render: (q) => (
        <span className="block max-w-md text-[13px] leading-relaxed text-ink" title={q.prompt}>
          {truncate(q.prompt)}
        </span>
      ),
    },
    { key: "language", header: "Ngôn ngữ", render: (q) => <span className="text-[13px]">{q.language === "en" ? "Tiếng Anh" : "Tiếng Việt"}</span> },
    { key: "status", header: "Trạng thái", render: (q) => <StatusBadge status={q.status} /> },
    { key: "version", header: "Phiên bản", render: (q) => <span className="font-mono text-[12px]">v{q.version}</span> },
    {
      key: "actions",
      header: "Hành động",
      className: "text-right",
      render: (q) =>
        q.status !== "retired" ? (
          <Button
            variant="outline"
            size="sm"
            className="border-rose-300 font-bold text-rose-600 hover:bg-rose-50"
            onClick={() => setRetiring(q)}
          >
            Nghỉ hưu
          </Button>
        ) : (
          <span className="text-[12px] text-ink-faint">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ngân hàng câu hỏi"
        description="Kho câu hỏi cho buổi phỏng vấn AI — quản lý theo mục và ngôn ngữ."
        actions={
          <Button
            className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            onClick={() => setCreateOpen(true)}
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Thêm câu hỏi
          </Button>
        }
      />

      <SectionCard title="Danh sách câu hỏi">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Select
            value={section}
            onValueChange={(v) => {
              setSection(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${triggerCls} sm:w-[240px]`} aria-label="Lọc mục">
              <SelectValue placeholder="Mục câu hỏi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi mục</SelectItem>
              {SECTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState label="Đang tải câu hỏi…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable
            columns={columns}
            rows={[]}
            rowKey={(q) => q.id}
            emptyTitle="Chưa có câu hỏi nào"
            emptyDescription="Thêm câu hỏi để hệ thống phỏng vấn AI có nguồn câu hỏi."
          />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(q) => q.id} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <CreateQuestionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin-question-bank"] });
          setCreateOpen(false);
        }}
      />

      <AlertDialog open={!!retiring} onOpenChange={(open) => !open && setRetiring(null)}>
        <AlertDialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
              Cho câu hỏi này nghỉ hưu?
            </AlertDialogTitle>
            <AlertDialogDescription>
              “{retiring ? truncate(retiring.prompt, 120) : ""}” (phiên bản {retiring?.version}) sẽ ngừng được sử dụng trong các buổi phỏng vấn mới.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-xl">Để sau</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700"
              disabled={retire.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (retiring) retire.mutate(retiring);
              }}
            >
              {retire.isPending ? "Đang xử lý…" : "Nghỉ hưu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ───────────────────────── Thêm câu hỏi ───────────────────────── */

function CreateQuestionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [section, setSection] = useState("intro");
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("vi");

  const create = useMutation({
    mutationFn: () =>
      createBankQuestion({
        section,
        prompt: prompt.trim(),
        language,
      }),
    onSuccess: () => {
      toast({ title: "Đã thêm câu hỏi ✦" });
      setSection("intro");
      setPrompt("");
      setLanguage("vi");
      onCreated();
    },
    onError: (e) => toast({ title: "Thêm câu hỏi thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Thêm câu hỏi mới</DialogTitle>
          <DialogDescription>Câu hỏi sẽ vào ngân hàng và có thể được AI chọn khi phỏng vấn.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Mục</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className={triggerCls} aria-label="Mục câu hỏi">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Ngôn ngữ</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className={triggerCls} aria-label="Ngôn ngữ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">Tiếng Anh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="question-prompt">Nội dung câu hỏi</Label>
            <Textarea
              id="question-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[110px] rounded-xl border-2 border-ink/20 bg-raised px-4 py-2.5 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
              placeholder="Viết câu hỏi đầy đủ, rõ ràng cho ứng viên…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={prompt.trim().length < 5 || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang thêm…" : "Thêm câu hỏi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
