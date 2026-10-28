"use client";

import * as React from "react";
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminApi,
  taskApi,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/client/api";
import { taskAdminApi } from "@/lib/client/api-org";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, priorityLabels, taskStatusLabels } from "@/lib/client/labels";
import {
  AnimatedProgressBar,
  Empty,
  PageHeader,
  Pager,
  UserAvatar,
} from "@/components/shared/primitives";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InstructorTaskDetail } from "@/components/views/instructor/task-manage-view";
import {
  AdminDialog,
  BrandButton,
  Field,
  FormInput,
  FormSelect,
  FormTextarea,
  LineButton,
  TableShell,
  TBody,
  Td,
  THead,
  Th,
  Tr,
  useDebounced,
  useToastAction,
} from "./admin-shared";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = (["todo", "doing", "review", "done"] as TaskStatus[]).map((v) => ({
  value: v,
  label: taskStatusLabels[v] ?? v,
}));

const PRIORITY_OPTIONS = (["low", "medium", "high", "critical"] as TaskPriority[]).map((v) => ({
  value: v,
  label: priorityLabels[v] ?? v,
}));

/* ============================ form tạo / sửa ============================ */

interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  storyPoints: string;
  dueDate: string;
  sprintId: string;
  assigneeId: string;
  status: TaskStatus;
}

function emptyTaskForm(): TaskFormState {
  return {
    title: "",
    description: "",
    priority: "medium",
    storyPoints: "3",
    dueDate: "",
    sprintId: "none",
    assigneeId: "none",
    status: "todo",
  };
}

function TaskFormDialog({
  open,
  onOpenChange,
  editing,
  reload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Task | null;
  reload: () => void;
}) {
  const [form, setForm] = React.useState<TaskFormState>(emptyTaskForm);
  const saveAction = useToastAction(() => {
    onOpenChange(false);
    reload();
  });

  // Lựa chọn sprint (suy ra từ các nhiệm vụ hiện có) + người dùng.
  const sprintSource = useResource(
    () => (open ? taskApi.list({ page: 1, pageSize: 200 }) : Promise.resolve(null)),
    [open]
  );
  const userSource = useResource(
    () => (open ? adminApi.users({ page: 1, pageSize: 200 }) : Promise.resolve(null)),
    [open]
  );

  const sprintOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    (sprintSource.data?.data ?? []).forEach((t) => {
      if (t.sprintId && t.sprintCode) map.set(t.sprintId, t.sprintCode);
    });
    return Array.from(map.entries()).map(([value, code]) => ({ value, label: code }));
  }, [sprintSource.data]);

  const userOptions = (userSource.data?.data ?? []).map((u) => ({
    value: u.id,
    label: `${u.displayName} (${u.email})`,
  }));

  React.useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              title: editing.title,
              description: editing.description ?? "",
              priority: editing.priority,
              storyPoints: String(editing.storyPoints ?? 1),
              dueDate: editing.dueDate ? editing.dueDate.slice(0, 10) : "",
              sprintId: editing.sprintId ?? "none",
              assigneeId: editing.assigneeId ?? "none",
              status: editing.status,
            }
          : emptyTaskForm()
      );
    }
  }, [open, editing]);

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tên nhiệm vụ.");
      return;
    }
    saveAction.run(async () => {
      try {
        if (editing) {
          await taskAdminApi.update(editing.id, {
            title: form.title.trim(),
            description: form.description.trim(),
            priority: form.priority,
            storyPoints: Number(form.storyPoints) || 1,
            dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
            assigneeId: form.assigneeId === "none" ? null : form.assigneeId,
            status: form.status,
            expectedVersion: editing.version,
          });
          toast.success(`Đã cập nhật nhiệm vụ ${editing.code}.`);
        } else {
          const created = await taskAdminApi.create({
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            priority: form.priority,
            storyPoints: Number(form.storyPoints) || 1,
            dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
            sprintId: form.sprintId === "none" ? null : form.sprintId,
            assigneeId: form.assigneeId === "none" ? null : form.assigneeId,
          });
          toast.success(`Đã tạo nhiệm vụ ${created.code}.`);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          toast.error("Dữ liệu vừa được cập nhật — đang tải lại.");
          reload();
          onOpenChange(false);
          return;
        }
        throw err;
      }
    });
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={(o) => !saveAction.busy && onOpenChange(o)}
      title={editing ? `Sửa nhiệm vụ ${editing.code}` : "Tạo nhiệm vụ"}
      description={
        editing
          ? `Phiên bản hiện tại v${editing.version} — lưu kèm expectedVersion để tránh ghi đè.`
          : "Nhiệm vụ tạo ở trạng thái Cần làm; bỏ trống sprint sẽ dùng dự án mặc định."
      }
      maxWidth="max-w-2xl"
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={saveAction.busy}>
            Hủy
          </LineButton>
          <BrandButton onClick={submit} disabled={saveAction.busy}>
            {saveAction.busy ? <InlineSpinner className="size-4" /> : <Pencil className="size-4 icon" />}
            {saveAction.busy ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo nhiệm vụ"}
          </BrandButton>
        </>
      }
    >
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        <Field label="Tên nhiệm vụ">
          <FormInput
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="VD: Xây dựng trang giỏ hàng"
          />
        </Field>
        <Field label="Mô tả">
          <FormTextarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Yêu cầu chi tiết, tiêu chí hoàn thành…"
            className="min-h-20"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Độ ưu tiên">
            <FormSelect
              value={form.priority}
              onChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}
              options={PRIORITY_OPTIONS}
              ariaLabel="Chọn độ ưu tiên"
            />
          </Field>
          <Field label="Story points">
            <FormInput
              type="number"
              min={1}
              max={21}
              value={form.storyPoints}
              onChange={(e) => setForm((f) => ({ ...f, storyPoints: e.target.value }))}
              className="font-mono"
            />
          </Field>
          <Field label="Hạn chót">
            <FormInput
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </Field>
          {editing ? (
            <Field label="Trạng thái">
              <FormSelect
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}
                options={STATUS_OPTIONS}
                ariaLabel="Chọn trạng thái"
              />
            </Field>
          ) : (
            <Field label="Sprint" hint={sprintOptions.length === 0 ? "Chưa có sprint nào trong dữ liệu." : undefined}>
              <FormSelect
                value={form.sprintId}
                onChange={(v) => setForm((f) => ({ ...f, sprintId: v }))}
                options={[{ value: "none", label: "Không gán sprint" }, ...sprintOptions]}
                ariaLabel="Chọn sprint"
              />
            </Field>
          )}
          <Field label="Người thực hiện">
            <FormSelect
              value={form.assigneeId}
              onChange={(v) => setForm((f) => ({ ...f, assigneeId: v }))}
              options={[{ value: "none", label: "Chưa gán" }, ...userOptions]}
              ariaLabel="Chọn người thực hiện"
            />
          </Field>
        </div>
      </div>
    </AdminDialog>
  );
}

