"use client";

/**
 * Quản lý nhiệm vụ (giảng viên/admin) — giao việc, theo dõi, chấm bài nộp
 * theo rubric 6 tiêu chí, review AI và thảo luận.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, MessageSquarePlus, Plus, Search, Send, Sparkles, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import { hasPermission } from "@/lib/auth/session";
import { fetchMemberOptions, fetchProjects } from "@/lib/api/academic";
import {
  addTaskComment,
  createTask,
  deleteTask,
  fetchCodeReviews,
  fetchTask,
  fetchTaskComments,
  fetchTaskHistory,
  fetchTaskSubmissions,
  fetchTasks,
  rerunCodeReview,
  reviewSubmission,
  updateTask,
  type ReviewRubric,
  type Submission,
  type TaskItem,
} from "@/lib/api/tasks";
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

const STATUS_OPTIONS = [
  { value: "todo", label: "Cần làm" },
  { value: "doing", label: "Đang làm" },
  { value: "review", label: "Chờ duyệt" },
  { value: "done", label: "Xong" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
  { value: "urgent", label: "Khẩn cấp" },
];

const RUBRIC_FIELDS: { key: keyof ReviewRubric; label: string }[] = [
  { key: "functional", label: "Chức năng" },
  { key: "quality", label: "Chất lượng code" },
  { key: "testing", label: "Kiểm thử" },
  { key: "errors", label: "Xử lý lỗi" },
  { key: "security", label: "Bảo mật" },
  { key: "dod", label: "Định nghĩa hoàn thành" },
];

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

export function TasksView() {
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tasks", search, projectId, status, priority, page],
    queryFn: ({ signal }) =>
      fetchTasks(
        {
          search: search.trim() || undefined,
          projectId: projectId === "all" ? undefined : projectId,
          status: status === "all" ? undefined : status,
          priority: priority === "all" ? undefined : priority,
          page,
          pageSize: 20,
        },
        signal,
      ),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", "task-filter"],
    queryFn: ({ signal }) => fetchProjects({ page: 1 }, signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhiệm vụ"
        description="Giao việc cho sinh viên, theo dõi tiến độ và chấm bài nộp theo rubric 6 tiêu chí."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo nhiệm vụ
          </Button>
        }
      />

      <SectionCard>
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tiêu đề nhiệm vụ…"
              className={`${INPUT_CLS} pl-10`}
            />
          </div>
          <Select
            value={projectId}
            onValueChange={(v) => {
              setProjectId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${INPUT_CLS} w-full`}>
              <SelectValue placeholder="Đồ án" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi đồ án</SelectItem>
              {(projects?.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
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
                <SelectItem value="all">Trạng thái</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priority}
              onValueChange={(v) => {
                setPriority(v);
                setPage(1);
              }}
            >
              <SelectTrigger className={`${INPUT_CLS} w-full`}>
                <SelectValue placeholder="Ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ưu tiên</SelectItem>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <LoadingState label="Đang tải danh sách nhiệm vụ…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="Chưa có nhiệm vụ nào"
              description="Tạo nhiệm vụ đầu tiên để giao việc cho sinh viên trong đồ án."
            />
          ) : (
            <>
              <ListTable
                rows={data.data}
                rowKey={(t) => t.id}
                onRowClick={(t) => setSelectedId(t.id)}
                emptyTitle="Không tìm thấy nhiệm vụ phù hợp"
                emptyDescription="Thử đổi bộ lọc hoặc từ khoá."
                columns={[
                  { key: "title", header: "Tiêu đề", render: (t) => <span className="font-bold">{t.title}</span> },
                  { key: "assignee", header: "Giao cho", render: (t) => t.assigneeName ?? "—" },
                  { key: "status", header: "Trạng thái", render: (t) => <StatusBadge status={t.status} /> },
                  {
                    key: "priority",
                    header: "Ưu tiên",
                    render: (t) => (t.priority ? <Chip tone={t.priority === "urgent" || t.priority === "high" ? "ink" : "blue"}>{PRIORITY_OPTIONS.find((p) => p.value === t.priority)?.label ?? t.priority}</Chip> : "—"),
                  },
                  { key: "sp", header: "⚡", render: (t) => (t.storyPoints != null ? `${t.storyPoints}` : "—") },
                  {
                    key: "due",
                    header: "Hạn",
                    render: (t) => (
                      <span className={t.status !== "done" && isOverdue(t.dueDate) ? "font-bold text-rose-600" : ""}>
                        {fmtDate(t.dueDate)}
                      </span>
                    ),
                  },
                ]}
              />
              <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </SectionCard>

      <CreateTaskDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <TaskDetailDialog taskId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

/* ───────────────────────── Tạo nhiệm vụ ───────────────────────── */

function CreateTaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [storyPoints, setStoryPoints] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: projects } = useQuery({
    queryKey: ["projects", "task-form"],
    queryFn: ({ signal }) => fetchProjects({ page: 1 }, signal),
    enabled: open,
  });

  const { data: members } = useQuery({
    queryKey: ["member-options", "task-form", projectId],
    queryFn: ({ signal }) => fetchMemberOptions({ projectId: projectId || undefined }, signal),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId,
        sprintId: sprintId.trim() || undefined,
        assigneeId: assigneeId || undefined,
        priority,
        storyPoints: storyPoints ? Number(storyPoints) : undefined,
        dueDate: dueDate || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Đã tạo nhiệm vụ ✦", description: title });
      setTitle("");
      setDescription("");
      setProjectId("");
      setSprintId("");
      setAssigneeId("");
      setPriority("medium");
      setStoryPoints("");
      setDueDate("");
      onClose();
    },
    onError: (e) => toast({ title: "Chưa tạo được nhiệm vụ", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo nhiệm vụ mới</DialogTitle>
          <DialogDescription>Mô tả rõ kết quả mong muốn — sinh viên sẽ nộp bài bằng Pull Request.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="task-title">Tiêu đề</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Xây API danh sách sản phẩm" className={INPUT_CLS} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="task-desc">Mô tả</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Yêu cầu chi tiết, tiêu chí nghiệm thu…"
              className="min-h-[90px] rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="grid gap-1.5">
              <Label htmlFor="task-sprint">Mã sprint (tuỳ chọn)</Label>
              <Input id="task-sprint" value={sprintId} onChange={(e) => setSprintId(e.target.value)} placeholder="Dán UUID sprint nếu có" className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Giao cho</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className={`${INPUT_CLS} w-full`}>
                  <SelectValue placeholder="Chọn sinh viên" />
                </SelectTrigger>
                <SelectContent>
                  {(members ?? []).map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Ưu tiên</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className={`${INPUT_CLS} w-full`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="task-sp">Story points</Label>
              <Input id="task-sp" type="number" min={0} value={storyPoints} onChange={(e) => setStoryPoints(e.target.value)} placeholder="VD: 3" className={INPUT_CLS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-due">Hạn chót</Label>
              <Input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={create.isPending || !title.trim() || !projectId} onClick={() => create.mutate()}>
            {create.isPending ? "Đang tạo…" : "Tạo nhiệm vụ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Chi tiết nhiệm vụ ───────────────────────── */

function TaskDetailDialog({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const open = !!taskId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const canManage = hasPermission(user, "tasks.manage");
  const [tab, setTab] = useState("details");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: detail, isLoading: loadingDetail, error: detailError, refetch: refetchDetail } = useQuery({
    queryKey: ["task-detail", taskId],
    queryFn: ({ signal }) => fetchTask(taskId!, signal),
    enabled: open,
  });

  const update = useMutation({
    mutationFn: (payload: Parameters<typeof updateTask>[1]) => updateTask(taskId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["task-detail", taskId] });
      toast({ title: "Đã cập nhật nhiệm vụ ✦" });
    },
    onError: (e) => toast({ title: "Chưa cập nhật được", description: errorMessage(e), variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: () => deleteTask(taskId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Đã xoá nhiệm vụ" });
      onClose();
    },
    onError: (e) => toast({ title: "Chưa xoá được nhiệm vụ", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
            {detail ? detail.title : "Chi tiết nhiệm vụ"}
            {detail ? <StatusBadge status={detail.status} /> : null}
          </DialogTitle>
          <DialogDescription>
            {detail ? `Giao cho ${detail.assigneeName ?? "chưa gán"} · tạo lúc ${fmtDateTime(detail.createdAt)}` : "…"}
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <LoadingState label="Đang tải nhiệm vụ…" />
        ) : detailError ? (
          <ErrorState message={errorMessage(detailError)} onRetry={() => void refetchDetail()} />
        ) : !detail ? null : (
          <div className="space-y-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex h-11 w-full justify-start overflow-x-auto rounded-xl border-2 border-ink/12 bg-paper p-1">
                <TabsTrigger value="details" className="rounded-lg px-3 text-[13px] font-bold">Chi tiết</TabsTrigger>
                <TabsTrigger value="submissions" className="rounded-lg px-3 text-[13px] font-bold">Bài nộp</TabsTrigger>
                <TabsTrigger value="comments" className="rounded-lg px-3 text-[13px] font-bold">Thảo luận</TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg px-3 text-[13px] font-bold">Lịch sử</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <TaskDetailsTab task={detail} onUpdate={(payload) => update.mutate(payload)} updating={update.isPending} />
              </TabsContent>
              <TabsContent value="submissions" className="mt-4">
                <SubmissionsTab taskId={detail.id} taskVersion={detail.version} />
              </TabsContent>
              <TabsContent value="comments" className="mt-4">
                <CommentsTab taskId={detail.id} />
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <HistoryTab taskId={detail.id} />
              </TabsContent>
            </Tabs>

            {canManage ? (
              <div className="flex justify-end border-t-2 border-dashed border-ink/10 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() => setConfirmDelete(true)}
                  className="gap-2 border-rose-300 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Xoá nhiệm vụ
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá nhiệm vụ này?</AlertDialogTitle>
            <AlertDialogDescription>
              Nhiệm vụ cùng bài nộp và thảo luận sẽ bị xoá vĩnh viễn. Hãy chắc chắn bạn muốn tiếp tục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Giữ lại</AlertDialogCancel>
            <AlertDialogAction
              className="gap-2 border-2 border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
              onClick={() => {
                setConfirmDelete(false);
                remove.mutate();
              }}
            >
              Xoá vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

/* ── Tab: chi tiết + sửa nhanh ── */

function TaskDetailsTab({
  task,
  onUpdate,
  updating,
}: {
  task: TaskItem;
  onUpdate: (payload: Parameters<typeof updateTask>[1]) => void;
  updating: boolean;
}) {
  const [assigneeId, setAssigneeId] = useState<string>(task.assigneeId ?? "");

  const { data: members } = useQuery({
    queryKey: ["member-options", "reassign", task.projectId],
    queryFn: ({ signal }) => fetchMemberOptions({ projectId: task.projectId ?? undefined }, signal),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-paper p-4 sm:grid-cols-2">
        <KeyVal label="Trạng thái">
          <Select value={task.status} onValueChange={(v) => v !== task.status && onUpdate({ status: v, expectedVersion: task.version })}>
            <SelectTrigger className="h-9 w-[170px] rounded-lg border-2 border-ink/20 bg-raised px-3 text-[13px] font-bold" disabled={updating}>
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
        <KeyVal label="Ưu tiên">
          {task.priority ? (PRIORITY_OPTIONS.find((p) => p.value === task.priority)?.label ?? task.priority) : "—"}
        </KeyVal>
        <KeyVal label="Story points">{task.storyPoints ?? "—"}</KeyVal>
        <KeyVal label="Hạn chót">
          <span className={task.status !== "done" && isOverdue(task.dueDate) ? "font-bold text-rose-600" : ""}>
            {fmtDate(task.dueDate)}
            {task.status !== "done" && isOverdue(task.dueDate) ? " · quá hạn" : ""}
          </span>
        </KeyVal>
        <KeyVal label="Đồ án">{task.projectId ? task.projectId : "—"}</KeyVal>
        <KeyVal label="Sprint">{task.sprintId ? task.sprintId : "—"}</KeyVal>
      </div>

      {task.description ? (
        <p className="whitespace-pre-line rounded-2xl border-2 border-ink/10 bg-paper p-4 text-[13px] leading-relaxed text-ink-soft">
          {task.description}
        </p>
      ) : (
        <p className="font-hand text-[15px] text-ink-faint">Nhiệm vụ này chưa có mô tả chi tiết.</p>
      )}

      <div className="rounded-2xl border-2 border-ink/12 bg-paper p-4">
        <p className="mb-2 text-sm font-extrabold text-ink">Giao lại cho sinh viên khác</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger className="h-10 w-[240px] rounded-lg border-2 border-ink/20 bg-raised px-3 text-[13px] font-bold">
              <SelectValue placeholder="Chọn sinh viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Chưa gán —</SelectItem>
              {(members ?? []).map((m) => (
                <SelectItem key={m.userId} value={m.userId}>
                  {m.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={updating || assigneeId === (task.assigneeId ?? "")}
            onClick={() => onUpdate({ assigneeId: assigneeId === "none" ? null : assigneeId, expectedVersion: task.version })}
            className="gap-2"
          >
            Cập nhật
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Tab: bài nộp ── */

function SubmissionsTab({ taskId, taskVersion }: { taskId: string; taskVersion: number }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["task-submissions", taskId],
    queryFn: ({ signal }) => fetchTaskSubmissions(taskId, signal),
  });

  if (isLoading) return <LoadingState label="Đang tải bài nộp…" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;
  if (!data || data.length === 0)
    return (
      <EmptyState
        title="Chưa có bài nộp nào"
        description="Sinh viên nộp bài bằng Pull Request — bài sẽ xuất hiện tại đây để bạn chấm."
      />
    );

  return (
    <div className="space-y-4">
      {data.map((s) => (
        <SubmissionCard key={s.id} submission={s} taskVersion={taskVersion} />
      ))}
    </div>
  );
}

function SubmissionCard({ submission, taskVersion }: { submission: Submission; taskVersion: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [grading, setGrading] = useState(false);
  const [rubric, setRubric] = useState<Record<keyof ReviewRubric, string>>({
    functional: "",
    quality: "",
    testing: "",
    errors: "",
    security: "",
    dod: "",
  });
  const [feedback, setFeedback] = useState("");

  const { data: codeReviews } = useQuery({
    queryKey: ["code-reviews", submission.id],
    queryFn: ({ signal }) => fetchCodeReviews(submission.id, signal),
  });

  const review = useMutation({
    mutationFn: (parsed: ReviewRubric) =>
      reviewSubmission(submission.id, { rubric: parsed, feedback: feedback.trim(), taskVersion }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task-submissions", submission.taskId] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setGrading(false);
      toast({ title: "Đã chấm bài ✦" });
    },
    onError: (e) => toast({ title: "Chưa chấm được bài", description: errorMessage(e), variant: "destructive" }),
  });

  const submitReview = () => {
    const parsed = {} as ReviewRubric;
    for (const f of RUBRIC_FIELDS) {
      const v = Number(rubric[f.key]);
      if (!Number.isFinite(v) || v < 0 || v > 10) {
        toast({
          title: "Chưa chấm đủ rubric",
          description: "Vui lòng nhập đủ 6 tiêu chí, mỗi tiêu chí từ 0 đến 10 điểm.",
          variant: "destructive",
        });
        return;
      }
      parsed[f.key] = v;
    }
    review.mutate(parsed);
  };

  const rerun = useMutation({
    mutationFn: () => rerunCodeReview(submission.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["code-reviews", submission.id] });
      toast({ title: "Đã yêu cầu chạy lại review AI ✦", description: "Kết quả sẽ xuất hiện sau ít phút." });
    },
    onError: (e) => toast({ title: "Chưa chạy lại được", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <article className="rounded-2xl border-2 border-ink/12 bg-paper p-4 shadow-[3px_3px_0_0_rgba(23,23,28,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-ink">{submission.internName ?? "Sinh viên"}</p>
            <StatusBadge status={submission.status} />
            {submission.score != null ? <Chip tone="green">{submission.score.toFixed(1)} điểm</Chip> : null}
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">Nộp lúc {fmtDateTime(submission.submittedAt)}</p>
          {submission.prUrl ? (
            <a
              href={submission.prUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-bold text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
            >
              Xem Pull Request ↗
            </a>
          ) : null}
          {submission.summary ? (
            <p className="mt-2 whitespace-pre-line rounded-xl border-2 border-dashed border-ink/12 bg-raised p-3 text-[13px] leading-relaxed text-ink-soft">
              {submission.summary}
            </p>
          ) : null}
          {submission.feedback ? (
            <p className="mt-2 rounded-xl border-2 border-emerald-300/60 bg-emerald-50/60 p-3 text-[13px] leading-relaxed text-ink-soft">
              <span className="font-extrabold text-emerald-700">Phản hồi của bạn: </span>
              {submission.feedback}
            </p>
          ) : null}
        </div>
        <Button size="sm" variant={grading ? "outline" : "default"} onClick={() => setGrading((v) => !v)} className="shrink-0 gap-2">
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          {grading ? "Đóng mẫu chấm" : "Chấm bài"}
        </Button>
      </div>

      {grading ? (
        <div className="mt-4 space-y-3 rounded-xl border-2 border-blue/30 bg-blue-mist/40 p-4">
          <p className="font-hand text-[15px] text-ink-faint">Chấm từng tiêu chí từ 0 đến 10 điểm.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {RUBRIC_FIELDS.map((f) => (
              <div key={f.key} className="grid gap-1.5">
                <Label htmlFor={`rubric-${submission.id}-${f.key}`} className="text-[12px] font-bold text-ink-soft">
                  {f.label}
                </Label>
                <Input
                  id={`rubric-${submission.id}-${f.key}`}
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={rubric[f.key]}
                  onChange={(e) => setRubric((r) => ({ ...r, [f.key]: e.target.value }))}
                  placeholder="0–10"
                  className="h-10 rounded-lg border-2 border-ink/20 bg-raised px-3 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
                />
              </div>
            ))}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`feedback-${submission.id}`}>Nhận xét chung</Label>
            <Textarea
              id={`feedback-${submission.id}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Điểm tốt, điểm cần cải thiện, hướng tiếp theo…"
              className="min-h-[80px] rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
            />
          </div>
          <input type="hidden" value={taskVersion} readOnly />
          <Button size="sm" disabled={review.isPending} onClick={submitReview} className="gap-2">
            {review.isPending ? "Đang gửi…" : "Gửi kết quả chấm"}
          </Button>
        </div>
      ) : null}

      {/* Code review AI */}
      <div className="mt-4 border-t-2 border-dashed border-ink/10 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
            <Bot className="h-4 w-4 text-blue" aria-hidden="true" />
            Review AI ({codeReviews?.length ?? 0})
          </p>
          <Button variant="outline" size="sm" disabled={rerun.isPending} onClick={() => rerun.mutate()} className="gap-2">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {rerun.isPending ? "Đang chạy…" : "Chạy lại review AI"}
          </Button>
        </div>
        {!codeReviews || codeReviews.length === 0 ? (
          <p className="mt-2 font-hand text-[15px] text-ink-faint">Chưa có kết quả review AI cho bài nộp này.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {codeReviews.map((cr) => (
              <div key={cr.id} className="rounded-xl border-2 border-ink/12 bg-raised p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={cr.status} />
                  {cr.score != null ? <Chip tone="blue">{cr.score.toFixed(1)}</Chip> : null}
                  <span className="text-[11px] text-ink-faint">{fmtDateTime(cr.createdAt)}</span>
                </div>
                {cr.findings.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] leading-relaxed text-ink-soft">
                    {cr.findings.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-[13px] text-ink-faint">Không có phát hiện nào.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/* ── Tab: thảo luận ── */

function CommentsTab({ taskId }: { taskId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: ({ signal }) => fetchTaskComments(taskId, signal),
  });

  const add = useMutation({
    mutationFn: () => addTaskComment(taskId, content.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
      setContent("");
      toast({ title: "Đã gửi bình luận ✦" });
    },
    onError: (e) => toast({ title: "Chưa gửi được", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <LoadingState label="Đang tải thảo luận…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Chưa có bình luận" description="Trao đổi với sinh viên ngay trong nhiệm vụ để mọi thứ minh bạch." />
      ) : (
        <ul className="space-y-2">
          {data.map((c) => (
            <li key={c.id} className="rounded-xl border-2 border-ink/12 bg-paper p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[13px] font-extrabold text-ink">{c.authorName}</p>
                <p className="font-mono text-[11px] text-ink-faint">{fmtDateTime(c.createdAt)}</p>
              </div>
              <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border-2 border-dashed border-ink/15 bg-paper p-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết bình luận…"
          className="min-h-[70px] rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
        />
        <Button
          size="sm"
          className="mt-2 gap-2"
          disabled={!content.trim() || add.isPending}
          onClick={() => add.mutate()}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
          {add.isPending ? "Đang gửi…" : "Gửi bình luận"}
        </Button>
      </div>
    </div>
  );
}

/* ── Tab: lịch sử ── */

function HistoryTab({ taskId }: { taskId: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["task-history", taskId],
    queryFn: ({ signal }) => fetchTaskHistory(taskId, signal),
  });

  const statusLabel = (s: string | null) => (s ? STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s : "—");

  if (isLoading) return <LoadingState label="Đang tải lịch sử…" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;
  if (!data || data.length === 0)
    return <EmptyState title="Chưa có lịch sử" description="Mỗi thay đổi trạng thái của nhiệm vụ sẽ được ghi lại." />;

  return (
    <ol className="relative space-y-3 border-l-2 border-dashed border-ink/20 pl-5">
      {data.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-blue bg-raised" aria-hidden="true" />
          <p className="text-sm font-bold text-ink">
            {statusLabel(h.fromStatus)} → {statusLabel(h.toStatus)}
          </p>
          <p className="text-[12px] text-ink-faint">
            {h.actorName ?? "hệ thống"} · {fmtDateTime(h.createdAt)}
          </p>
          {h.note ? <p className="mt-0.5 text-[13px] text-ink-soft">{h.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
