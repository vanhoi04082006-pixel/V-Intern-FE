"use client";

import * as React from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock3,
  FlaskConical,
  LayoutList,
  ListChecks,
  Loader2,
  Plus,
  Presentation,
  Rocket,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  planApi,
  sessionApi,
  type PlanDetail,
  type TaskWithSubmission,
} from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, relativeTime } from "@/lib/client/labels";
import { navigate } from "@/lib/client/router";
import { ViewFrame } from "@/components/shared/view";
import {
  Panel,
  PanelHeader,
  PageHeader,
  MetricCard,
  Empty,
  Pager,
  AnimatedProgressBar,
  UserAvatar,
  ToneBadge,
  KeyValue,
} from "@/components/shared/primitives";
import {
  PriorityBadge,
  RoleBadge,
  SessionStatusBadge,
  SubmissionStatusBadge,
  ScoreBadge,
  TaskStatusBadge,
} from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { FilterBar, FilterSelect } from "@/components/shared/toolbar";
import { ConfirmDialog } from "@/components/shared/confirm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionSetupWizard } from "@/components/views/instructor/setup-wizard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTaskReview } from "./task-review-dialog";
import { TimelineActionIcon } from "./shared";

const WORK_PAGE_SIZE = 10;

export function InstructorSessionDetail({ params }: { params: Record<string, string> }) {
  const id = params.id ?? "";
  const [tab, setTab] = React.useState("overview");

  const session = useResource(() => sessionApi.detail(id), [id]);

  const data = session.data;

  if (session.loading) {
    return (
      <ViewFrame>
        <LoadingBlock variant="detail" rows={7} />
      </ViewFrame>
    );
  }

  if (session.error || !data) {
    return (
      <ViewFrame>
        <ErrorBlock
          error={session.error ?? new Error("Không tìm thấy buổi thực tập")}
          onRetry={session.reload}
        />
      </ViewFrame>
    );
  }

  return (
    <ViewFrame>
      <button
        type="button"
        onClick={() => navigate("/instructor/sessions")}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5 icon" /> Về danh sách buổi thực tập
      </button>

      <PageHeader
        eyebrow={data.code}
        title={data.name}
        description={data.description}
        actions={<SessionStatusBadge status={data.status} />}
      />

      <Panel className="mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KeyValue label="Dự án">
            <span className="truncate">{data.project?.name ?? "—"}</span>
          </KeyValue>
          <KeyValue label="Thời gian">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 icon text-faint" />
              {formatDate(data.startDate)} — {formatDate(data.endDate)}
            </span>
          </KeyValue>
          <KeyValue label="Giảng viên phụ trách">
            {data.instructors.map((i) => i.displayName).join(", ") || "—"}
          </KeyValue>
          <KeyValue label="Thành viên">{data.members.length} thực tập sinh</KeyValue>
        </div>
      </Panel>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-line bg-deep/60 p-1 sm:w-fit">
          <TabTrigger value="overview" label="Tổng quan" icon={<LayoutList className="size-3.5 icon" />} />
          <TabTrigger value="work" label="Công việc" icon={<ListChecks className="size-3.5 icon" />} />
          <TabTrigger value="members" label="Thành viên" icon={<Users className="size-3.5 icon" />} />
          <TabTrigger value="setup" label="Khởi tạo" icon={<Rocket className="size-3.5 icon" />} />
          <TabTrigger value="plan" label="Kế hoạch AI" icon={<Sparkles className="size-3.5 icon" />} />
          <TabTrigger value="timeline" label="Timeline" icon={<Clock3 className="size-3.5 icon" />} />
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab sessionId={id} onSessionChanged={session.reload} />
        </TabsContent>
        <TabsContent value="work">
          <WorkTab sessionId={id} members={data.members} onReviewed={session.reload} />
        </TabsContent>
        <TabsContent value="members">
          <MembersTab sessionId={id} onMembersChanged={session.reload} />
        </TabsContent>
        <TabsContent value="setup">
          <SessionSetupWizard sessionId={id} onDone={session.reload} />
        </TabsContent>
        <TabsContent value="plan">
          <PlanTab
            sessionId={id}
            planStatus={data.plan.status}
            planId={data.plan.planId}
            onPlanChanged={session.reload}
          />
        </TabsContent>
        <TabsContent value="timeline">
          <TimelineTab sessionId={id} />
        </TabsContent>
      </Tabs>
    </ViewFrame>
  );
}

