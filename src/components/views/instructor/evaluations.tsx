"use client";

import * as React from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  candidateApi,
  evaluationApi,
  type AiSuggestion,
  type Criterion,
  type EvaluationCycle,
} from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, relativeTime } from "@/lib/client/labels";
import { ViewFrame, Stagger, StaggerItem } from "@/components/shared/view";
import {
  Panel,
  PanelHeader,
  PageHeader,
  Empty,
  Pager,
  ToneBadge,
  UserAvatar,
} from "@/components/shared/primitives";
import { EvaluationStatusBadge, ScoreBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { FilterBar, FilterSelect } from "@/components/shared/toolbar";
import { ConfirmDialog } from "@/components/shared/confirm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CycleStatusBadge, cycleNextStatus, cycleStatusLabels } from "./shared";

/* ===================== View chính ===================== */

export function InstructorEvaluations() {
  const [tab, setTab] = React.useState("cycles");

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Đánh giá"
        title="Quản lý đánh giá"
        description="Cấu hình chu kỳ đánh giá và tiêu chí, chấm điểm thực tập sinh với hỗ trợ gợi ý từ AI."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-line bg-deep/60 p-1 sm:w-fit">
          <TabsTrigger
            value="cycles"
            className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
          >
            <ClipboardList className="size-3.5 icon" /> Chu kỳ đánh giá
          </TabsTrigger>
          <TabsTrigger
            value="board"
            className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
          >
            <ClipboardCheck className="size-3.5 icon" /> Bảng đánh giá
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cycles">
          <CyclesTab />
        </TabsContent>
        <TabsContent value="board">
          <BoardTab />
        </TabsContent>
      </Tabs>
    </ViewFrame>
  );
}

/* ===================== TAB 1: CHU KỲ ===================== */

function CyclesTab() {
  const cycles = useResource(() => evaluationApi.cycles(), []);
  const [createOpen, setCreateOpen] = React.useState(false);

  const list = cycles.data?.data ?? [];
  const [selectedCycleId, setSelectedCycleId] = React.useState("");

  const effectiveCycleId =
    selectedCycleId && list.some((c) => c.id === selectedCycleId)
      ? selectedCycleId
      : list[0]?.id ?? "";
  const selectedCycle = list.find((c) => c.id === effectiveCycleId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">
          Chu kỳ đánh giá <span className="ml-1.5 text-xs font-normal text-faint">({list.length})</span>
        </h2>
        <Button className="rounded-lg" onClick={() => setCreateOpen(true)}>
          <Plus className="icon" /> Tạo chu kỳ mới
        </Button>
      </div>

      {cycles.loading ? (
        <LoadingBlock variant="cards" rows={3} />
      ) : cycles.error ? (
        <ErrorBlock error={cycles.error} onRetry={cycles.reload} />
      ) : list.length === 0 ? (
        <Panel>
          <Empty
            icon={<ClipboardList />}
            title="Chưa có chu kỳ đánh giá nào"
            description="Tạo chu kỳ đánh giá đầu tiên để bắt đầu chấm điểm thực tập sinh."
            action={
              <Button className="rounded-lg" onClick={() => setCreateOpen(true)}>
                <Plus className="icon" /> Tạo chu kỳ mới
              </Button>
            }
          />
        </Panel>
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <StaggerItem key={c.id}>
              <CycleCard
                cycle={c}
                selected={c.id === effectiveCycleId}
                onSelect={() => setSelectedCycleId(c.id)}
                onChanged={cycles.reload}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {selectedCycle ? <CriteriaManager cycle={selectedCycle} onChanged={cycles.reload} /> : null}

      <CreateCycleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          cycles.reload();
        }}
      />
    </div>
  );
}

