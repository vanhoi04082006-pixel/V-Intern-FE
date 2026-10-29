"use client";

/**
 * Lớp học — danh sách lớp, quản lý thành viên, buổi học và điểm danh.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Check, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  addClassMembers,
  createClass,
  createClassLesson,
  fetchClassLessons,
  fetchClassMembers,
  fetchClasses,
  fetchLessonAttendance,
  fetchMemberOptions,
  removeClassMember,
  saveLessonAttendance,
  type ClassSummary,
} from "@/lib/api/academic";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  EmptyState,
  ErrorState,
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

export function ClassesView() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["classes", q, page],
    queryFn: ({ signal }) => fetchClasses({ q: q.trim() || undefined, page }, signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lớp học"
        description="Các lớp học bổ trợ trong phiên thực tập — quản lý thành viên, buổi học và điểm danh."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo lớp học
          </Button>
        }
      />

      <SectionCard>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã hoặc tên lớp…"
            className={`${INPUT_CLS} pl-10`}
          />
        </div>
        <div className="mt-4">
          {isLoading ? (
            <LoadingState label="Đang tải danh sách lớp…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="Chưa có lớp học nào"
              description="Tạo lớp học để tổ chức buổi học, điểm danh và theo dõi chuyên cần."
            />
          ) : (
            <>
              <ListTable
                rows={data.data}
                rowKey={(c) => c.id}
                onRowClick={(c) => setSelectedId(c.id)}
                emptyTitle="Không tìm thấy lớp phù hợp"
                emptyDescription="Thử đổi từ khoá tìm kiếm."
                columns={[
                  { key: "code", header: "Mã", render: (c) => <span className="font-mono text-[12px] font-bold text-ink-soft">{c.code}</span> },
                  { key: "name", header: "Tên", render: (c) => <span className="font-bold">{c.name}</span> },
                  { key: "status", header: "Trạng thái", render: (c) => <StatusBadge status={c.status} /> },
                  { key: "members", header: "Thành viên", render: (c) => `${c.memberCount}` },
                  { key: "lessons", header: "Buổi học", render: (c) => `${c.lessonCount}` },
                ]}
              />
              <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </SectionCard>

      <CreateClassDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <ClassDetailDialog classId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

/* ───────────────────────── Tạo lớp học ───────────────────────── */

function CreateClassDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => createClass({ code: code.trim(), name: name.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Đã tạo lớp học ✦", description: name });
      setCode("");
      setName("");
      onClose();
    },
    onError: (e) => toast({ title: "Chưa tạo được lớp", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo lớp học mới</DialogTitle>
          <DialogDescription>Nhập mã và tên lớp — sau đó thêm thành viên và buổi học.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="class-code">Mã lớp</Label>
            <Input id="class-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: WEB-101" className={INPUT_CLS} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="class-name">Tên lớp</Label>
            <Input id="class-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Ôn tập Spring Boot" className={INPUT_CLS} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={create.isPending || !code.trim() || !name.trim()} onClick={() => create.mutate()}>
            {create.isPending ? "Đang tạo…" : "Tạo lớp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Chi tiết lớp ───────────────────────── */

function ClassDetailDialog({ classId, onClose }: { classId: string | null; onClose: () => void }) {
  const open = !!classId;
  const [tab, setTab] = useState("members");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết lớp học</DialogTitle>
          <DialogDescription>Quản lý thành viên, buổi học và điểm danh của lớp.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-11 w-full justify-start rounded-xl border-2 border-ink/12 bg-paper p-1">
            <TabsTrigger value="members" className="flex-1 rounded-lg px-3 text-[13px] font-bold">Thành viên</TabsTrigger>
            <TabsTrigger value="lessons" className="flex-1 rounded-lg px-3 text-[13px] font-bold">Buổi học</TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="mt-4">
            {classId ? <ClassMembersTab classId={classId} /> : null}
          </TabsContent>
          <TabsContent value="lessons" className="mt-4">
            {classId ? <ClassLessonsTab classId={classId} /> : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ClassMembersTab({ classId }: { classId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: members, isLoading } = useQuery({
    queryKey: ["class-members", classId],
    queryFn: ({ signal }) => fetchClassMembers(classId, signal),
  });
  const { data: options } = useQuery({
    queryKey: ["class-member-options", classId],
    queryFn: ({ signal }) => fetchMemberOptions({}, signal),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["class-members", classId] });
    void queryClient.invalidateQueries({ queryKey: ["class-member-options", classId] });
    void queryClient.invalidateQueries({ queryKey: ["classes"] });
  };

  const add = useMutation({
    mutationFn: () => addClassMembers(classId, Array.from(selected)),
    onSuccess: () => {
      invalidate();
      setSelected(new Set());
      toast({ title: "Đã thêm thành viên vào lớp ✦" });
    },
    onError: (e) => toast({ title: "Chưa thêm được thành viên", description: errorMessage(e), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeClassMember(classId, userId),
    onSuccess: () => {
      invalidate();
      toast({ title: "Đã xoá thành viên khỏi lớp" });
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
      {isLoading ? (
        <LoadingState label="Đang tải thành viên…" />
      ) : !members || members.length === 0 ? (
        <EmptyState title="Chưa có thành viên" description="Thêm sinh viên vào lớp để điểm danh buổi học." />
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
        <Button size="sm" className="mt-3 gap-2" disabled={selected.size === 0 || add.isPending} onClick={() => add.mutate()}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Thêm {selected.size > 0 ? `${selected.size} ` : ""}thành viên
        </Button>
      </div>
    </div>
  );
}

function ClassLessonsTab({ classId }: { classId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [lessonId, setLessonId] = useState<string | null>(null);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["class-lessons", classId],
    queryFn: ({ signal }) => fetchClassLessons(classId, signal),
  });

  const create = useMutation({
    mutationFn: () => createClassLesson(classId, { title: title.trim(), startsAt: startsAt || undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["class-lessons", classId] });
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
      setTitle("");
      setStartsAt("");
      toast({ title: "Đã tạo buổi học ✦" });
    },
    onError: (e) => toast({ title: "Chưa tạo được buổi học", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <LoadingState label="Đang tải buổi học…" />
      ) : !lessons || lessons.length === 0 ? (
        <EmptyState title="Chưa có buổi học nào" description="Tạo buổi học đầu tiên rồi điểm danh ngay trong lớp." />
      ) : (
        <ul className="divide-y-2 divide-dashed divide-ink/10 rounded-xl border-2 border-ink/12 bg-paper">
          {lessons.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setLessonId(lessonId === l.id ? null : l.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-blue-mist/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{l.title}</p>
                  <p className="text-[12px] text-ink-faint">{fmtDateTime(l.startsAt)}</p>
                </div>
                <span className="shrink-0 rounded-full border-2 border-blue/40 bg-blue-mist px-2.5 py-0.5 text-[11px] font-bold text-blue">
                  {l.attendanceCount} điểm danh
                </span>
              </button>
              {lessonId === l.id ? (
                <div className="border-t-2 border-dashed border-ink/10 bg-paper-raised px-4 py-3">
                  <LessonAttendance classId={classId} lessonId={l.id} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Separator />
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-ink">
          <CalendarPlus className="h-4 w-4 text-blue" aria-hidden="true" />
          Tạo buổi học mới
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="lesson-title">Tiêu đề</Label>
            <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Buổi 3 — REST API" className={INPUT_CLS} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lesson-starts">Thời gian bắt đầu</Label>
            <Input id="lesson-starts" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={INPUT_CLS} />
          </div>
          <Button disabled={!title.trim() || create.isPending} onClick={() => create.mutate()} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Thêm
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Điểm danh ───────────────────────── */

function LessonAttendance({ classId, lessonId }: { classId: string; lessonId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: records, isLoading, error, refetch } = useQuery({
    queryKey: ["lesson-attendance", classId, lessonId],
    queryFn: ({ signal }) => fetchLessonAttendance(classId, lessonId, signal),
  });

  const [present, setPresent] = useState<Set<string> | null>(null);
  const checked = present ?? new Set((records ?? []).filter((r) => r.present).map((r) => r.userId));

  const save = useMutation({
    mutationFn: () =>
      saveLessonAttendance(classId, lessonId, {
        records: (records ?? []).map((r) => ({ userId: r.userId, present: checked.has(r.userId) })),
      }),
    onSuccess: () => {
      setPresent(null);
      void queryClient.invalidateQueries({ queryKey: ["lesson-attendance", classId, lessonId] });
      void queryClient.invalidateQueries({ queryKey: ["class-lessons", classId] });
      toast({ title: "Đã lưu điểm danh ✦" });
    },
    onError: (e) => toast({ title: "Chưa lưu được điểm danh", description: errorMessage(e), variant: "destructive" }),
  });

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPresent(next);
  };

  if (isLoading) return <LoadingState label="Đang tải danh sách điểm danh…" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;
  if (!records || records.length === 0)
    return <p className="font-hand text-[15px] text-ink-faint">Lớp chưa có thành viên để điểm danh.</p>;

  return (
    <div className="space-y-3">
      <p className="font-hand text-[15px] text-ink-faint">
        Đánh dấu sinh viên có mặt — đã chọn {checked.size}/{records.length} người.
      </p>
      <div className="grid gap-1 sm:grid-cols-2">
        {records.map((r) => (
          <label
            key={r.userId}
            className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink hover:bg-blue-mist/50"
          >
            <span className="min-w-0 truncate">{r.displayName}</span>
            <input
              type="checkbox"
              checked={checked.has(r.userId)}
              onChange={() => toggle(r.userId)}
              className="h-4.5 w-4.5 shrink-0 accent-[var(--blue)]"
            />
          </label>
        ))}
      </div>
      <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()} className="gap-2">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        {save.isPending ? "Đang lưu…" : "Lưu điểm danh"}
      </Button>
    </div>
  );
}
