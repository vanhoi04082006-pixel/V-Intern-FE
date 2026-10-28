"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Plus,
  Rocket,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  sprintApi,
  taskApi,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import { navigate } from "@/lib/client/router";
import { ViewFrame } from "@/components/shared/view";
import {
  Panel,
  PageHeader,
  Empty,
  KeyValue,
  AnimatedProgressBar,
  UserAvatar,
} from "@/components/shared/primitives";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { KanbanBoard, KanbanTaskCard } from "@/components/shared/kanban";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskReview } from "./task-review-dialog";
import { resolveSprintContext } from "./shared";

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
  { value: "critical", label: "Nghiêm trọng" },
];

export function SprintWorkspace({ params }: { params: Record<string, string> }) {
  const sprintId = params.id ?? "";

  const board = useResource(() => sprintApi.board(sprintId), [sprintId]);
  const tasks = useResource(
    () => taskApi.list({ sprintId, page: 1, pageSize: 200 }),
    [sprintId]
  );

  const review = useTaskReview(() => {
    tasks.reload();
    board.reload();
  });

  const [createOpen, setCreateOpen] = React.useState(false);

  const sprint = board.data?.sprint ?? null;
  const overdueCount = board.data?.overdueOpenTaskCount ?? 0;
  const taskList = tasks.data?.data ?? [];

  const handleMove = (taskId: string, toStatus: string) => {
    const task = taskList.find((t) => t.id === taskId);
    taskApi
      .update(taskId, { status: toStatus as TaskStatus, reason: "Giảng viên kéo thẻ trên kanban" })
      .then(() => {
        toast.success(
          `${task?.code ?? "Nhiệm vụ"} chuyển sang "${toStatus === "todo" ? "Cần làm" : toStatus === "doing" ? "Đang làm" : toStatus === "review" ? "Chờ duyệt" : "Hoàn thành"}"`
        );
        tasks.reload();
        board.reload();
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Không cập nhật được trạng thái");
      });
  };

  if (board.loading) {
    return (
      <ViewFrame>
        <LoadingBlock variant="detail" rows={6} />
      </ViewFrame>
    );
  }

  if (board.error || !sprint) {
    return (
      <ViewFrame>
        <ErrorBlock
          error={board.error ?? new Error("Không tìm thấy sprint")}
          onRetry={board.reload}
        />
      </ViewFrame>
    );
  }

  return (
    <ViewFrame>
      <button
        type="button"
        onClick={() => navigate("/instructor/sprints")}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5 icon" /> Về danh sách sprint
      </button>

      <PageHeader
        eyebrow={sprint.code}
        title={sprint.name}
        description={sprint.goal}
        actions={
          <Button className="rounded-lg" onClick={() => setCreateOpen(true)}>
            <Plus className="icon" /> Tạo task
          </Button>
        }
      />

      {/* Header sprint */}
      <Panel className="mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KeyValue label="Trạng thái">
            <TaskStatusBadge status={sprint.status} />
          </KeyValue>
          <KeyValue label="Thời gian">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 icon text-faint" />
              {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
            </span>
          </KeyValue>
          <KeyValue label="Tiến độ">
            <div className="mt-1 flex items-center gap-2">
              <AnimatedProgressBar value={sprint.progress} className="w-32" />
              <span className="font-mono text-xs font-semibold text-ink">{sprint.progress}%</span>
            </div>
          </KeyValue>
          <KeyValue label="Trễ hạn">
            {overdueCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-rose">
                <AlertTriangle className="size-3.5 icon" /> {overdueCount} nhiệm vụ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-brand-bright">
                <Target className="size-3.5 icon" /> Không có
              </span>
            )}
          </KeyValue>
        </div>
      </Panel>

      {/* Kanban */}
      {tasks.loading ? (
        <LoadingBlock variant="cards" rows={4} />
      ) : tasks.error ? (
        <ErrorBlock error={tasks.error} onRetry={tasks.reload} />
      ) : taskList.length === 0 ? (
        <Panel>
          <Empty
            icon={<Rocket />}
            title="Sprint chưa có nhiệm vụ nào"
            description="Tạo nhiệm vụ đầu tiên cho sprint này."
            action={
              <Button className="rounded-lg" onClick={() => setCreateOpen(true)}>
                <Plus className="icon" /> Tạo task
              </Button>
            }
          />
        </Panel>
      ) : (
        <KanbanBoard
          items={taskList}
          onMove={handleMove}
          onOpen={(t) => review.openReview(t)}
          renderCard={(t, dragging) => (
            <KanbanTaskCard
              code={t.code}
              title={t.title}
              dragging={dragging}
              meta={
                <span className="flex items-center gap-1.5">
                  {t.assigneeName ? (
                    <>
                      <UserAvatar name={t.assigneeName} size={16} />
                      <span className="truncate">{t.assigneeName}</span>
                    </>
                  ) : (
                    <span className="text-faint">Chưa gán</span>
                  )}
                  <span className="text-faint">· {t.storyPoints} SP</span>
                  {t.dueDate ? (
                    <span className="text-faint">· {formatDate(t.dueDate)}</span>
                  ) : null}
                </span>
              }
              footer={
                <div className="flex items-center justify-between">
                  <PriorityBadge priority={t.priority} />
                  {t.progress > 0 ? (
                    <span className="font-mono text-[10px] text-dim">{t.progress}%</span>
                  ) : null}
                </div>
              }
            />
          )}
        />
      )}

      {review.dialog}

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sprintId={sprintId}
        tasks={taskList}
        onCreated={() => {
          tasks.reload();
          board.reload();
        }}
      />
    </ViewFrame>
  );
}