function CycleCard({
  cycle,
  selected,
  onSelect,
  onChanged,
}: {
  cycle: EvaluationCycle;
  selected: boolean;
  onSelect: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const next = cycleNextStatus[cycle.status] ?? null;

  const handleStatus = (status: string) => {
    setBusy(true);
    evaluationApi
      .setCycleStatus(cycle.id, status)
      .then(() => {
        toast.success(`Chu kỳ "${cycle.name}" chuyển sang "${cycleStatusLabels[status] ?? status}"`);
        onChanged();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không chuyển được trạng thái"))
      .finally(() => setBusy(false));
  };

  return (
    <Panel
      hoverable
      className={`p-5 ${selected ? "border-brand/40 ring-1 ring-inset ring-brand/25" : ""}`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ink">{cycle.name}</h3>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-dim">
              <CalendarDays className="size-3.5 icon text-faint" />
              {formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}
            </p>
          </div>
          <CycleStatusBadge status={cycle.status} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ToneBadge tone="zinc">
            <Users className="size-3 icon" /> {cycle.evaluationCount} đánh giá
          </ToneBadge>
          <ToneBadge tone="zinc">{cycle.criteriaCount} tiêu chí</ToneBadge>
        </div>
      </button>

      {next ? (
        <div className="mt-4 border-t border-line pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                className="h-8 w-full rounded-lg border-line bg-transparent text-xs text-dim hover:bg-panel-2 hover:text-ink"
              >
                {busy ? <InlineSpinner /> : <Settings2 className="icon" />}
                Chuyển trạng thái
                <ChevronDown className="icon" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-line bg-panel-2 text-ink">
              <DropdownMenuItem
                className="gap-2 text-[13px] hover:!bg-white/[0.05]"
                onClick={() => handleStatus(next)}
              >
                <BadgeCheck className="size-4 icon text-brand-bright" />
                Chuyển sang “{cycleStatusLabels[next]}”
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </Panel>
  );
}

function CreateCycleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 86400000);
      setStartDate(now.toISOString().slice(0, 10));
      setEndDate(end.toISOString().slice(0, 10));
    }
  }, [open]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên chu kỳ");
      return;
    }
    setSubmitting(true);
    evaluationApi
      .createCycle({
        name: name.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      })
      .then(() => {
        toast.success("Đã tạo chu kỳ đánh giá mới (trạng thái bản nháp)");
        onOpenChange(false);
        onCreated();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không tạo được chu kỳ"))
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="rounded-2xl border-line bg-panel p-0 sm:max-w-md">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">
            Tạo chu kỳ đánh giá mới
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-dim">
            Chu kỳ mới ở trạng thái bản nháp. Thêm tiêu chí rồi mở chu kỳ để chấm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="cycle-name" className="text-xs font-medium text-dim">
              Tên chu kỳ <span className="text-rose">*</span>
            </Label>
            <Input
              id="cycle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Đánh giá giữa kỳ S2"
              className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cycle-start" className="text-xs font-medium text-dim">
                Ngày bắt đầu
              </Label>
              <Input
                id="cycle-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cycle-end" className="text-xs font-medium text-dim">
                Ngày kết thúc
              </Label>
              <Input
                id="cycle-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
            {submitting ? <InlineSpinner /> : <Plus className="icon" />} Tạo chu kỳ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Criteria manager ---------- */

function CriteriaManager({
  cycle,
  onChanged,
}: {
  cycle: EvaluationCycle;
  onChanged: () => void;
}) {
  const criteria = useResource(() => evaluationApi.criteria(cycle.id), [cycle.id]);
  const [editing, setEditing] = React.useState<Criterion | "new" | null>(null);
  const [deleting, setDeleting] = React.useState<Criterion | null>(null);
  const [busy, setBusy] = React.useState(false);

  const list = criteria.data?.data ?? [];
  const totalWeight = list.reduce((sum, c) => sum + c.weight, 0);

  const handleDelete = () => {
    if (!deleting) return;
    setBusy(true);
    evaluationApi
      .deleteCriterion(deleting.id)
      .then(() => {
        toast.success(`Đã xóa tiêu chí "${deleting.label}"`);
        setDeleting(null);
        criteria.reload();
        onChanged();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không xóa được tiêu chí"))
      .finally(() => setBusy(false));
  };

  return (
    <Panel>
      <PanelHeader
        title={`Tiêu chí — ${cycle.name}`}
        description={
          list.length > 0
            ? `${list.length} tiêu chí · tổng trọng số ${Math.round(totalWeight * 100)}%`
            : "Chưa có tiêu chí nào"
        }
        icon={<ClipboardCheck className="size-4 icon" />}
        actions={
          <Button size="sm" className="rounded-lg" onClick={() => setEditing("new")}>
            <Plus className="icon" /> Thêm tiêu chí
          </Button>
        }
      />

      {criteria.loading ? (
        <LoadingBlock rows={4} />
      ) : criteria.error ? (
        <ErrorBlock error={criteria.error} onRetry={criteria.reload} />
      ) : list.length === 0 ? (
        <Empty
          icon={<ClipboardCheck />}
          title="Chưa có tiêu chí"
          description="Thêm 4–6 tiêu chí (trọng số tổng = 100%) để bắt đầu chấm điểm."
          className="py-8"
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="px-4 text-[11px] uppercase tracking-wide text-faint">Mã</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Tiêu chí</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Trọng số</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Điểm tối đa</TableHead>
                <TableHead className="px-4 text-right text-[11px] uppercase tracking-wide text-faint">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id} className="border-line">
                  <TableCell className="px-4 py-3 font-mono text-[11px] text-brand-bright/80">
                    {c.code}
                  </TableCell>
                  <TableCell className="py-3 text-[13px] text-ink">{c.label}</TableCell>
                  <TableCell className="py-3">
                    <ToneBadge tone={c.weight >= 0.25 ? "brand" : "zinc"}>
                      {Math.round(c.weight * 100)}%
                    </ToneBadge>
                  </TableCell>
                  <TableCell className="py-3 font-mono text-xs text-dim">{c.maxScore}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg border-line bg-transparent px-2.5 text-xs text-dim hover:bg-panel-2 hover:text-ink"
                        onClick={() => setEditing(c)}
                      >
                        Sửa
                      </Button>
                      <button
                        type="button"
                        aria-label={`Xóa tiêu chí ${c.label}`}
                        onClick={() => setDeleting(c)}
                        className="grid size-8 place-items-center rounded-lg border border-transparent text-faint transition-colors hover:border-rose/30 hover:bg-rose/10 hover:text-rose"
                      >
                        <Trash2 className="size-3.5 icon" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t border-line px-5 py-3 text-[11px] text-faint">
            Tổng trọng số hiện tại:{" "}
            <span className={totalWeight === 1 ? "text-brand-bright" : "text-amber"}>
              {Math.round(totalWeight * 100)}%
            </span>{" "}
            (chuẩn: 100%)
          </p>
        </>
      )}

      <CriterionDialog
        cycleId={cycle.id}
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          criteria.reload();
          onChanged();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!busy && !open) setDeleting(null);
        }}
        title="Xóa tiêu chí?"
        description={`Tiêu chí "${deleting?.label ?? ""}" sẽ bị xóa khỏi chu kỳ.`}
        confirmLabel="Xóa tiêu chí"
        destructive
        busy={busy}
        onConfirm={handleDelete}
      />
    </Panel>
  );
}

function CriterionDialog({
  cycleId,
  editing,
  onClose,
  onSaved,
}: {
  cycleId: string;
  editing: Criterion | "new" | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = editing === "new";
  const open = editing !== null;
  const [code, setCode] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [weight, setWeight] = React.useState("0.2");
  const [maxScore, setMaxScore] = React.useState("100");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (editing && editing !== "new") {
      setCode(editing.code);
      setLabel(editing.label);
      setWeight(String(editing.weight));
      setMaxScore(String(editing.maxScore));
    } else if (editing === "new") {
      setCode("");
      setLabel("");
      setWeight("0.2");
      setMaxScore("100");
    }
  }, [editing]);

  const handleSubmit = () => {
    if (!code.trim() || !label.trim()) {
      toast.error("Vui lòng nhập mã và tên tiêu chí");
      return;
    }
    const w = Number(weight);
    const max = Number(maxScore);
    if (!Number.isFinite(w) || w <= 0 || w > 1) {
      toast.error("Trọng số phải từ > 0 đến 1 (VD: 0.25)");
      return;
    }
    if (!Number.isFinite(max) || max <= 0) {
      toast.error("Điểm tối đa phải là số dương");
      return;
    }
    setSubmitting(true);
    const payload = { code: code.trim().toUpperCase(), label: label.trim(), weight: w, maxScore: max };
    const action = isNew
      ? evaluationApi.addCriterion(cycleId, payload)
      : evaluationApi.updateCriterion((editing as Criterion).id, payload);
    action
      .then(() => {
        toast.success(isNew ? "Đã thêm tiêu chí" : "Đã cập nhật tiêu chí");
        onSaved();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không lưu được tiêu chí"))
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && !v && onClose()}>
      <DialogContent className="rounded-2xl border-line bg-panel p-0 sm:max-w-md">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">
            {isNew ? "Thêm tiêu chí" : "Sửa tiêu chí"}
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-dim">
            Trọng số theo thập phân (0.25 = 25%). Tổng các tiêu chí nên bằng 1.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="crit-code" className="text-xs font-medium text-dim">
                Mã <span className="text-rose">*</span>
              </Label>
              <Input
                id="crit-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="TECH_FOUNDATION"
                disabled={!isNew}
                className="h-10 rounded-lg border-line bg-deep font-mono text-xs uppercase text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crit-label" className="text-xs font-medium text-dim">
                Tên hiển thị <span className="text-rose">*</span>
              </Label>
              <Input
                id="crit-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nền tảng kỹ thuật"
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crit-weight" className="text-xs font-medium text-dim">
                Trọng số (0–1)
              </Label>
              <Input
                id="crit-weight"
                type="number"
                min={0.05}
                max={1}
                step={0.05}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crit-max" className="text-xs font-medium text-dim">
                Điểm tối đa
              </Label>
              <Input
                id="crit-max"
                type="number"
                min={1}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
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
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? <InlineSpinner /> : null}
            {isNew ? "Thêm tiêu chí" : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ===================== TAB 2: BẢNG ĐÁNH GIÁ ===================== */

/** Dòng điểm trong chi tiết đánh giá (backend trả kèm criterionCode). */
type ScoreRow = {
  criterionId: string;
  criterionCode?: string;
  code?: string;
  label: string;
  weight: number;
  maxScore: number;
  score: number | null;
  comment: string | null;
};

function BoardTab() {
  const cycles = useResource(() => evaluationApi.cycles(), []);
  const [cycleId, setCycleId] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [openEvalId, setOpenEvalId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    setPage(1);
  }, [cycleId, status]);

  const evaluations = useResource(
    () =>
      evaluationApi.list({
        cycleId: cycleId || undefined,
        status: status || undefined,
        page,
        pageSize: 10,
      }),
    [cycleId, status, page, openEvalId]
  );

  const cycleOptions = (cycles.data?.data ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  if (openEvalId) {
    return (
      <EvaluationDetail
        evaluationId={openEvalId}
        onBack={() => setOpenEvalId(null)}
      />
    );
  }

  const rows = evaluations.data?.data ?? [];

  return (
    <div className="space-y-4">
      <FilterBar
        hasActive={Boolean(cycleId || status)}
        onReset={() => {
          setCycleId("");
          setStatus("");
        }}
      >
        <FilterSelect
          value={cycleId}
          onChange={setCycleId}
          options={cycleOptions}
          placeholder="Chu kỳ"
          className="w-56"
          ariaLabel="Lọc theo chu kỳ"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={[
            { value: "draft", label: "Bản nháp" },
            { value: "submitted", label: "Đã nộp" },
            { value: "finalized", label: "Đã chốt" },
          ]}
          placeholder="Trạng thái"
          className="w-44"
          ariaLabel="Lọc theo trạng thái"
        />
        <Button size="sm" className="ml-auto h-9 rounded-lg" onClick={() => setCreateOpen(true)}>
          <Plus className="icon" /> Tạo đánh giá
        </Button>
      </FilterBar>

      {evaluations.loading ? (
        <LoadingBlock rows={5} />
      ) : evaluations.error ? (
        <ErrorBlock error={evaluations.error} onRetry={evaluations.reload} />
      ) : rows.length === 0 ? (
        <Panel>
          <Empty
            icon={<ClipboardCheck />}
            title="Chưa có đánh giá nào"
            description="Tạo đánh giá cho thực tập sinh trong một chu kỳ để bắt đầu chấm điểm."
            action={
              <Button className="rounded-lg" onClick={() => setCreateOpen(true)}>
                <Plus className="icon" /> Tạo đánh giá
              </Button>
            }
          />
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="px-4 text-[11px] uppercase tracking-wide text-faint">Thực tập sinh</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Chu kỳ</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Trạng thái</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Điểm tổng</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Người chấm</TableHead>
                <TableHead className="px-4 text-right text-[11px] uppercase tracking-wide text-faint">Cập nhật</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow
                  key={e.id}
                  className="cursor-pointer border-line"
                  onClick={() => setOpenEvalId(e.id)}
                >
                  <TableCell className="px-4 py-3 text-[13px] font-medium text-ink">
                    {e.internName}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-dim">{e.cycleName}</TableCell>
                  <TableCell className="py-3">
                    <EvaluationStatusBadge status={e.status} />
                  </TableCell>
                  <TableCell className="py-3">
                    <ScoreBadge score={e.overallScore} />
                  </TableCell>
                  <TableCell className="py-3 text-xs text-dim">{e.evaluatorName}</TableCell>
                  <TableCell className="px-4 py-3 text-right text-[11px] text-faint">
                    {relativeTime(e.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {evaluations.data && evaluations.data.meta.totalPages > 1 ? (
            <Pager
              page={evaluations.data.meta.page}
              totalPages={evaluations.data.meta.totalPages}
              total={evaluations.data.meta.total}
              onChange={setPage}
            />
          ) : null}
        </Panel>
      )}

      <CreateEvaluationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => evaluations.reload()}
      />
    </div>
  );
}

function CreateEvaluationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const cycles = useResource(() => evaluationApi.cycles(), [open]);
  const assignments = useResource(
    () => candidateApi.assignments(),
    [open]
  );

  const [cycleId, setCycleId] = React.useState("");
  const [internId, setInternId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCycleId("");
      setInternId("");
    }
  }, [open]);

  const cycleList = cycles.data?.data ?? [];
  const internOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    (assignments.data?.data ?? [])
      .filter((a) => a.status === "active")
      .forEach((a) => map.set(a.internId, `${a.internName} · ${a.role}`));
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [assignments.data]);

  const handleSubmit = () => {
    if (!cycleId || !internId) {
      toast.error("Vui lòng chọn chu kỳ và thực tập sinh");
      return;
    }
    setSubmitting(true);
    evaluationApi
      .create({ cycleId, internId })
      .then((row) => {
        toast.success(`Đã tạo đánh giá bản nháp cho ${row.internName}`);
        onOpenChange(false);
        onCreated();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không tạo được đánh giá"))
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="rounded-2xl border-line bg-panel p-0 sm:max-w-md">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">
            Tạo đánh giá mới
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-dim">
            Chọn chu kỳ và thực tập sinh đang có phân công active.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-dim">Chu kỳ đánh giá</Label>
            <Select value={cycleId} onValueChange={setCycleId}>
              <SelectTrigger className="h-10 w-full rounded-lg border-line bg-deep text-sm text-ink">
                <SelectValue placeholder="Chọn chu kỳ…" />
              </SelectTrigger>
              <SelectContent className="border-line bg-panel-2 text-ink">
                {cycleList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-dim">Thực tập sinh</Label>
            <Select value={internId} onValueChange={setInternId}>
              <SelectTrigger className="h-10 w-full rounded-lg border-line bg-deep text-sm text-ink">
                <SelectValue placeholder="Chọn thực tập sinh…" />
              </SelectTrigger>
              <SelectContent className="max-h-56 border-line bg-panel-2 text-ink">
                {internOptions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-faint">Không có phân công active</div>
                ) : (
                  internOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
            {submitting ? <InlineSpinner /> : <Plus className="icon" />} Tạo đánh giá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Chi tiết đánh giá (inline) ---------- */

function EvaluationDetail({
  evaluationId,
  onBack,
}: {
  evaluationId: string;
  onBack: () => void;
}) {
  const detail = useResource(() => evaluationApi.detail(evaluationId), [evaluationId]);

  const [scores, setScores] = React.useState<Record<string, { score: string; comment: string }>>({});
  const [summary, setSummary] = React.useState("");
  const [initialized, setInitialized] = React.useState(false);

  const [suggestions, setSuggestions] = React.useState<{
    summary: string;
    strengths: string[];
    improvementAreas: string[];
    criteriaSuggestions: AiSuggestion[];
  } | null>(null);
  const [suggesting, setSuggesting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [finalizeOpen, setFinalizeOpen] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);

  const data = detail.data;
  const evaluation = data?.evaluation ?? null;
  const scoreRows = (data?.scores ?? []) as unknown as ScoreRow[];

  React.useEffect(() => {
    if (data && !initialized) {
      const map: Record<string, { score: string; comment: string }> = {};
      scoreRows.forEach((r) => {
        map[r.criterionId] = {
          score: r.score === null || r.score === undefined ? "" : String(r.score),
          comment: r.comment ?? "",
        };
      });
      setScores(map);
      setSummary(evaluation?.summary ?? "");
      setInitialized(true);
    }
  }, [data, initialized, scoreRows, evaluation?.summary]);

  const weightedAvg = React.useMemo(() => {
    let sum = 0;
    let weightSum = 0;
    scoreRows.forEach((r) => {
      const v = Number(scores[r.criterionId]?.score);
      if (Number.isFinite(v)) {
        sum += v * r.weight;
        weightSum += r.weight;
      }
    });
    if (weightSum === 0) return null;
    return Math.round((sum / weightSum) * 10) / 10;
  }, [scoreRows, scores]);

  const buildPatchScores = () =>
    scoreRows
      .filter((r) => scores[r.criterionId])
      .map((r) => ({
        criterionId: r.criterionId,
        score: scores[r.criterionId].score === "" ? null : Number(scores[r.criterionId].score),
        comment: scores[r.criterionId].comment || null,
      }));

  const handleSave = () => {
    setSaving(true);
    evaluationApi
      .update(evaluationId, { scores: buildPatchScores(), summary })
      .then(() => {
        toast.success("Đã lưu nháp đánh giá");
        setInitialized(false);
        detail.reload();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không lưu được"))
      .finally(() => setSaving(false));
  };

  const handleSubmitEval = () => {
    setSubmitting(true);
    evaluationApi
      .submit(evaluationId)
      .then(() => {
        toast.success("Đã nộp đánh giá — có thể chốt sau khi rà soát");
        setInitialized(false);
        detail.reload();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không nộp được"))
      .finally(() => setSubmitting(false));
  };

  const handleFinalize = () => {
    setFinalizing(true);
    evaluationApi
      .finalize(evaluationId)
      .then(() => {
        toast.success("Đã chốt đánh giá — kết quả ghi nhận cho thực tập sinh");
        setFinalizeOpen(false);
        setInitialized(false);
        detail.reload();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không chốt được"))
      .finally(() => setFinalizing(false));
  };

  const handleSuggest = () => {
    setSuggesting(true);
    evaluationApi
      .aiSuggestions(evaluationId)
      .then(setSuggestions)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không lấy được gợi ý AI"))
      .finally(() => setSuggesting(false));
  };

  const applySuggestion = (s: AiSuggestion) => {
    const row = scoreRows.find(
      (r) => (r.criterionCode ?? r.code) === s.criterionCode
    );
    if (!row) {
      toast.error("Không tìm thấy tiêu chí khớp");
      return;
    }
    setScores((prev) => ({
      ...prev,
      [row.criterionId]: { score: String(s.suggestedScore), comment: s.comment },
    }));
    toast.success(`Đã áp dụng đề xuất cho “${s.label}”`);
  };

  if (detail.loading) {
    return <LoadingBlock variant="detail" rows={6} />;
  }
  if (detail.error || !evaluation) {
    return <ErrorBlock error={detail.error ?? new Error("Không tìm thấy đánh giá")} onRetry={detail.reload} />;
  }

  const editable = evaluation.status === "draft";

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5 icon" /> Về bảng đánh giá
      </button>

      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {data?.intern ? <UserAvatar name={data.intern.displayName} size={44} /> : null}
            <div>
              <h2 className="text-base font-semibold text-ink">{evaluation.internName}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-dim">
                {evaluation.cycleName} · <EvaluationStatusBadge status={evaluation.status} />
                {data?.intern?.email ? <span className="text-faint">· {data.intern.email}</span> : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">
                Điểm tổng hợp
              </p>
              <p className="font-mono text-2xl font-bold text-brand-bright">
                {evaluation.overallScore ?? weightedAvg ?? "—"}
                {evaluation.overallScore === null && weightedAvg !== null ? (
                  <span className="ml-1 text-[10px] font-medium text-faint">(tạm tính)</span>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* Điểm từng tiêu chí */}
      <Panel>
        <PanelHeader
          title="Điểm theo tiêu chí"
          description={
            editable
              ? "Nhập điểm 0–100 và nhận xét cho từng tiêu chí."
              : "Đánh giá đã nộp/chốt — chỉ xem."
          }
          icon={<ClipboardCheck className="size-4 icon" />}
          actions={
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-line bg-transparent text-xs text-dim hover:bg-panel-2 hover:text-ink"
              disabled={suggesting || !editable}
              onClick={handleSuggest}
            >
              {suggesting ? <InlineSpinner /> : <Sparkles className="icon text-brand-bright" />}
              Gợi ý AI
            </Button>
          }
        />
        <div className="divide-y divide-line">
          {scoreRows.map((r) => (
            <div key={r.criterionId} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_120px_1.4fr] sm:items-center">
              <div>
                <p className="text-[13px] font-medium text-ink">{r.label}</p>
                <p className="mt-0.5 font-mono text-[10px] text-faint">
                  {r.criterionCode ?? r.code} · trọng số {Math.round(r.weight * 100)}% · tối đa {r.maxScore}
                </p>
              </div>
              <div>
                <Input
                  type="number"
                  min={0}
                  max={r.maxScore}
                  value={scores[r.criterionId]?.score ?? ""}
                  disabled={!editable}
                  onChange={(e) =>
                    setScores((prev) => ({
                      ...prev,
                      [r.criterionId]: {
                        score: e.target.value,
                        comment: prev[r.criterionId]?.comment ?? "",
                      },
                    }))
                  }
                  className="h-9 rounded-lg border-line bg-deep text-center font-mono text-sm text-ink focus-visible:ring-brand/30"
                  placeholder="—"
                />
              </div>
              <Input
                value={scores[r.criterionId]?.comment ?? ""}
                disabled={!editable}
                onChange={(e) =>
                  setScores((prev) => ({
                    ...prev,
                    [r.criterionId]: {
                      score: prev[r.criterionId]?.score ?? "",
                      comment: e.target.value,
                    },
                  }))
                }
                className="h-9 rounded-lg border-line bg-deep text-xs text-ink focus-visible:ring-brand/30"
                placeholder="Nhận xét…"
              />
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-line px-5 py-4">
          <label htmlFor="eval-summary" className="text-xs font-medium text-dim">
            Tổng nhận xét
          </label>
          <Textarea
            id="eval-summary"
            value={summary}
            disabled={!editable}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Đánh giá tổng quan quá trình thực tập…"
            className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
          />
        </div>
      </Panel>

      {/* Gợi ý AI */}
      {suggestions ? (
        <Panel>
          <PanelHeader
            title="Gợi ý điểm từ AI"
            description={suggestions.summary}
            icon={<Sparkles className="size-4 icon" />}
            actions={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs text-faint hover:text-ink"
                onClick={() => setSuggestions(null)}
              >
                Đóng
              </Button>
            }
          />
          <div className="space-y-2 px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-deep/60 p-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-bright">
                  Điểm mạnh
                </p>
                <ul className="space-y-1">
                  {suggestions.strengths.map((s) => (
                    <li key={s} className="text-xs leading-relaxed text-dim">
                      · {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-line bg-deep/60 p-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber">
                  Cần cải thiện
                </p>
                <ul className="space-y-1">
                  {suggestions.improvementAreas.map((s) => (
                    <li key={s} className="text-xs leading-relaxed text-dim">
                      · {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <ul className="space-y-2">
              {suggestions.criteriaSuggestions.map((s) => (
                <li
                  key={s.criterionCode}
                  className="flex flex-wrap items-start gap-3 rounded-xl border border-line bg-deep/60 p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-ink">{s.label}</span>
                      <ToneBadge tone="brand">Đề xuất: {s.suggestedScore}</ToneBadge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-dim">{s.comment}</p>
                    {s.evidence.length > 0 ? (
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {s.evidence.map((ev) => (
                          <li
                            key={ev}
                            className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-faint"
                          >
                            {ev}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {editable ? (
                    <Button
                      size="sm"
                      className="h-8 rounded-lg bg-brand/15 text-xs font-semibold text-brand-bright hover:bg-brand/25"
                      onClick={() => applySuggestion(s)}
                    >
                      Áp dụng
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      ) : null}

      {/* Hành động theo flow */}
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-xs text-faint">
          Flow: Bản nháp → Lưu/Nộp → Chốt. Đánh giá đã chốt sẽ ghi nhận vào kết quả thực tập sinh.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {editable ? (
            <>
              <Button
                variant="outline"
                className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? <InlineSpinner /> : null} Lưu nháp
              </Button>
              <Button
                className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
                disabled={submitting}
                onClick={handleSubmitEval}
              >
                {submitting ? <InlineSpinner /> : <Send className="icon" />} Nộp đánh giá
              </Button>
            </>
          ) : evaluation.status === "submitted" ? (
            <Button className="glow-brand rounded-lg" disabled={finalizing} onClick={() => setFinalizeOpen(true)}>
              <BadgeCheck className="icon" /> Chốt đánh giá
            </Button>
          ) : (
            <ToneBadge tone="emerald" dot>
              Đã chốt — không thể chỉnh sửa
            </ToneBadge>
          )}
        </div>
      </Panel>

      <ConfirmDialog
        open={finalizeOpen}
        onOpenChange={(open) => {
          if (!finalizing && !open) setFinalizeOpen(open);
        }}
        title="Chốt đánh giá?"
        description={`Đánh giá của ${evaluation.internName} sẽ được ghi nhận vào kết quả (${evaluation.overallScore ?? weightedAvg ?? "—"}/100) và không thể chỉnh sửa nữa.`}
        confirmLabel={finalizing ? "Đang chốt…" : "Chốt đánh giá"}
        busy={finalizing}
        onConfirm={handleFinalize}
      />
    </div>
  );
}