function TabTrigger({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
    >
      {icon}
      {label}
    </TabsTrigger>
  );
}

/* ==================== TAB: TỔNG QUAN ==================== */

function OverviewTab({
  sessionId,
  onSessionChanged,
}: {
  sessionId: string;
  onSessionChanged: () => void;
}) {
  const session = useResource(() => sessionApi.detail(sessionId), [sessionId]);
  const [removing, setRemoving] = React.useState<{ userId: string; name: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const data = session.data;

  const handleRemove = () => {
    if (!removing) return;
    setBusy(true);
    sessionApi
      .removeMember(sessionId, removing.userId)
      .then(() => {
        toast.success(`Đã xóa ${removing.name} khỏi buổi thực tập`);
        setRemoving(null);
        session.reload();
        onSessionChanged();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không xóa được thành viên"))
      .finally(() => setBusy(false));
  };

  if (!data) return null;
  const { stats } = data;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Nhiệm vụ"
          value={`${stats.taskDone}/${stats.taskTotal}`}
          hint={`${stats.taskPercent}% hoàn thành`}
          icon={<ListChecks />}
          tone="brand"
        />
        <MetricCard
          label="Tiến độ"
          value={`${stats.taskPercent}%`}
          hint="Tỷ lệ nhiệm vụ hoàn thành"
          icon={<Rocket />}
          tone="teal"
        />
        <MetricCard
          label="Chờ duyệt"
          value={stats.pendingReviewCount}
          hint="Bài nộp chờ giảng viên"
          icon={<Clock3 />}
          tone={stats.pendingReviewCount > 0 ? "amber" : "default"}
        />
        <MetricCard
          label="Thực tập sinh active"
          value={stats.activeInternCount}
          hint={`${data.members.length} thành viên`}
          icon={<Users />}
          tone="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sprints */}
        <Panel>
          <PanelHeader
            title="Tiến độ sprint"
            icon={<Rocket className="size-4 icon" />}
            description={`${data.sprints.length} sprint`}
          />
          {data.sprints.length === 0 ? (
            <Empty
              icon={<Rocket />}
              title="Chưa có sprint nào"
              description="Tạo kế hoạch AI ở tab Kế hoạch AI để sinh sprint tự động."
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-line">
              {data.sprints.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/instructor/sprints/${s.id}`)}
                    className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-panel-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">
                          {s.code}
                        </span>
                        <span className="truncate text-[13px] font-medium text-ink">{s.name}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <AnimatedProgressBar
                          value={s.progress}
                          tone={s.status === "done" ? "brand" : "teal"}
                          className="flex-1"
                        />
                        <span className="font-mono text-[11px] font-semibold text-dim">{s.progress}%</span>
                      </div>
                      <p className="mt-1 text-[10px] text-faint">
                        {formatDate(s.startDate)} — {formatDate(s.endDate)}
                      </p>
                    </div>
                    <TaskStatusBadge status={s.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Milestones */}
        <Panel>
          <PanelHeader
            title="Cột mốc"
            icon={<BadgeCheck className="size-4 icon" />}
            description={`${data.milestones.filter((m) => m.completed).length}/${data.milestones.length} đã đạt`}
          />
          {data.milestones.length === 0 ? (
            <Empty icon={<BadgeCheck />} title="Chưa có cột mốc" className="py-8" />
          ) : (
            <ul className="space-y-0 px-5 py-4">
              {data.milestones.map((m) => (
                <li key={m.id} className="flex items-start gap-3 py-2.5">
                  {m.completed ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 icon text-brand-bright" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 icon text-faint" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[13px] leading-snug ${m.completed ? "text-dim line-through decoration-line" : "text-ink"}`}
                    >
                      {m.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-faint">Hạn {formatDate(m.dueDate)}</p>
                  </div>
                  {m.completed ? (
                    <ToneBadge tone="emerald">Đạt</ToneBadge>
                  ) : (
                    <ToneBadge tone="zinc">Chưa</ToneBadge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Members */}
      <Panel>
        <PanelHeader
          title="Thành viên"
          icon={<Users className="size-4 icon" />}
          description={`${data.members.length} thực tập sinh trong buổi thực tập`}
        />
        {data.members.length === 0 ? (
          <Empty
            icon={<UserPlus />}
            title="Chưa có thành viên nào"
            description="Mời thực tập sinh đã trúng tuyển ở tab Thành viên."
            className="py-8"
          />
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.members.map((m) => (
              <div
                key={m.userId}
                className="group flex items-center gap-3 rounded-xl border border-line bg-deep/60 p-3 transition-colors hover:border-line-strong"
              >
                <UserAvatar name={m.displayName} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{m.displayName}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <RoleBadge role={m.role} />
                    <ToneBadge tone={m.assignmentStatus === "active" ? "emerald" : "zinc"}>
                      {m.assignmentStatus === "active" ? "Đang tham gia" : "Đã rời"}
                    </ToneBadge>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Xóa ${m.displayName} khỏi buổi thực tập`}
                  onClick={() => setRemoving({ userId: m.userId, name: m.displayName })}
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-transparent text-faint opacity-0 transition-all hover:border-rose/30 hover:bg-rose/10 hover:text-rose group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="size-3.5 icon" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!busy && !open) setRemoving(null);
        }}
        title="Xóa thành viên khỏi buổi thực tập?"
        description={`${removing?.name ?? ""} sẽ mất phân công trong buổi thực tập này (phân công chuyển sang đã hủy).`}
        confirmLabel="Xóa thành viên"
        destructive
        busy={busy}
        onConfirm={handleRemove}
      />
    </div>
  );
}

/* ==================== TAB: CÔNG VIỆC ==================== */

function WorkTab({
  sessionId,
  members,
  onReviewed,
}: {
  sessionId: string;
  members: { userId: string; displayName: string }[];
  onReviewed: () => void;
}) {
  const [status, setStatus] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [status, assigneeId]);

  const work = useResource(
    () =>
      sessionApi.work(sessionId, {
        status: status || undefined,
        assigneeId: assigneeId || undefined,
        page,
        pageSize: WORK_PAGE_SIZE,
      }),
    [sessionId, status, assigneeId, page]
  );

  const review = useTaskReview(() => {
    work.reload();
    onReviewed();
  });

  const rows = work.data?.data ?? [];

  const canReview = (t: TaskWithSubmission) =>
    Boolean(t.submission && (t.submission.status === "submitted" || t.submission.status === "rework"));

  return (
    <div className="space-y-4">
      <FilterBar hasActive={Boolean(status || assigneeId)} onReset={() => { setStatus(""); setAssigneeId(""); }}>
        <FilterSelect
          value={assigneeId}
          onChange={setAssigneeId}
          options={members.map((m) => ({ value: m.userId, label: m.displayName }))}
          placeholder="Người thực hiện"
          className="w-48"
          ariaLabel="Lọc theo người thực hiện"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={[
            { value: "todo", label: "Cần làm" },
            { value: "doing", label: "Đang làm" },
            { value: "review", label: "Chờ duyệt" },
            { value: "done", label: "Hoàn thành" },
          ]}
          placeholder="Trạng thái"
          className="w-44"
          ariaLabel="Lọc theo trạng thái"
        />
      </FilterBar>

      {review.dialog}

      {work.loading ? (
        <LoadingBlock rows={6} />
      ) : work.error ? (
        <ErrorBlock error={work.error} onRetry={work.reload} />
      ) : rows.length === 0 ? (
        <Panel>
          <Empty
            icon={<ListChecks />}
            title="Không có nhiệm vụ khớp bộ lọc"
            description="Đổi bộ lọc hoặc tạo nhiệm vụ mới trong không gian sprint."
          />
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="px-4 text-[11px] uppercase tracking-wide text-faint">Nhiệm vụ</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Người thực hiện</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Trạng thái</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Bài nộp</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Điểm AI / GV</TableHead>
                <TableHead className="px-4 text-right text-[11px] uppercase tracking-wide text-faint">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id} className="border-line">
                  <TableCell className="max-w-[280px] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-brand-bright/80">{t.code}</span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <p className="mt-1 truncate text-[13px] text-ink">{t.title}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="inline-flex items-center gap-2 text-xs text-dim">
                      <UserAvatar name={t.assigneeName ?? "?"} size={22} />
                      {t.assigneeName ?? "Chưa gán"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <TaskStatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="py-3">
                    {t.submission ? (
                      <SubmissionStatusBadge status={t.submission.status} />
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {t.submission ? (
                      <span className="flex items-center gap-1.5">
                        <ScoreBadge score={t.submission.aiScore} />
                        <span className="text-faint">/</span>
                        <ScoreBadge score={t.submission.instructorScore} />
                      </span>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant={canReview(t) ? "default" : "outline"}
                      disabled={!t.submission}
                      className="rounded-lg text-xs"
                      onClick={() => review.openReview(t)}
                    >
                      <ClipboardCheck className="icon" />
                      Duyệt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {work.data && work.data.meta.totalPages > 1 ? (
            <Pager
              page={work.data.meta.page}
              totalPages={work.data.meta.totalPages}
              total={work.data.meta.total}
              onChange={setPage}
            />
          ) : null}
        </Panel>
      )}
    </div>
  );
}

/* ==================== TAB: THÀNH VIÊN ==================== */

const roleFilterOptions = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Full-stack" },
  { value: "qa", label: "QA / Tester" },
  { value: "business_analyst", label: "Business Analyst" },
];

function MembersTab({
  sessionId,
  onMembersChanged,
}: {
  sessionId: string;
  onMembersChanged: () => void;
}) {
  const session = useResource(() => sessionApi.detail(sessionId), [sessionId]);
  const [roleFilter, setRoleFilter] = React.useState("");
  const [adding, setAdding] = React.useState<string | null>(null);

  const options = useResource(
    () => sessionApi.memberOptions({ sessionId, role: roleFilter || undefined }),
    [sessionId, roleFilter]
  );

  const members = session.data?.members ?? [];

  const handleAdd = (userId: string, role: string | null, name: string) => {
    if (!role) {
      toast.error("Ứng viên này chưa chọn vai trò");
      return;
    }
    setAdding(userId);
    sessionApi
      .addMember(sessionId, userId, role)
      .then(() => {
        toast.success(`Đã thêm ${name} vào buổi thực tập`);
        options.reload();
        session.reload();
        onMembersChanged();
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Không thêm được thành viên";
        toast.error(message.includes("ASSIGNMENT") ? "Sinh viên này đã có phân công active" : message);
      })
      .finally(() => setAdding(null));
  };

  const optionList = options.data?.data ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Danh sách thành viên hiện tại */}
      <Panel>
        <PanelHeader
          title="Thành viên hiện tại"
          icon={<Users className="size-4 icon" />}
          description={`${members.length} thực tập sinh`}
        />
        {members.length === 0 ? (
          <Empty
            icon={<Users />}
            title="Chưa có thành viên"
            description="Thêm thực tập sinh từ danh sách ứng viên bên phải."
            className="py-8"
          />
        ) : (
          <ul className="divide-y divide-line">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 px-5 py-3.5">
                <UserAvatar name={m.displayName} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{m.displayName}</p>
                  <p className="mt-0.5 text-[11px] text-faint">Vai trò được phân công</p>
                </div>
                <RoleBadge role={m.role} />
                <ToneBadge tone={m.assignmentStatus === "active" ? "emerald" : "zinc"}>
                  {m.assignmentStatus === "active" ? "Active" : "Đã hủy"}
                </ToneBadge>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Thêm thành viên */}
      <Panel>
        <PanelHeader
          title="Thêm thành viên"
          description="Ứng viên đã trúng tuyển phỏng vấn AI và chưa có phân công active."
          icon={<UserPlus className="size-4 icon" />}
          actions={
            <FilterSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleFilterOptions}
              placeholder="Vai trò"
              className="h-8 w-40 text-xs"
              ariaLabel="Lọc ứng viên theo vai trò"
            />
          }
        />
        {options.loading ? (
          <LoadingBlock rows={3} />
        ) : options.error ? (
          <ErrorBlock error={options.error} onRetry={options.reload} />
        ) : optionList.length === 0 ? (
          <Empty
            icon={<UserPlus />}
            title="Không có ứng viên phù hợp"
            description="Không còn ứng viên trúng tuyển nào khớp vai trò này. Thử bỏ lọc vai trò."
            className="py-8"
          />
        ) : (
          <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
            {optionList.map((o) => (
              <li key={o.userId} className="flex items-center gap-3 px-5 py-3">
                <UserAvatar name={o.displayName} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{o.displayName}</p>
                  <p className="truncate text-[11px] text-faint">{o.email}</p>
                </div>
                {o.selectedRole ? <RoleBadge role={o.selectedRole} /> : null}
                {o.result ? <ScoreBadge score={o.result.overallScore} /> : null}
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-brand px-3 text-xs font-semibold text-on-brand hover:bg-brand-bright"
                  disabled={adding === o.userId}
                  onClick={() => handleAdd(o.userId, roleFilter || o.selectedRole, o.displayName)}
                >
                  {adding === o.userId ? <InlineSpinner /> : <Plus className="icon" />}
                  Thêm
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ==================== TAB: KẾ HOẠCH AI ==================== */

function PlanTab({
  sessionId,
  planStatus,
  planId,
  onPlanChanged,
}: {
  sessionId: string;
  planStatus: "none" | "generating" | "draft" | "published";
  planId: string | null;
  onPlanChanged: () => void;
}) {
  const [generating, setGenerating] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  const plan = useResource(
    () => (planId ? planApi.detail(planId) : Promise.resolve(null)),
    [planId, tick]
  );

  // Poll mỗi 4s khi đang sinh kế hoạch
  React.useEffect(() => {
    if (planStatus !== "generating") return;
    const t = setInterval(() => setTick((n) => n + 1), 4000);
    return () => clearInterval(t);
  }, [planStatus]);

  // Poll cả session khi planId chưa biết (vừa bấm generate)
  React.useEffect(() => {
    if (planStatus !== "generating") return;
    const t = setInterval(() => onPlanChanged(), 4000);
    return () => clearInterval(t);
  }, [planStatus, onPlanChanged]);

  const handleGenerate = () => {
    setGenerating(true);
    planApi
      .generate(sessionId)
      .then(() => {
        toast.success("Đã gửi yêu cầu — AI đang sinh kế hoạch sprint");
        onPlanChanged();
        setTick((n) => n + 1);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không sinh được kế hoạch"))
      .finally(() => setGenerating(false));
  };

  const handleConfirm = () => {
    if (!planId) return;
    setPublishing(true);
    planApi
      .confirm(planId)
      .then((res) => {
        toast.success(`Đã công bố kế hoạch: ${res.sprintCount} sprint, ${res.taskCount} nhiệm vụ được tạo`);
        setConfirmOpen(false);
        onPlanChanged();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không công bố được kế hoạch"))
      .finally(() => setPublishing(false));
  };

  if (planStatus === "generating") {
    return (
      <Panel className="p-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="relative grid size-16 place-items-center rounded-2xl bg-brand/10 text-brand-bright">
            <Loader2 className="size-7 animate-spin icon" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">AI đang sinh kế hoạch sprint…</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-dim">
              Hệ thống phân tích blueprint dự án và đề xuất sprint, nhiệm vụ kèm phụ thuộc. Thường
              mất vài giây — trang tự cập nhật.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  if (planStatus === "none") {
    return (
      <Panel className="relative overflow-hidden p-8">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" aria-hidden />
        <div className="relative flex flex-col items-center gap-5 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand-bright">
            <Sparkles className="size-6 icon" />
          </span>
          <div className="max-w-md">
            <h3 className="text-base font-semibold text-ink">Sinh kế hoạch sprint bằng AI</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-dim">
              AI đọc blueprint dự án, đề xuất 3 sprint × 6–8 nhiệm vụ có phụ thuộc, vai trò gợi ý và
              cột mốc. Bạn xem bản nháp, điều chỉnh nếu cần rồi công bố — sprint và nhiệm vụ thật sẽ
              được tạo tự động.
            </p>
          </div>
          <Button
            className="glow-brand rounded-lg"
            disabled={generating}
            onClick={handleGenerate}
          >
            {generating ? <InlineSpinner /> : <Sparkles className="icon" />}
            Tạo kế hoạch AI
          </Button>
        </div>
      </Panel>
    );
  }

  if (planStatus === "published") {
    return (
      <Panel className="p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand-bright">
            <BadgeCheck className="size-6 icon" />
          </span>
          <div className="max-w-md">
            <h3 className="text-base font-semibold text-ink">Kế hoạch đã được công bố</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-dim">
              Sprint và nhiệm vụ đã được tạo cho buổi thực tập này. Theo dõi và giao việc trong
              không gian sprint.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={() => navigate("/instructor/sprints")}
          >
            <Rocket className="icon" /> Đi tới Sprint & giao việc
          </Button>
        </div>
      </Panel>
    );
  }

  if (planStatus === "draft" && !plan.data) {
    return <LoadingBlock rows={5} />;
  }

  if (planStatus === "draft" && plan.data) {
    return (
      <div className="space-y-4">
        <PlanDraftView plan={plan.data} />
        <Panel className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold text-ink">Sẵn sàng công bố?</p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-dim">
              Công bố sẽ tạo {plan.data.draft?.sprints.length ?? 0} sprint và{" "}
              {plan.data.draft?.sprints.reduce((n, s) => n + s.tasks.length, 0) ?? 0} nhiệm vụ thật
              (trạng thái cần làm, tự gán người khi khớp vai trò), buổi thực tập chuyển sang đang diễn ra.
            </p>
          </div>
          <Button className="glow-brand rounded-lg" onClick={() => setConfirmOpen(true)} disabled={publishing}>
            <Rocket className="icon" /> Công bố kế hoạch
          </Button>
        </Panel>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={(open) => {
            if (!publishing) setConfirmOpen(open);
          }}
          title="Công bố kế hoạch AI?"
          description="Sprint và nhiệm vụ sẽ được tạo thật cho buổi thực tập. Hành động này không thể hoàn tác."
          confirmLabel={publishing ? "Đang công bố…" : "Công bố"}
          busy={publishing}
          onConfirm={handleConfirm}
        />
      </div>
    );
  }

  // failed hoặc trạng thái lạ
  return (
    <Panel className="p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-rose/10 text-rose">
          <FlaskConical className="size-6 icon" />
        </span>
        <div className="max-w-md">
          <h3 className="text-base font-semibold text-ink">Kế hoạch gặp lỗi</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-dim">
            {plan.data?.error ?? "Không tạo được kế hoạch. Bạn có thể thử sinh lại."}
          </p>
        </div>
        <Button className="rounded-lg" disabled={generating} onClick={handleGenerate}>
          {generating ? <InlineSpinner /> : <Sparkles className="icon" />}
          Thử sinh lại
        </Button>
      </div>
    </Panel>
  );
}

function PlanDraftView({ plan }: { plan: PlanDetail }) {
  const draft = plan.draft;
  if (!draft) return null;
  return (
    <Panel>
      <PanelHeader
        title="Bản nháp kế hoạch AI"
        description={`${draft.sprints.length} sprint · ${draft.sprints.reduce((n, s) => n + s.tasks.length, 0)} nhiệm vụ đề xuất`}
        icon={<Sparkles className="size-4 icon" />}
        actions={<ToneBadge tone="amber" dot>Bản nháp</ToneBadge>}
      />
      {plan.warnings.length > 0 ? (
        <div className="border-b border-line px-5 py-3">
          {plan.warnings.map((w) => (
            <p key={w} className="text-[11px] text-amber">
              Lưu ý: {w}
            </p>
          ))}
        </div>
      ) : null}
      <Accordion type="multiple" defaultValue={[draft.sprints[0]?.code ?? "s0"]}>
        {draft.sprints.map((sprint) => (
          <AccordionItem key={sprint.code} value={sprint.code} className="border-line">
            <AccordionTrigger className="px-5 text-ink hover:no-underline">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 pr-4 text-left sm:flex-row sm:items-center sm:gap-3">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">
                  {sprint.code}
                </span>
                <span className="truncate text-sm font-semibold">{sprint.name}</span>
                <ToneBadge tone="zinc" className="hidden sm:inline-flex">
                  {sprint.tasks.length} nhiệm vụ
                </ToneBadge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-4">
              <p className="mb-3 text-xs italic leading-relaxed text-dim">Mục tiêu: {sprint.goal}</p>
              <ul className="space-y-1.5">
                {sprint.tasks.map((task) => (
                  <li
                    key={task.key}
                    className="rounded-lg border border-line bg-deep/60 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-brand-bright/80">
                        {task.key}
                      </span>
                      <PriorityBadge priority={task.priority} />
                      <span className="min-w-0 flex-1 text-xs text-ink">{task.title}</span>
                      <span className="font-mono text-[10px] text-faint">{task.storyPoints} SP</span>
                      <RoleBadge role={task.suggestedRole} />
                    </div>
                    {task.dependsOn.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-faint">Phụ thuộc:</span>
                        {task.dependsOn.map((dep) => (
                          <span
                            key={dep}
                            className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-dim"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {draft.milestones.length > 0 ? (
        <div className="border-t border-line px-5 py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
            Cột mốc đề xuất
          </p>
          <div className="flex flex-wrap gap-2">
            {draft.milestones.map((m) => (
              <ToneBadge key={m.title} tone="teal">
                {m.title} · ngày {m.dueOffsetDays}
              </ToneBadge>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

/* ==================== TAB: TIMELINE ==================== */

const TIMELINE_PAGE_SIZE = 8;

function TimelineTab({ sessionId }: { sessionId: string }) {
  const [page, setPage] = React.useState(1);
  const timeline = useResource(
    () => sessionApi.timeline(sessionId, { page, pageSize: TIMELINE_PAGE_SIZE }),
    [sessionId, page]
  );

  const events = timeline.data?.data ?? [];

  if (timeline.loading) {
    return <LoadingBlock rows={5} />;
  }
  if (timeline.error) {
    return <ErrorBlock error={timeline.error} onRetry={timeline.reload} />;
  }
  if (events.length === 0) {
    return (
      <Panel>
        <Empty
          icon={<Clock3 />}
          title="Chưa có sự kiện nào"
          description="Hoạt động của buổi thực tập sẽ xuất hiện ở đây."
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Dòng thời gian hoạt động"
        icon={<Clock3 className="size-4 icon" />}
        description={`${timeline.data?.meta.total ?? events.length} sự kiện`}
      />
      <ol className="relative px-5 py-4">
        {events.map((e, i) => (
          <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
            {i < events.length - 1 ? (
              <span
                className="absolute left-[17px] top-10 h-full w-px bg-gradient-to-b from-line to-line/40"
                aria-hidden
              />
            ) : null}
            <TimelineActionIcon action={e.action} />
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[13px] leading-relaxed text-ink">{e.summary}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                <span className="inline-flex items-center gap-1">
                  <Presentation className="size-3 icon" /> {e.actorName}
                </span>
                · {relativeTime(e.createdAt)} · {formatDate(e.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {timeline.data && timeline.data.meta.totalPages > 1 ? (
        <Pager
          page={timeline.data.meta.page}
          totalPages={timeline.data.meta.totalPages}
          total={timeline.data.meta.total}
          onChange={setPage}
        />
      ) : null}
    </Panel>
  );
}