/* ==================== Dialog tạo task ==================== */

function CreateTaskDialog({
  open,
  onOpenChange,
  sprintId,
  tasks,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintId: string;
  tasks: Task[];
  onCreated: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState("none");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [storyPoints, setStoryPoints] = React.useState("3");
  const [dueDate, setDueDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setAssigneeId("none");
      setPriority("medium");
      setStoryPoints("3");
      setDueDate("");
    }
  }, [open]);

  // Thành viên từ dữ liệu board (unique assignee)
  const assignees = React.useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      if (t.assigneeId && t.assigneeName) map.set(t.assigneeId, t.assigneeName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }));
  }, [tasks]);

  const projectId = tasks[0]?.projectId ?? null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên nhiệm vụ");
      return;
    }
    let resolvedProjectId: string | null = projectId;
    if (!resolvedProjectId) {
      const ctx = await resolveSprintContext(sprintId);
      resolvedProjectId = ctx?.projectId ?? null;
    }
    if (!resolvedProjectId) {
      toast.error("Không xác định được dự án của sprint");
      return;
    }
    setSubmitting(true);
    try {
      const created = await taskApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId: resolvedProjectId,
        sprintId,
        assigneeId: assigneeId === "none" ? null : assigneeId,
        priority,
        storyPoints: Number(storyPoints) || 1,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      toast.success(`Đã tạo nhiệm vụ ${created.code}`);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không tạo được nhiệm vụ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-2xl border-line bg-panel p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">
            Tạo nhiệm vụ mới
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-dim">
            Nhiệm vụ được tạo trong sprint này với trạng thái Cần làm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-medium text-dim">
              Tên nhiệm vụ <span className="text-rose">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Xây dựng trang giỏ hàng"
              className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-medium text-dim">
              Mô tả
            </Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Yêu cầu chi tiết, tiêu chí hoàn thành…"
              className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-dim">Người thực hiện</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="h-10 w-full rounded-lg border-line bg-deep text-sm text-ink">
                  <SelectValue placeholder="Chưa gán" />
                </SelectTrigger>
                <SelectContent className="border-line bg-panel-2 text-ink">
                  <SelectItem value="none">Chưa gán</SelectItem>
                  {assignees.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-dim">Độ ưu tiên</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="h-10 w-full rounded-lg border-line bg-deep text-sm text-ink">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-line bg-panel-2 text-ink">
                  {priorityOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-sp" className="text-xs font-medium text-dim">
                Story points
              </Label>
              <Input
                id="task-sp"
                type="number"
                min={1}
                max={21}
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-due" className="text-xs font-medium text-dim">
                Hạn chót
              </Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-line bg-deep/40 px-6 py-4">
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? <InlineSpinner /> : <Plus className="icon" />}
            Tạo nhiệm vụ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