/* ============================ view chính ============================ */

export function AdminTasks() {
  const [page, setPage] = React.useState(1);
  const [qInput, setQInput] = React.useState("");
  const q = useDebounced(qInput);
  const [status, setStatus] = React.useState("");
  const [priority, setPriority] = React.useState("");

  const list = useResource(
    () =>
      taskApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: q || undefined,
        status: status || undefined,
        priority: priority || undefined,
      }),
    [page, q, status, priority]
  );
  const rows: Task[] = list.data?.data ?? [];
  const meta = list.data?.meta;

  const resetPage = () => setPage(1);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Task | null>(null);
  const [viewingId, setViewingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<Task | null>(null);

  const deleteAction = useToastAction(() => {
    setDeleting(null);
    list.reload();
  });

  const confirmDelete = () => {
    if (!deleting) return;
    deleteAction.run(async () => {
      try {
        await taskAdminApi.remove(deleting.id);
        toast.success(`Đã xóa nhiệm vụ ${deleting.code}.`);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.code === "TASK_HAS_SUBMISSIONS" || err.status === 409) {
            toast.error("Nhiệm vụ đã có bài nộp, không thể xóa.");
            setDeleting(null);
            return;
          }
        }
        throw err;
      }
    });
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Nhiệm vụ"
        description="Quản trị toàn bộ nhiệm vụ trên nền tảng: tạo, sửa, gán người thực hiện và theo dõi tiến độ."
        actions={
          <BrandButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4 icon" /> Tạo nhiệm vụ
          </BrandButton>
        }
      />

      <FilterBar
        hasActive={Boolean(qInput || status || priority)}
        onReset={() => {
          setQInput("");
          setStatus("");
          setPriority("");
          resetPage();
        }}
      >
        <SearchInput
          value={qInput}
          onChange={(v) => {
            setQInput(v);
            resetPage();
          }}
          placeholder="Tìm theo mã hoặc tên nhiệm vụ…"
          className="w-full sm:w-64"
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v);
            resetPage();
          }}
          options={STATUS_OPTIONS}
          placeholder="Trạng thái"
          ariaLabel="Lọc theo trạng thái"
          className="w-40"
        />
        <FilterSelect
          value={priority}
          onChange={(v) => {
            setPriority(v);
            resetPage();
          }}
          options={PRIORITY_OPTIONS}
          placeholder="Ưu tiên"
          ariaLabel="Lọc theo độ ưu tiên"
          className="w-40"
        />
        {meta ? (
          <span className="ml-auto font-mono text-xs text-faint">{meta.total} nhiệm vụ</span>
        ) : null}
      </FilterBar>

      {list.loading ? (
        <LoadingBlock rows={6} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<Plus className="icon" />}
            title="Không có nhiệm vụ nào khớp bộ lọc"
            description="Tạo nhiệm vụ mới hoặc đổi bộ lọc để xem danh sách."
            action={
              <BrandButton
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4 icon" /> Tạo nhiệm vụ
              </BrandButton>
            }
          />
        </div>
      ) : (
        <TableShell minWidth={1020}>
          <THead>
            <tr>
              <Th>STT</Th>
              <Th>Nhiệm vụ</Th>
              <Th>Người thực hiện</Th>
              <Th>Trạng thái</Th>
              <Th>Ưu tiên</Th>
              <Th>Hạn chót</Th>
              <Th>Tiến độ</Th>
              <Th className="text-right">Thao tác</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((task, idx) => (
              <Tr key={task.id}>
                <Td>
                  <span className="font-mono text-xs text-faint">
                    {(meta?.page ?? 1) * PAGE_SIZE - PAGE_SIZE + idx + 1}
                  </span>
                </Td>
                <Td>
                  <p className="font-mono text-[10px] text-brand-bright/80">{task.code}</p>
                  <p className="max-w-72 truncate text-sm font-medium text-ink" title={task.title}>
                    {task.title}
                  </p>
                </Td>
                <Td>
                  {task.assigneeName ? (
                    <span className="flex items-center gap-2">
                      <UserAvatar name={task.assigneeName} size={26} />
                      <span className="max-w-32 truncate text-xs text-dim">{task.assigneeName}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-faint">Chưa gán</span>
                  )}
                </Td>
                <Td>
                  <TaskStatusBadge status={task.status} />
                </Td>
                <Td>
                  <PriorityBadge priority={task.priority} />
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-xs text-dim">{formatDate(task.dueDate)}</span>
                </Td>
                <Td className="w-36">
                  <AnimatedProgressBar value={task.progress} />
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-ink"
                      onClick={() => setViewingId(task.id)}
                      aria-label={`Xem ${task.code}`}
                    >
                      <Eye className="size-4 icon" />
                    </Button>
                    <TaskRowMenu
                      task={task}
                      onEdit={() => {
                        setEditing(task);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(task)}
                    />
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </TableShell>
      )}

      {meta && rows.length > 0 ? (
        <div className="mt-4">
          <Pager page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
        </div>
      ) : null}

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} reload={list.reload} />

      {viewingId ? (
        <InstructorTaskDetail taskId={viewingId} onClose={() => setViewingId(null)} />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !deleteAction.busy && !o && setDeleting(null)}
        title={deleting ? `Xóa nhiệm vụ ${deleting.code}?` : ""}
        description="Nhiệm vụ đã có bài nộp sẽ bị chặn xóa. Hành động này không thể hoàn tác."
        confirmLabel="Xóa nhiệm vụ"
        destructive
        busy={deleteAction.busy}
        onConfirm={confirmDelete}
      />
    </ViewFrame>
  );
}

function TaskRowMenu({
  task,
  onEdit,
  onDelete,
}: {
  task: { code: string };
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-ink"
          aria-label={`Thao tác với ${task.code}`}
        >
          <MoreHorizontal className="size-4 icon" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 border-line bg-panel-2">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4 icon" /> Sửa
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-line" />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4 icon" /> Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
