"use client";

/**
 * Sprint — danh sách sprint theo đồ án, chi tiết board 4 cột,
 * thống kê hoàn thành, biểu đồ burndown (SVG inline) và chuyển trạng thái.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Plus, Search, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createSprint,
  fetchProjects,
  fetchSprintBoard,
  fetchSprintBurndown,
  fetchSprintCompletion,
  fetchSprints,
  transitionSprint,
  type SprintSummary,
} from "@/lib/api/academic";
import { errorMessage } from "@/lib/api/transport";
import { fmtDate } from "@/lib/api/client";
import {
  Chip,
  EmptyState,
  ErrorState,
  KeyVal,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  ProgressBar,
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

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const PRIORITY_LABELS: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  urgent: "Khẩn cấp",
};

const BOARD_COLUMNS: { status: string; label: string }[] = [
  { status: "todo", label: "Cần làm" },
  { status: "doing", label: "Đang làm" },
  { status: "review", label: "Chờ duyệt" },
  { status: "done", label: "Xong" },
];

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

export function SprintsView() {
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<SprintSummary | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sprints", search, projectId, status, page],
    queryFn: ({ signal }) =>
      fetchSprints(
        {
          search: search.trim() || undefined,
          projectId: projectId === "all" ? undefined : projectId,
          status: status === "all" ? undefined : status,
          page,
        },
        signal,
      ),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", "sprint-filter"],
    queryFn: ({ signal }) => fetchProjects({ page: 1 }, signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sprint"
        description="Kỳ làm việc ngắn của từng đồ án — theo dõi board, tiến độ hoàn thành và burndown."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo sprint
          </Button>
        }
      />

      <SectionCard>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm sprint…"
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
              <SelectItem value="planned">Đã lên lịch</SelectItem>
              <SelectItem value="active">Đang chạy</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <LoadingState label="Đang tải danh sách sprint…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="Chưa có sprint nào"
              description="Tạo sprint cho đồ án, hoặc dùng “Lập kế hoạch AI” để sinh bản nháp tự động."
            />
          ) : (
            <>
              <ListTable
                rows={data.data}
                rowKey={(s) => s.id}
                onRowClick={(s) => setSelected(s)}
                emptyTitle="Không tìm thấy sprint phù hợp"
                emptyDescription="Thử đổi bộ lọc đồ án hoặc trạng thái."
                columns={[
                  { key: "code", header: "Mã", render: (s) => <span className="font-mono text-[12px] font-bold text-ink-soft">{s.code}</span> },
                  { key: "name", header: "Tên", render: (s) => <span className="font-bold">{s.name}</span> },
                  { key: "status", header: "Trạng thái", render: (s) => <StatusBadge status={s.status} /> },
                  { key: "start", header: "Bắt đầu", render: (s) => fmtDate(s.startDate) },
                  { key: "end", header: "Kết thúc", render: (s) => fmtDate(s.endDate) },
                ]}
              />
              <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </SectionCard>

      <CreateSprintDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <SprintDetailDialog sprint={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/* ───────────────────────── Tạo sprint ───────────────────────── */

function CreateSprintDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [projectId, setProjectId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: projects } = useQuery({
    queryKey: ["projects", "sprint-form"],
    queryFn: ({ signal }) => fetchProjects({ page: 1 }, signal),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      createSprint({
        code: code.trim(),
        name: name.trim(),
        goal: goal.trim() || undefined,
        projectId: projectId || undefined,
        sessionId: sessionId.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sprints"] });
      toast({ title: "Đã tạo sprint ✦", description: name });
      setCode("");
      setName("");
      setGoal("");
      setProjectId("");
      setSessionId("");
      setStartDate("");
      setEndDate("");
      onClose();
    },
    onError: (e) => toast({ title: "Chưa tạo được sprint", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo sprint mới</DialogTitle>
          <DialogDescription>Mỗi sprint nên có mục tiêu rõ ràng và khối lượng vừa sức trong 1–2 tuần.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="sprint-code">Mã sprint</Label>
              <Input id="sprint-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: SPR-01" className={INPUT_CLS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sprint-name">Tên sprint</Label>
              <Input id="sprint-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Sprint nền tảng" className={INPUT_CLS} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sprint-goal">Mục tiêu</Label>
            <Textarea
              id="sprint-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Kết quả mong muốn của sprint…"
              className="min-h-[70px] rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
            />
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
          <div className="grid gap-1.5">
            <Label htmlFor="sprint-session">Mã phiên thực tập (tuỳ chọn)</Label>
            <Input id="sprint-session" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="Dán UUID phiên nếu cần" className={INPUT_CLS} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="sprint-start">Ngày bắt đầu</Label>
              <Input id="sprint-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT_CLS} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sprint-end">Ngày kết thúc</Label>
              <Input id="sprint-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={INPUT_CLS} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button disabled={create.isPending || !code.trim() || !name.trim()} onClick={() => create.mutate()}>
            {create.isPending ? "Đang tạo…" : "Tạo sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Chi tiết sprint ───────────────────────── */

function SprintDetailDialog({ sprint, onClose }: { sprint: SprintSummary | null; onClose: () => void }) {
  const open = !!sprint;
  const sprintId = sprint?.id ?? null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmComplete, setConfirmComplete] = useState(false);

  const { data: board, isLoading, error, refetch } = useQuery({
    queryKey: ["sprint-board", sprintId],
    queryFn: ({ signal }) => fetchSprintBoard(sprintId!, signal),
    enabled: open,
  });

  const { data: completion } = useQuery({
    queryKey: ["sprint-completion", sprintId],
    queryFn: ({ signal }) => fetchSprintCompletion(sprintId!, signal),
    enabled: open,
  });

  const { data: burndown } = useQuery({
    queryKey: ["sprint-burndown", sprintId],
    queryFn: ({ signal }) => fetchSprintBurndown(sprintId!, signal),
    enabled: open,
  });

  const transition = useMutation({
    mutationFn: (status: string) => transitionSprint(sprintId!, status),
    onSuccess: (_s, status) => {
      void queryClient.invalidateQueries({ queryKey: ["sprints"] });
      toast({ title: status === "active" ? "Sprint đã kích hoạt ✦" : "Sprint đã hoàn thành ✦" });
    },
    onError: (e) => toast({ title: "Chưa chuyển được trạng thái", description: errorMessage(e), variant: "destructive" }),
  });

  const currentStatus = sprint?.status ?? "planned";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {sprint?.name ?? "Chi tiết sprint"}
            <StatusBadge status={currentStatus} />
          </DialogTitle>
          <DialogDescription>
            {sprint ? `Mã ${sprint.code} · ${fmtDate(sprint.startDate)} → ${fmtDate(sprint.endDate)}` : "…"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState label="Đang tải bảng sprint…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !board ? null : (
          <div className="space-y-5">
            {sprint?.goal ? (
              <p className="rounded-2xl border-2 border-blue/30 bg-blue-mist/50 p-4 text-[13px] leading-relaxed text-ink">
                <span className="font-extrabold">Mục tiêu: </span>
                {sprint.goal}
              </p>
            ) : null}
            {completion ? (
              <p className="font-hand text-[15px] text-ink-faint">
                {completion.doneTasks}/{completion.totalTasks} nhiệm vụ hoàn thành · {completion.doneStoryPoints}/
                {completion.totalStoryPoints} điểm chuyện · {completion.openTasks} còn mở
              </p>
            ) : null}
            {/* Thao tác trạng thái */}
            <div className="flex flex-wrap items-center gap-2">
              {currentStatus === "planned" ? (
                <Button size="sm" disabled={transition.isPending} onClick={() => transition.mutate("active")} className="gap-2">
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  Kích hoạt sprint
                </Button>
              ) : null}
              {currentStatus === "active" ? (
                <Button size="sm" variant="outline" disabled={transition.isPending} onClick={() => setConfirmComplete(true)} className="gap-2">
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                  Hoàn thành sprint
                </Button>
              ) : null}
              {currentStatus === "completed" ? (
                <p className="font-hand text-[15px] text-ink-faint">Sprint đã kết thúc — chỉ xem lại.</p>
              ) : null}
            </div>

            {/* Thống kê hoàn thành */}
            {completion ? (
              <div className="grid gap-4 rounded-2xl border-2 border-dashed border-ink/15 bg-paper p-4 sm:grid-cols-2">
                <div>
                  <ProgressBar
                    label={`Nhiệm vụ: ${completion.doneTasks}/${completion.totalTasks}`}
                    value={completion.doneTasks}
                    max={Math.max(completion.totalTasks, 1)}
                  />
                </div>
                <div>
                  <ProgressBar
                    label={`Story points: ${completion.doneStoryPoints}/${completion.totalStoryPoints}`}
                    value={completion.doneStoryPoints}
                    max={Math.max(completion.totalStoryPoints, 1)}
                  />
                </div>
                <KeyVal label="Đang mở">{completion.openTasks} nhiệm vụ</KeyVal>
                <KeyVal label="Tổng điểm chuyện">{completion.totalStoryPoints}</KeyVal>
              </div>
            ) : null}

            {/* Burndown */}
            <div className="rounded-2xl border-2 border-ink/12 bg-paper p-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-ink">
                <TrendingDown className="h-4 w-4 text-blue" aria-hidden="true" />
                Burndown — điểm chuyện còn lại
              </p>
              <BurndownChart points={burndown?.points ?? []} />
            </div>

            {/* Board 4 cột */}
            <div className="grid gap-3 md:grid-cols-4">
              {BOARD_COLUMNS.map((col) => {
                const tasks = board.tasks.filter((t) => t.status === col.status);
                return (
                  <div key={col.status} className="rounded-2xl border-2 border-ink/12 bg-paper p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[12px] font-extrabold uppercase tracking-wide text-ink-soft">{col.label}</p>
                      <span className="rounded-full border-2 border-ink/15 bg-raised px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                        {tasks.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <p className="rounded-xl border-2 border-dashed border-ink/10 px-2 py-3 text-center font-hand text-[13px] text-ink-faint">
                          trống
                        </p>
                      ) : (
                        tasks.map((t) => (
                          <article key={t.id} className="rounded-xl border-2 border-ink/12 bg-raised p-2.5 shadow-[2px_2px_0_0_rgba(23,23,28,0.05)]">
                            <p className="text-[13px] font-bold leading-snug text-ink">{t.title}</p>
                            <p className="mt-1 text-[11px] text-ink-faint">{t.assigneeName ?? "chưa gán"}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              {t.priority ? <Chip tone="blue">{PRIORITY_LABELS[t.priority] ?? t.priority}</Chip> : null}
                              {t.storyPoints != null ? <Chip>⚡ {t.storyPoints}</Chip> : null}
                            </div>
                            {t.dueDate ? (
                              <p className={`mt-1 text-[11px] font-bold ${t.status !== "done" && isOverdue(t.dueDate) ? "text-rose-600" : "text-ink-faint"}`}>
                                Hạn: {fmtDate(t.dueDate)}
                                {t.status !== "done" && isOverdue(t.dueDate) ? " · quá hạn" : ""}
                              </p>
                            ) : null}
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={confirmComplete} onOpenChange={setConfirmComplete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hoàn thành sprint này?</AlertDialogTitle>
            <AlertDialogDescription>
              Sprint sẽ được đóng lại. Các nhiệm vụ còn mở có thể được chuyển sang sprint sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Để sau</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmComplete(false);
                transition.mutate("completed");
              }}
            >
              Hoàn thành
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

/* ───────────────────────── Biểu đồ burndown ───────────────────────── */

function BurndownChart({ points }: { points: { date: string; remaining: number }[] }) {
  const W = 640;
  const H = 220;
  const PAD_X = 34;
  const PAD_Y = 22;

  if (points.length === 0) {
    return <p className="py-6 text-center font-hand text-[15px] text-ink-faint">Chưa có dữ liệu burndown cho sprint này.</p>;
  }

  const maxRemaining = Math.max(...points.map((p) => p.remaining), 1);
  const stepX = points.length > 1 ? (W - PAD_X * 2) / (points.length - 1) : 0;
  const x = (i: number) => PAD_X + i * stepX;
  const y = (v: number) => H - PAD_Y - (v / maxRemaining) * (H - PAD_Y * 2);
  const polyline = points.map((p, i) => `${x(i).toFixed(1)},${y(p.remaining).toFixed(1)}`).join(" ");
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biểu đồ burndown" className="h-56 w-full min-w-[480px]">
        {/* Lưới ngang */}
        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={y(maxRemaining * g)}
              y2={y(maxRemaining * g)}
              stroke="rgba(23,23,28,0.12)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text x={8} y={y(maxRemaining * g) + 4} fontSize="10" fill="var(--ink-faint)" fontWeight="700">
              {Math.round(maxRemaining * g)}
            </text>
          </g>
        ))}
        {/* Trục dọc */}
        <line x1={PAD_X} x2={PAD_X} y1={PAD_Y - 6} y2={H - PAD_Y} stroke="rgba(23,23,28,0.25)" strokeWidth="2" />
        <line x1={PAD_X} x2={W - PAD_X} y1={H - PAD_Y} y2={H - PAD_Y} stroke="rgba(23,23,28,0.25)" strokeWidth="2" />
        {/* Đường burndown */}
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--blue)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Điểm dữ liệu */}
        {points.map((p, i) => (
          <circle key={`${p.date}-${i}`} cx={x(i)} cy={y(p.remaining)} r="3.5" fill="var(--blue)" stroke="white" strokeWidth="1.5" />
        ))}
        {/* Nhãn ngày đầu/cuối */}
        <text x={PAD_X} y={H - 6} fontSize="10" fill="var(--ink-faint)" fontWeight="700" textAnchor="middle">
          {fmtDate(points[0]?.date ?? null)}
        </text>
        <text x={W - PAD_X} y={H - 6} fontSize="10" fill="var(--ink-faint)" fontWeight="700" textAnchor="end">
          {fmtDate(points[points.length - 1]?.date ?? null)}
        </text>
      </svg>
    </div>
  );
}
