"use client";

/**
 * Kho tri thức — tạo mục tri thức, sửa bản nháp, xuất bản / lưu trữ.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, FilePlus2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  archiveKnowledgeEntry,
  createKnowledgeEntry,
  fetchKnowledge,
  publishKnowledgeEntry,
  updateKnowledgeEntry,
  type KnowledgeEntry,
} from "@/lib/api/admin";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";
const triggerCls =
  "h-11 w-full rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";
const textareaCls =
  "min-h-[120px] rounded-xl border-2 border-ink/20 bg-raised px-4 py-2.5 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

export function AdminKnowledgeView() {
  const queryClient = useQueryClient();
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [qInput]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-knowledge", q, status, page],
    queryFn: ({ signal }) =>
      fetchKnowledge({ q: q || undefined, status: status === "all" ? undefined : status, page }, signal),
  });

  const columns: Column<KnowledgeEntry>[] = [
    {
      key: "code",
      header: "Mã",
      render: (k) => <span className="font-mono text-[12px] font-bold text-blue">{k.code}</span>,
    },
    { key: "title", header: "Tiêu đề", render: (k) => <span className="font-semibold text-ink">{k.title}</span> },
    { key: "status", header: "Trạng thái", render: (k) => <StatusBadge status={k.status} /> },
    { key: "version", header: "Phiên bản", render: (k) => <span className="font-mono text-[12px]">v{k.version}</span> },
    { key: "updatedAt", header: "Cập nhật", render: (k) => <span className="text-[13px] text-ink-soft">{fmtDateTime(k.updatedAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho tri thức"
        description="Nguồn tri thức cho AI trả lời — tạo, sửa bản nháp, xuất bản và lưu trữ."
        actions={
          <Button
            className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            onClick={() => setCreateOpen(true)}
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Tạo mục
          </Button>
        }
      />

      <SectionCard title="Danh sách mục tri thức" description="Nhấn vào một dòng để sửa, xuất bản hoặc lưu trữ.">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Tìm theo mã hoặc tiêu đề…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className={inputCls}
            aria-label="Tìm mục tri thức"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${triggerCls} sm:w-[210px]`} aria-label="Lọc trạng thái">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="archived">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState label="Đang tải kho tri thức…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable columns={columns} rows={[]} rowKey={(k) => k.id} emptyTitle="Chưa có mục nào" emptyDescription="Tạo mục tri thức để AI có nguồn trả lời." />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(k) => k.id} onRowClick={(k) => setEditing(k)} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <CreateKnowledgeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin-knowledge"] });
          setCreateOpen(false);
        }}
      />
      <EditKnowledgeDialog
        entry={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onChanged={() => void queryClient.invalidateQueries({ queryKey: ["admin-knowledge"] })}
      />
    </div>
  );
}

/* ───────────────────────── Tạo mục ───────────────────────── */

function CreateKnowledgeDialog({
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
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createKnowledgeEntry({
        code: code.trim(),
        draft: { title: title.trim(), body: body },
      }),
    onSuccess: () => {
      toast({ title: "Đã tạo mục tri thức ✦", description: "Mục ở trạng thái bản nháp — xuất bản khi sẵn sàng." });
      setCode("");
      setTitle("");
      setBody("");
      onCreated();
    },
    onError: (e) => toast({ title: "Tạo mục thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const valid = code.trim().length > 0 && title.trim().length > 0 && body.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-ink">
            <BookOpen className="h-4 w-4 text-blue" aria-hidden="true" />
            Tạo mục tri thức mới
          </DialogTitle>
          <DialogDescription>Nội dung sẽ được lưu thành bản nháp của phiên bản đầu tiên.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="kn-code">Mã mục</Label>
            <Input id="kn-code" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="vd: quy-trinh-review-pr" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="kn-title">Tiêu đề</Label>
            <Input id="kn-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="vd: Quy trình review pull request" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="kn-body">Nội dung</Label>
            <Textarea id="kn-body" value={body} onChange={(e) => setBody(e.target.value)} className={textareaCls} placeholder="Viết nội dung tri thức bằng Markdown…" />
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
            {create.isPending ? "Đang tạo…" : "Tạo mục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Sửa mục ───────────────────────── */

function EditKnowledgeDialog({
  entry,
  onOpenChange,
  onChanged,
}: {
  entry: KnowledgeEntry | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-ink/15 bg-paper">
        {entry ? <EditKnowledgeForm key={entry.id} entry={entry} onOpenChange={onOpenChange} onChanged={onChanged} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function EditKnowledgeForm({
  entry,
  onOpenChange,
  onChanged,
}: {
  entry: KnowledgeEntry;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState("");

  const update = useMutation({
    mutationFn: () =>
      updateKnowledgeEntry(entry.code, {
        version: entry.version,
        draft: { title: title.trim(), body: body },
      }),
    onSuccess: () => {
      toast({ title: "Đã lưu bản nháp ✦" });
      onChanged();
    },
    onError: (e) => toast({ title: "Lưu bản nháp thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const publish = useMutation({
    mutationFn: () => publishKnowledgeEntry(entry.code, entry.version),
    onSuccess: () => {
      toast({ title: "Đã xuất bản ✦" });
      onChanged();
      onOpenChange(false);
    },
    onError: (e) => toast({ title: "Xuất bản thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const archive = useMutation({
    mutationFn: () => archiveKnowledgeEntry(entry.code, entry.version),
    onSuccess: () => {
      toast({ title: "Đã lưu trữ mục" });
      onChanged();
      onOpenChange(false);
    },
    onError: (e) => toast({ title: "Lưu trữ thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const busy = update.isPending || publish.isPending || archive.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-ink">Sửa mục “{entry.title}”</DialogTitle>
        <DialogDescription>
          Mã <span className="font-mono text-blue">{entry.code}</span> · phiên bản v{entry.version} ·{" "}
          <StatusBadge status={entry.status} />
        </DialogDescription>
      </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-kn-title">Tiêu đề</Label>
            <Input id="edit-kn-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-kn-body">Nội dung (bản nháp mới)</Label>
            <Textarea id="edit-kn-body" value={body} onChange={(e) => setBody(e.target.value)} className={textareaCls} placeholder="Để trống nếu chỉ giữ nguyên nội dung cũ…" />
          </div>
        </div>
        <DialogFooter className="flex-row flex-wrap gap-2">
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl border-2 border-rose-300 font-bold text-rose-600 hover:bg-rose-50"
            disabled={busy}
            onClick={() => archive.mutate()}
          >
            {archive.isPending ? "Đang lưu trữ…" : "Lưu trữ"}
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl border-2 border-emerald-300 font-bold text-emerald-700 hover:bg-emerald-50"
            disabled={busy}
            onClick={() => publish.mutate()}
          >
            {publish.isPending ? "Đang xuất bản…" : "Xuất bản"}
          </Button>
          <Button
            className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={busy || title.trim().length === 0}
            onClick={() => update.mutate()}
          >
            {update.isPending ? "Đang lưu…" : "Lưu bản nháp"}
          </Button>
        </DialogFooter>
    </>
  );
}
