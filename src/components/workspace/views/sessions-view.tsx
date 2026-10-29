"use client";

/**
 * Phiên thực tập — danh sách + lọc, tạo phiên mới, và hộp thoại chi tiết:
 * thành viên, giảng viên, cột mốc, GitHub, dòng thời gian, chuyển trạng thái.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Github, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  addSessionInstructors,
  addSessionMembers,
  createMilestone,
  createSession,
  fetchInstructorOptions,
  fetchMemberOptions,
  fetchMilestones,
  fetchSession,
  fetchSessionInstructors,
  fetchSessionMembers,
  fetchSessionRepoStatus,
  fetchSessionTimeline,
  fetchSessions,
  inviteSessionMembers,
  provisionSessionRepo,
  removeSessionMember,
  updateSession,
  type SessionSummary,
} from "@/lib/api/academic";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_OPTIONS = [
  { value: "planned", label: "Đã lên lịch" },
  { value: "active", label: "Đang hoạt động" },
  { value: "completed", label: "Hoàn thành" },
];

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const REPO_STATUS_LABELS: Record<string, string> = {
  none: "Chưa kết nối",
  invited: "Đã mời",
  accepted: "Đã nhận",
  active: "Đang hoạt động",
};

export function SessionsView() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sessions", q, status, page],
    queryFn: ({ signal }) =>
      fetchSessions({ q: q.trim() || undefined, status: status === "all" ? undefined : status, page }, signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phiên thực tập"
        description="Quản lý các kỳ thực tập: thành viên, giảng viên đồng hành, cột mốc và repository GitHub."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo phiên
          </Button>
        }
      />

      <SectionCard>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo mã hoặc tên phiên…"
              className={`${INPUT_CLS} pl-10`}
            />
          </div>
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
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <LoadingState label="Đang tải danh sách phiên…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="Chưa có phiên thực tập nào"
              description="Tạo phiên đầu tiên để bắt đầu nhận sinh viên, giao nhiệm vụ và mở repository."
            />
          ) : (
            <>
              <ListTable
                rows={data.data}
                rowKey={(s) => s.id}
                onRowClick={(s) => setSelectedId(s.id)}
                emptyTitle="Không tìm thấy phiên phù hợp"
                emptyDescription="Thử đổi từ khoá tìm kiếm hoặc bộ lọc trạng thái."
                columns={[
                  { key: "code", header: "Mã", render: (s) => <span className="font-mono text-[12px] font-bold text-ink-soft">{s.code}</span> },
                  { key: "name", header: "Tên", render: (s) => <span className="font-bold">{s.name}</span> },
                  { key: "status", header: "Trạng thái", render: (s) => <StatusBadge status={s.status} /> },
                  { key: "lead", header: "GV phụ trách", render: (s) => s.leadInstructorName ?? "—" },
                  { key: "interns", header: "SV", render: (s) => `${s.internCount}` },
                  { key: "start", header: "Bắt đầu", render: (s) => fmtDate(s.startDate) },
                  { key: "end", header: "Kết thúc", render: (s) => fmtDate(s.endDate) },
                ]}
              />
              <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </SectionCard>

      <CreateSessionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <SessionDetailDialog sessionId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

/* ───────────────────────── Tạo phiên mới ───────────────────────── */

function CreateSessionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leadInstructorId, setLeadInstructorId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: instructors } = useQuery({
    queryKey: ["instructor-options"],
    queryFn: ({ signal }) => fetchInstructorOptions(undefined, signal),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      createSession({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        leadInstructorId: leadInstructorId || undefined,
        startDate,
        endDate,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({ title: "Đã tạo phiên thực tập ✦", description: name });
      setCode("");
      setName("");
      setDescription("");
      setLeadInstructorId("");
      setStartDate("");
      setEndDate("");
      onClose();
    },
    onError: (e) => toast({ title: "Chưa tạo được phiên", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Tạo phiên thực tập mới</DialogTitle>
          <DialogDescription>Điền thông tin cơ bản — có thể bổ sung thành viên và cột mốc ngay sau đó.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="session-code">Mã phiên</Label>
              <Input id="session-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: INT-2025-01" className={INPUT_CLS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="session-name">Tên phiên</Label>
              <Input id="session-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Thực tập khắc 2025" className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="session-desc">Mô tả</Label>
            <Textarea id="session-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mục tiêu, phạm vi của phiên…" className="min-h-[80px] rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25" />
          </div>
          <div className="grid gap-1.5">
            <Label>Giảng viên phụ trách</Label>
            <Select value={leadInstructorId} onValueChange={setLeadInstructorId}>
              <SelectTrigger className={`${INPUT_CLS} w-full`}>
                <SelectValue placeholder="Chọn giảng viên" />
              </SelectTrigger>
              <SelectContent>
                {(instructors ?? []).map((i) => (
                  <SelectItem key={i.userId} value={i.userId}>
                    {i.displayName} ({i.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="session-start">Ngày bắt đầu</Label>
              <Input id="session-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="session-end">Ngày kết thúc</Label>
              <Input id="session-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            disabled={create.isPending || !code.trim() || !name.trim() || !startDate || !endDate}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang tạo…" : "Tạo phiên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Chi tiết phiên ───────────────────────── */

function SessionDetailDialog({ sessionId, onClose }: { sessionId: string | null; onClose: () => void }) {
  const open = !!sessionId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("members");

  const invalidate = (keys: unknown[][]) => {
    keys.forEach((key) => void queryClient.invalidateQueries({ queryKey: key }));
  };

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: ({ signal }) => fetchSession(sessionId!, signal),
    enabled: open,
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => updateSession(sessionId!, { status }),
    onSuccess: () => {
      invalidate([["sessions"], ["session", sessionId], ["instructor-dashboard"]]);
      toast({ title: "Đã cập nhật trạng thái phiên ✦" });
    },
    onError: (e) => toast({ title: "Chưa chuyển được trạng thái", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {session?.name ?? "Chi tiết phiên"}
            {session ? <StatusBadge status={session.status} /> : null}
          </DialogTitle>
          <DialogDescription>Mã phiên: {session?.code ?? "…"}</DialogDescription>
        </DialogHeader>

        {isLoading || !session ? (
          <LoadingState label="Đang tải chi tiết phiên…" />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-paper p-4 sm:grid-cols-2">
              <KeyVal label="Trạng thái">
                <Select value={session.status} onValueChange={(v) => v !== session.status && updateStatus.mutate(v)}>
                  <SelectTrigger className="h-9 w-[190px] rounded-lg border-2 border-ink/20 bg-raised px-3 text-[13px] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </KeyVal>
              <KeyVal label="GV phụ trách">{session.leadInstructorName ?? "—"}</KeyVal>
              <KeyVal label="Bắt đầu">{fmtDate(session.startDate)}</KeyVal>
              <KeyVal label="Kết thúc">{fmtDate(session.endDate)}</KeyVal>
              <KeyVal label="Số sinh viên">{session.internCount}</KeyVal>
              <KeyVal label="Số đồ án">{session.projectCount}</KeyVal>
            </div>
            {session.description ? (
              <p className="rounded-2xl border-2 border-ink/10 bg-paper p-4 text-[13px] leading-relaxed text-ink-soft">
                {session.description}
              </p>
            ) : null}

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex h-11 w-full justify-start overflow-x-auto rounded-xl border-2 border-ink/12 bg-paper p-1">
                <TabsTrigger value="members" className="rounded-lg px-3 text-[13px] font-bold">Thành viên</TabsTrigger>
                <TabsTrigger value="instructors" className="rounded-lg px-3 text-[13px] font-bold">Giảng viên</TabsTrigger>
                <TabsTrigger value="milestones" className="rounded-lg px-3 text-[13px] font-bold">Cột mốc</TabsTrigger>
                <TabsTrigger value="github" className="rounded-lg px-3 text-[13px] font-bold">GitHub</TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-lg px-3 text-[13px] font-bold">Dòng thời gian</TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="mt-4">
                <MembersTab sessionId={session.id} onInvalidate={invalidate} />
              </TabsContent>
              <TabsContent value="instructors" className="mt-4">
                <InstructorsTab sessionId={session.id} onInvalidate={invalidate} />
              </TabsContent>
              <TabsContent value="milestones" className="mt-4">
                <MilestonesTab sessionId={session.id} onInvalidate={invalidate} />
              </TabsContent>
              <TabsContent value="github" className="mt-4">
                <GitHubTab sessionId={session.id} onInvalidate={invalidate} />
              </TabsContent>
              <TabsContent value="timeline" className="mt-4">
                <TimelineTab sessionId={session.id} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Tab: thành viên ── */

function MembersTab({
  sessionId,
  onInvalidate,
}: {
  sessionId: string;
  onInvalidate: (keys: string[][]) => void;
}) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: members, isLoading } = useQuery({
    queryKey: ["session-members", sessionId],
    queryFn: ({ signal }) => fetchSessionMembers(sessionId, signal),
  });
  const { data: options } = useQuery({
    queryKey: ["member-options", sessionId],
    queryFn: ({ signal }) => fetchMemberOptions({ sessionId }, signal),
  });

  const add = useMutation({
    mutationFn: () => addSessionMembers(sessionId, Array.from(selected)),
    onSuccess: () => {
      onInvalidate([["session-members", sessionId], ["member-options", sessionId], ["sessions"], ["session", sessionId]]);
      setSelected(new Set());
      toast({ title: "Đã thêm thành viên vào phiên ✦" });
    },
    onError: (e) => toast({ title: "Chưa thêm được thành viên", description: errorMessage(e), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeSessionMember(sessionId, userId),
    onSuccess: () => {
      onInvalidate([["session-members", sessionId], ["member-options", sessionId], ["sessions"], ["session", sessionId]]);
      toast({ title: "Đã xoá thành viên khỏi phiên" });
    },
    onError: (e) => toast({ title: "Chưa xoá được", description: errorMessage(e), variant: "destructive" }),
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {isLoading ? (
          <LoadingState label="Đang tải thành viên…" />
        ) : !members || members.length === 0 ? (
          <EmptyState title="Chưa có thành viên" description="Thêm sinh viên vào phiên để bắt đầu giao nhiệm vụ." />
        ) : (
          <ul className="divide-y-2 divide-dashed divide-ink/10 rounded-xl border-2 border-ink/12 bg-paper">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{m.displayName}</p>
                  <p className="truncate text-[12px] text-ink-faint">{m.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(m.userId)}
                  className="shrink-0 gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Xoá
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator />
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-ink">
          <UserPlus className="h-4 w-4 text-blue" aria-hidden="true" />
          Thêm thành viên
        </p>
        {!options || options.length === 0 ? (
          <p className="font-hand text-[15px] text-ink-faint">Không còn người dùng nào để thêm.</p>
        ) : (
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border-2 border-dashed border-ink/15 bg-paper p-3">
            {options.map((o) => (
              <label
                key={o.userId}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm font-medium text-ink hover:bg-blue-mist/50"
              >
                <span className="min-w-0 truncate">
                  {o.displayName} <span className="text-[12px] text-ink-faint">· {o.email}</span>
                </span>
                <input
                  type="checkbox"
                  checked={selected.has(o.userId)}
                  onChange={() => toggle(o.userId)}
                  className="h-4.5 w-4.5 shrink-0 accent-[var(--blue)]"
                />
              </label>
            ))}
          </div>
        )}
        <Button
          size="sm"
          className="mt-3 gap-2"
          disabled={selected.size === 0 || add.isPending}
          onClick={() => add.mutate()}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Thêm {selected.size > 0 ? `${selected.size} ` : ""}thành viên
        </Button>
      </div>
    </div>
  );
}

/* ── Tab: giảng viên ── */

function InstructorsTab({
  sessionId,
  onInvalidate,
}: {
  sessionId: string;
  onInvalidate: (keys: string[][]) => void;
}) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: instructors, isLoading } = useQuery({
    queryKey: ["session-instructors", sessionId],
    queryFn: ({ signal }) => fetchSessionInstructors(sessionId, signal),
  });
  const { data: options } = useQuery({
    queryKey: ["instructor-options"],
    queryFn: ({ signal }) => fetchInstructorOptions(undefined, signal),
  });

  const add = useMutation({
    mutationFn: () => addSessionInstructors(sessionId, Array.from(selected)),
    onSuccess: () => {
      onInvalidate([["session-instructors", sessionId], ["sessions"], ["session", sessionId]]);
      setSelected(new Set());
      toast({ title: "Đã thêm giảng viên đồng hành ✦" });
    },
    onError: (e) => toast({ title: "Chưa thêm được giảng viên", description: errorMessage(e), variant: "destructive" }),
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <LoadingState label="Đang tải giảng viên…" />
      ) : !instructors || instructors.length === 0 ? (
        <EmptyState title="Chưa có giảng viên đồng hành" description="Thêm giảng viên khác để cùng chấm bài và đồng hành phiên này." />
      ) : (
        <ul className="divide-y-2 divide-dashed divide-ink/10 rounded-xl border-2 border-ink/12 bg-paper">
          {instructors.map((m) => (
            <li key={m.userId} className="px-4 py-2.5">
              <p className="text-sm font-bold text-ink">{m.displayName}</p>
              <p className="text-[12px] text-ink-faint">{m.email}</p>
            </li>
          ))}
        </ul>
      )}

      <Separator />
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-ink">
          <UserPlus className="h-4 w-4 text-blue" aria-hidden="true" />
          Thêm giảng viên
        </p>
        {!options || options.length === 0 ? (
          <p className="font-hand text-[15px] text-ink-faint">Không còn giảng viên nào để thêm.</p>
        ) : (
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border-2 border-dashed border-ink/15 bg-paper p-3">
            {options.map((o) => (
              <label
                key={o.userId}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm font-medium text-ink hover:bg-blue-mist/50"
              >
                <span className="min-w-0 truncate">
                  {o.displayName} <span className="text-[12px] text-ink-faint">· {o.email}</span>
                </span>
                <input
                  type="checkbox"
                  checked={selected.has(o.userId)}
                  onChange={() => toggle(o.userId)}
                  className="h-4.5 w-4.5 shrink-0 accent-[var(--blue)]"
                />
              </label>
            ))}
          </div>
        )}
        <Button
          size="sm"
          className="mt-3 gap-2"
          disabled={selected.size === 0 || add.isPending}
          onClick={() => add.mutate()}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Thêm {selected.size > 0 ? `${selected.size} ` : ""}giảng viên
        </Button>
      </div>
    </div>
  );
}

/* ── Tab: cột mốc ── */

function MilestonesTab({
  sessionId,
  onInvalidate,
}: {
  sessionId: string;
  onInvalidate: (keys: string[][]) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["session-milestones", sessionId],
    queryFn: ({ signal }) => fetchMilestones(sessionId, signal),
  });

  const create = useMutation({
    mutationFn: () => createMilestone(sessionId, { name: name.trim(), dueDate: dueDate || undefined }),
    onSuccess: () => {
      onInvalidate([["session-milestones", sessionId]]);
      setName("");
      setDueDate("");
      toast({ title: "Đã thêm cột mốc ✦" });
    },
    onError: (e) => toast({ title: "Chưa thêm được cột mốc", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <LoadingState label="Đang tải cột mốc…" />
      ) : !milestones || milestones.length === 0 ? (
        <EmptyState title="Chưa có cột mốc" description="Tạo cột mốc để sinh viên biết các mốc quan trọng của phiên." />
      ) : (
        <ol className="space-y-2">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink/12 bg-paper px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{m.name}</p>
                <p className="text-[12px] text-ink-faint">Hạn: {fmtDate(m.dueDate)}</p>
              </div>
              {m.completed ? <Chip tone="green">Đã hoàn thành</Chip> : <Chip tone="blue">Đang chờ</Chip>}
            </li>
          ))}
        </ol>
      )}

      <Separator />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="milestone-name">Tên cột mốc</Label>
          <Input id="milestone-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Demo giữa kỳ" className={INPUT_CLS} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="milestone-due">Hạn chót</Label>
          <Input id="milestone-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={INPUT_CLS} />
        </div>
        <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm
        </Button>
      </div>
    </div>
  );
}

/* ── Tab: GitHub ── */

function GitHubTab({
  sessionId,
  onInvalidate,
}: {
  sessionId: string;
  onInvalidate: (keys: string[][]) => void;
}) {
  const { toast } = useToast();

  const { data: repo, isLoading, error, refetch } = useQuery({
    queryKey: ["session-repo", sessionId],
    queryFn: ({ signal }) => fetchSessionRepoStatus(sessionId, signal),
  });

  const provision = useMutation({
    mutationFn: () => provisionSessionRepo(sessionId),
    onSuccess: () => {
      onInvalidate([["session-repo", sessionId]]);
      toast({ title: "Đã khởi tạo repository cho phiên ✦" });
    },
    onError: (e) => toast({ title: "Chưa khởi tạo được repository", description: errorMessage(e), variant: "destructive" }),
  });

  const invite = useMutation({
    mutationFn: () => inviteSessionMembers(sessionId),
    onSuccess: () => {
      onInvalidate([["session-repo", sessionId]]);
      toast({ title: "Đã gửi lời mời repository ✦" });
    },
    onError: (e) => toast({ title: "Chưa gửi được lời mời", description: errorMessage(e), variant: "destructive" }),
  });

  if (isLoading) return <LoadingState label="Đang kiểm tra repository…" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;
  if (!repo) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-paper p-4">
        <KeyVal label="Kết nối">
          {repo.connected ? <Chip tone="green">Đã kết nối</Chip> : <Chip>Chưa kết nối</Chip>}
        </KeyVal>
        <KeyVal label="Repository">
          {repo.repositoryUrl ? (
            <a
              href={repo.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
            >
              <Github className="h-3.5 w-3.5" aria-hidden="true" />
              {repo.repositoryUrl.replace(/^https?:\/\/github\.com\//, "")}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : (
            "—"
          )}
        </KeyVal>
        <KeyVal label="Lời mời chờ nhận">{repo.invitationPending}</KeyVal>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={provision.isPending} onClick={() => provision.mutate()} className="gap-2">
          <Github className="h-3.5 w-3.5" aria-hidden="true" />
          {provision.isPending ? "Đang khởi tạo…" : "Khởi tạo repository"}
        </Button>
        <Button size="sm" disabled={invite.isPending} onClick={() => invite.mutate()} className="gap-2">
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          {invite.isPending ? "Đang mời…" : "Mời thành viên vào repo"}
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-extrabold text-ink">Trạng thái GitHub thành viên</p>
        {repo.members.length === 0 ? (
          <p className="font-hand text-[15px] text-ink-faint">Chưa có thành viên nào trong repository.</p>
        ) : (
          <ul className="divide-y-2 divide-dashed divide-ink/10 rounded-xl border-2 border-ink/12 bg-paper">
            {repo.members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{m.displayName}</p>
                  <p className="truncate text-[12px] text-ink-faint">{m.login ? `@${m.login}` : "chưa liên kết GitHub"}</p>
                </div>
                <StatusBadge status={m.status} className="shrink-0" />
                <span className="sr-only">{REPO_STATUS_LABELS[m.status] ?? m.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Tab: dòng thời gian ── */

function TimelineTab({ sessionId }: { sessionId: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["session-timeline", sessionId],
    queryFn: ({ signal }) => fetchSessionTimeline(sessionId, signal),
  });

  if (isLoading) return <LoadingState label="Đang tải dòng thời gian…" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;
  if (!data || data.length === 0)
    return <EmptyState title="Chưa có hoạt động nào" description="Mọi thay đổi của phiên sẽ được ghi lại tại đây." />;

  return (
    <ol className="relative space-y-3 border-l-2 border-dashed border-ink/20 pl-5">
      {data.map((t) => (
        <li key={t.id} className="relative">
          <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-blue bg-raised" aria-hidden="true" />
          <p className="text-sm font-bold text-ink">{t.title}</p>
          <p className="text-[12px] text-ink-faint">
            {t.kind} · {t.actorName ?? "hệ thống"} · {fmtDateTime(t.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}
