"use client";

import * as React from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Layers,
  ListChecks,
  Rocket,
  Tag,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { templateApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { navigate } from "@/lib/client/router";
import { formatDate } from "@/lib/client/labels";
import { ViewFrame } from "@/components/shared/view";
import {
  Panel,
  PanelHeader,
  PageHeader,
  KeyValue,
  Empty,
  ToneBadge,
} from "@/components/shared/primitives";
import { RoleBadge, PriorityBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "./shared";

export function InstructorTemplateDetail({ params }: { params: Record<string, string> }) {
  const id = params.id ?? "";
  const template = useResource(() => templateApi.detail(id), [id]);

  const [startOpen, setStartOpen] = React.useState(false);
  const [sessionName, setSessionName] = React.useState("");
  const [starting, setStarting] = React.useState(false);

  const data = template.data;

  const openStart = () => {
    setSessionName(data ? `Thực tập — ${data.name}` : "");
    setStartOpen(true);
  };

  const handleStart = () => {
    if (!data) return;
    setStarting(true);
    templateApi
      .start(data.id, { name: sessionName.trim() || undefined })
      .then((res) => {
        toast.success(
          res.deduped
            ? `Buổi thực tập đã tồn tại (${res.sessionCode}) — chuyển tới chi tiết`
            : `Đã tạo buổi thực tập ${res.sessionCode} từ mẫu này`
        );
        navigate(`/instructor/sessions/${res.sessionId}`);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Không tạo được buổi thực tập");
      })
      .finally(() => setStarting(false));
  };

  if (template.loading) {
    return (
      <ViewFrame>
        <LoadingBlock variant="detail" rows={6} />
      </ViewFrame>
    );
  }

  if (template.error || !data) {
    return (
      <ViewFrame>
        <ErrorBlock error={template.error ?? new Error("Không tìm thấy dự án mẫu")} onRetry={template.reload} />
      </ViewFrame>
    );
  }

  const blueprint = data.blueprint;

  return (
    <ViewFrame>
      <button
        type="button"
        onClick={() => navigate("/instructor/projects")}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5 icon" /> Về danh sách dự án mẫu
      </button>

      <PageHeader
        eyebrow={data.code}
        title={data.name}
        description={data.description}
        actions={
          <Button onClick={openStart} className="glow-brand rounded-lg">
            <Rocket className="icon" /> Bắt đầu buổi thực tập
          </Button>
        }
      />

      {/* hero meta chips */}
      <Panel className="mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KeyValue label="Danh mục">
            <span className="inline-flex items-center gap-1.5">
              <Tag className="size-3.5 icon text-faint" />
              {data.category}
            </span>
          </KeyValue>
          <KeyValue label="Độ khó">
            <DifficultyBadge difficulty={data.difficulty} />
          </KeyValue>
          <KeyValue label="Quy mô nhóm">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5 icon text-faint" />
              {data.teamSize.min}–{data.teamSize.max} người
            </span>
          </KeyValue>
          <KeyValue label="Số sprint">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="size-3.5 icon text-faint" />
              {data.sprintCount} sprint · {blueprint?.sprints.reduce((n, s) => n + s.tasks.length, 0) ?? 0} nhiệm vụ
            </span>
          </KeyValue>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
          {data.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-line bg-deep px-2 py-0.5 font-mono text-[10px] text-dim"
            >
              {tech}
            </span>
          ))}
          {data.roles.map((r) => (
            <RoleBadge key={r} role={r} />
          ))}
          <span className="ml-auto text-[11px] text-faint">
            Phiên bản {data.version} · tạo {formatDate(data.createdAt)}
          </span>
        </div>
      </Panel>

      {/* Tổng quan */}
      {blueprint?.overview ? (
        <Panel className="mb-6">
          <PanelHeader title="Tổng quan dự án" icon={<ListChecks className="size-4 icon" />} />
          <p className="px-5 py-4 text-sm leading-relaxed text-dim">{blueprint.overview}</p>
        </Panel>
      ) : null}

      {/* Vai trò trong nhóm */}
      {blueprint?.roleDetails?.length ? (
        <section className="mb-6">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-dim">
            Vai trò trong nhóm
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {blueprint.roleDetails.map((role) => (
              <Panel key={role.code} className="flex h-full flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <RoleBadge role={role.code} />
                  <span className="font-mono text-xs font-semibold text-dim">
                    {role.countMin}–{role.countMax} người
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink">{role.label}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {role.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-line bg-deep px-2 py-0.5 text-[10px] text-dim"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <ul className="mt-3 flex-1 space-y-1.5 border-t border-line pt-3">
                  {role.responsibilities.map((r) => (
                    <li key={r} className="flex gap-2 text-xs leading-relaxed text-dim">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 icon text-brand/70" />
                      {r}
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </section>
      ) : null}

      {/* Sprint trong blueprint */}
      {blueprint?.sprints?.length ? (
        <Panel className="mb-6">
          <PanelHeader
            title="Lộ trình sprint theo blueprint"
            description="Trình tự nhiệm vụ gợi ý cho từng sprint."
            icon={<Layers className="size-4 icon" />}
          />
          <Accordion type="multiple" defaultValue={[blueprint.sprints[0]?.code ?? "s0"]}>
            {blueprint.sprints.map((sprint) => (
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
                        key={task.title}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-deep/60 px-3 py-2"
                      >
                        <PriorityBadge priority={task.priority} />
                        <span className="min-w-0 flex-1 text-xs text-ink">{task.title}</span>
                        <span className="font-mono text-[10px] text-faint">{task.storyPoints} SP</span>
                        <RoleBadge role={task.role} />
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Panel>
      ) : null}

      {/* Cột mốc */}
      {blueprint?.milestones?.length ? (
        <Panel className="mb-6">
          <PanelHeader
            title="Cột mốc"
            description="Mốc thời gian tính theo số ngày kể từ khi khởi động buổi thực tập."
            icon={<CalendarDays className="size-4 icon" />}
          />
          <ol className="relative space-y-0 px-5 py-4">
            {blueprint.milestones.map((m, i) => (
              <li key={m.title} className="relative flex gap-4 pb-5 last:pb-0">
                {i < (blueprint.milestones?.length ?? 0) - 1 ? (
                  <span
                    className="absolute left-[11px] top-6 h-full w-px bg-gradient-to-b from-brand/40 to-line"
                    aria-hidden
                  />
                ) : null}
                <Circle className="relative z-10 mt-0.5 size-6 shrink-0 icon text-brand-bright" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{m.title}</p>
                  <p className="mt-0.5 text-[11px] text-faint">
                    Ngày thứ {m.dueOffsetDays} sau khi bắt đầu
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      ) : null}

      {/* Các buổi đã chạy từ mẫu này */}
      {data.runs?.length ? (
        <Panel className="mb-6">
          <PanelHeader
            title="Buổi thực tập đã dùng mẫu này"
            icon={<Rocket className="size-4 icon" />}
          />
          <ul className="divide-y divide-line">
            {data.runs.map((run) => (
              <li key={run.sessionId} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="min-w-0 truncate text-sm text-ink">{run.sessionName}</span>
                <span className="shrink-0 text-[11px] text-faint">Bắt đầu {formatDate(run.startedAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {/* CTA cuối */}
      {blueprint?.sprints?.length === 0 ? (
        <Panel>
          <Empty
            icon={<ListChecks />}
            title="Mẫu này chưa có blueprint sprint"
            description="Bạn vẫn có thể khởi động buổi thực tập và tự tạo kế hoạch thủ công."
            action={
              <Button onClick={openStart} className="rounded-lg">
                <Rocket className="icon" /> Bắt đầu buổi thực tập
              </Button>
            }
          />
        </Panel>
      ) : (
        <Panel className="relative overflow-hidden p-6">
          <div
            className="pointer-events-none absolute inset-0 grid-bg opacity-40"
            aria-hidden
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">Sẵn sàng khởi động?</h3>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-dim">
                Buổi thực tập sẽ được tạo ở trạng thái chuẩn bị. Sau đó mời sinh viên và sinh kế
                hoạch AI để hệ thống tự tạo sprint + nhiệm vụ từ blueprint này.
              </p>
            </div>
            <Button onClick={openStart} className="glow-brand rounded-lg">
              {starting ? <InlineSpinner /> : <Rocket className="icon" />}
              Bắt đầu buổi thực tập từ mẫu này
            </Button>
          </div>
        </Panel>
      )}

      <ConfirmDialog
        open={startOpen}
        onOpenChange={(open) => {
          if (!starting) setStartOpen(open);
        }}
        title="Bắt đầu buổi thực tập từ mẫu này"
        description={`Dự án "${data.name}" sẽ được tạo kèm buổi thực tập ở trạng thái chuẩn bị. Đặt tên buổi thực tập:`}
        confirmLabel={starting ? "Đang tạo…" : "Tạo buổi thực tập"}
        busy={starting}
        onConfirm={handleStart}
      >
        <div className="space-y-2">
          <label htmlFor="session-name" className="text-xs font-medium text-dim">
            Tên buổi thực tập
          </label>
          <Input
            id="session-name"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="VD: Thực tập Xuân 2026"
            className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
          />
        </div>
      </ConfirmDialog>
    </ViewFrame>
  );
}
