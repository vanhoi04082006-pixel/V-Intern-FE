"use client";

/**
 * Kỷ luật của tôi — route `#/intern/participation` (intern, cần đăng nhập).
 *
 * Tổng quan 4 chỉ số (tổng vi phạm / đang hiệu lực / điểm phạt / chính sách),
 * card giải thích quy tắc (lần nộp đầu tiên quyết định đúng hạn — 3 mốc
 * cảnh báo 24h → phạt 48h → thay người 72h dạng timeline ngang), danh sách
 * sự việc vi phạm (kind/status badge, hạn vs nộp, điểm trừ, công thức điểm)
 * và lịch sử nhận bàn giao phân công.
 */

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Bell,
  Gavel,
  History,
  RotateCcw,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  UserPlus,
} from "lucide-react";
import {
  participationApi,
  type MyReplacementHistoryItem,
  type ParticipationIncident,
} from "@/lib/client/api-org";
import { Link } from "@/lib/client/router";
import { useResource } from "@/lib/client/use-resource";
import { formatDateTime, relativeTime } from "@/lib/client/labels";
import { Stagger, StaggerItem, ViewFrame } from "@/components/shared/view";
import {
  Empty,
  MetricCard,
  PageHeader,
  Pager,
  Panel,
  PanelHeader,
  ToneBadge,
  UserAvatar,
} from "@/components/shared/primitives";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ==================== Nhãn & tone ==================== */

const KIND_META: Record<ParticipationIncident["kind"], { label: string; tone: "amber" | "rose" }> = {
  late: { label: "Trễ", tone: "amber" },
  missing: { label: "Mất", tone: "rose" },
};

const STATUS_META: Record<
  ParticipationIncident["status"],
  { label: string; tone: "rose" | "teal" | "zinc" }
> = {
  active: { label: "Đang hiệu lực", tone: "rose" },
  excused: { label: "Được miễn", tone: "teal" },
  reversed: { label: "Đã hoàn tác", tone: "zinc" },
};

/** 3 mốc quy trình kỷ luật (theo chính sách chuẩn ses_2025_01 v2). */
const RULE_STEPS = [
  {
    icon: Bell,
    tone: "amber" as const,
    mark: "24 giờ",
    title: "Cảnh báo",
    desc: "Quá hạn 24 giờ, bạn nhận cảnh báo đầu tiên — chưa trừ điểm, hãy nộp ngay.",
  },
  {
    icon: Gavel,
    tone: "orange" as const,
    mark: "48 giờ",
    title: "Trừ điểm",
    desc: "Quá hạn 48 giờ: trừ 5 điểm mỗi lần, tối đa 15 điểm trong phiên.",
  },
  {
    icon: UserPlus,
    tone: "rose" as const,
    mark: "72 giờ",
    title: "Thay thành viên",
    desc: "Quá hạn 72 giờ: phân công được xem xét bàn giao cho thành viên khác.",
  },
];

const INCIDENTS_PAGE_SIZE = 8;

/* ==================== Card quy tắc ==================== */

function RuleCard() {
  return (
    <Panel>
      <PanelHeader
        icon={<ScrollText className="size-4 icon" />}
        title="Quy tắc kỷ luật"
        description="Lần nộp đầu tiên quyết định tính đúng hạn — các mốc tính từ hạn chót của task."
      />
      <div className="px-5 py-5">
        <p className="text-xs leading-relaxed text-dim">
          Chỉ{" "}
          <span className="font-semibold text-ink">lần nộp đầu tiên</span> của bạn quyết định
          task đó đúng hạn hay không. Nộp lại sau lần đầu không xóa bỏ vi phạm đã ghi —
          hãy chắc chắn bản nộp đầu tiên hoàn thiện nhất có thể.
        </p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-0">
          {RULE_STEPS.map((step, i) => (
            <React.Fragment key={step.mark}>
              {i > 0 ? (
                <div className="flex items-center sm:mx-1" aria-hidden>
                  <span className="hidden h-px w-4 bg-line sm:block lg:w-8" />
                  <ArrowRight className="size-3.5 shrink-0 icon text-faint sm:hidden" />
                  <ArrowRight className="hidden size-3.5 shrink-0 icon text-faint sm:block" />
                </div>
              ) : null}
              <div
                className={cn(
                  "flex-1 rounded-xl border p-4",
                  step.tone === "amber" && "border-amber/25 bg-amber/[0.06]",
                  step.tone === "orange" && "border-orange/25 bg-orange/[0.06]",
                  step.tone === "rose" && "border-rose/25 bg-rose/[0.06]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg",
                      step.tone === "amber" && "bg-amber/10 text-amber",
                      step.tone === "orange" && "bg-orange/10 text-orange",
                      step.tone === "rose" && "bg-rose/10 text-rose"
                    )}
                  >
                    <step.icon className="size-4 icon" />
                  </span>
                  <ToneBadge tone={step.tone}>{step.mark}</ToneBadge>
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-dim">{step.desc}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ==================== Dòng sự việc vi phạm ==================== */

function IncidentRow({ inc }: { inc: ParticipationIncident }) {
  const kind = KIND_META[inc.kind];
  const status = STATUS_META[inc.status];
  const penaltyLabel =
    inc.latePenalty === 0
      ? `${inc.baseScore} = ${inc.score}`
      : `${inc.baseScore} − ${Math.abs(inc.latePenalty)} = ${inc.score}`;

  return (
    <StaggerItem className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-brand-bright">{inc.taskCode}</span>
            <span className="truncate text-sm font-semibold text-ink">{inc.taskTitle}</span>
          </div>
          <p className="mt-0.5 text-xs text-dim">{inc.sessionName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-dim">
              Hạn: <span className="text-ink">{formatDateTime(inc.dueAt)}</span>
            </span>
            {inc.submittedAt ? (
              <span className="text-dim">
                Nộp: <span className="text-ink">{formatDateTime(inc.submittedAt)}</span>
              </span>
            ) : (
              <span className="font-semibold text-rose">Chưa nộp</span>
            )}
            <span className="text-faint">Lần nộp thứ {inc.ordinal}</span>
          </div>
          {inc.status !== "active" && inc.resolveReason ? (
            <p className="mt-2 rounded-lg border border-line bg-deep/40 px-3 py-2 text-[11px] leading-relaxed text-dim">
              <span className="font-semibold text-ink">{inc.resolvedBy ?? "Giảng viên"}</span> —{" "}
              {inc.resolveReason}
              {inc.resolvedAt ? (
                <span className="text-faint"> ({relativeTime(inc.resolvedAt)})</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-1.5">
            <ToneBadge tone={kind.tone} dot>
              {kind.label}
            </ToneBadge>
            <ToneBadge tone={status.tone}>{status.label}</ToneBadge>
            <ToneBadge tone="rose">−{Math.abs(inc.points)} điểm</ToneBadge>
          </div>
          <p className="font-mono text-[11px] text-faint">
            Điểm: {penaltyLabel}{" "}
            <span className="font-semibold text-ink">điểm</span>
          </p>
        </div>
      </div>
    </StaggerItem>
  );
}

/* ==================== Dòng lịch sử nhận bàn giao ==================== */

function ReplacementRow({ item }: { item: MyReplacementHistoryItem }) {
  return (
    <StaggerItem className="px-5 py-4">
      <div className="flex items-start gap-3">
        <UserAvatar name={item.fromName} size={34} />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-ink">
            <span className="font-semibold">{item.fromName}</span>
            <span className="text-dim"> bàn giao cho </span>
            <span className="font-semibold">{item.toName}</span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-dim">{item.reason}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {item.transferredTaskCodes.map((code) => (
              <span
                key={code}
                className="rounded-md border border-line bg-panel-2 px-2 py-0.5 font-mono text-[11px] font-semibold text-dim"
              >
                {code}
              </span>
            ))}
            {item.preservedTaskCount > 0 ? (
              <span className="text-[11px] text-faint">
                + giữ nguyên {item.preservedTaskCount} task đã hoàn thành
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-faint">
            Bàn giao trong {item.handoverHours} giờ · bởi {item.createdBy} ·{" "}
            {relativeTime(item.at)}
          </p>
        </div>
      </div>
    </StaggerItem>
  );
}

/* ==================== View chính ==================== */

export function InternParticipationView() {
  const [incidentsPage, setIncidentsPage] = React.useState(1);

  const incidentsRes = useResource(
    () => participationApi.myIncidents({ page: incidentsPage, pageSize: INCIDENTS_PAGE_SIZE }),
    [incidentsPage]
  );
  const replacementsRes = useResource(() =>
    participationApi.myReplacements({ page: 1, pageSize: 10 })
  );

  const reloadAll = React.useCallback(() => {
    incidentsRes.reload();
    replacementsRes.reload();
  }, [incidentsRes, replacementsRes]);

  const summary = incidentsRes.data?.summary ?? null;
  const incidents = incidentsRes.data?.data ?? [];
  const incidentsMeta = incidentsRes.data?.meta;
  const replacements = replacementsRes.data?.data ?? [];
  const replacementsMeta = replacementsRes.data?.meta;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Kỷ luật của tôi"
        title="Kỷ luật & thời hạn nộp bài"
        description="Theo dõi các sự việc vi phạm thời hạn, điểm phạt đang ghi và lịch sử nhận bàn giao phân công."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={reloadAll}
            className="rounded-lg border-line bg-transparent text-dim hover:border-line-strong hover:bg-panel-2 hover:text-ink"
          >
            <RotateCcw className="size-3.5 icon" /> Làm mới
          </Button>
        }
      />

      {/* Tổng quan */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard
          label="Tổng vi phạm"
          value={summary ? summary.total : "—"}
          hint="Toàn bộ sự việc đã ghi nhận"
          icon={<AlertTriangle className="size-4 icon" />}
          tone="default"
        />
        <MetricCard
          label="Đang hiệu lực"
          value={summary ? summary.active : "—"}
          hint="Đang ảnh hưởng đến điểm của bạn"
          icon={<ShieldAlert className="size-4 icon" />}
          tone={summary && summary.active > 0 ? "rose" : "teal"}
        />
        <MetricCard
          label="Điểm phạt đã ghi"
          value={summary ? `−${summary.registeredPenalty}đ` : "—"}
          hint="Chỉ tính sự việc đang hiệu lực"
          icon={<TrendingDown className="size-4 icon" />}
          tone="orange"
        />
        <MetricCard
          label="Chính sách kỷ luật"
          value={
            summary ? (
              <span className={summary.policyActive ? "text-lg" : "text-lg text-dim"}>
                {summary.policyActive ? "Hoạt động" : "Không"}
              </span>
            ) : (
              "—"
            )
          }
          hint="Cảnh báo 24h · Phạt 48h · Thay 72h"
          icon={<ScrollText className="size-4 icon" />}
          tone={summary?.policyActive ? "brand" : "default"}
        />
      </div>

      <div className="mt-5">
        <RuleCard />
      </div>

      {/* Danh sách sự việc vi phạm */}
      <div className="mt-5">
        {incidentsRes.loading ? (
          <LoadingBlock rows={3} />
        ) : incidentsRes.error ? (
          <ErrorBlock error={incidentsRes.error} onRetry={incidentsRes.reload} />
        ) : incidents.length === 0 ? (
          <Panel>
            <PanelHeader
              icon={<ShieldCheck className="size-4 icon" />}
              title="Sự việc vi phạm"
              description="Mọi lần nộp trễ hoặc không nộp sẽ được ghi nhận tại đây."
            />
            <Empty
              icon={<ShieldCheck className="size-5 icon" />}
              title="Chưa có ghi nhận vi phạm — giữ nhịp này!"
              description="Tiếp tục nộp bài đúng hạn để giữ điểm kỷ luật hoàn hảo. Mentor AI có thể giúp bạn chia nhỏ task khi thấy nặng — đừng để tới phút chót."
              action={
                <Link
                  to="/intern/work"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.98]"
                >
                  Xem công việc của tôi <ArrowRight className="size-3.5 icon" />
                </Link>
              }
            />
          </Panel>
        ) : (
          <Panel>
            <PanelHeader
              icon={<AlertTriangle className="size-4 icon" />}
              title="Sự việc vi phạm"
              description="Mọi lần nộp trễ hoặc không nộp được ghi nhận kèm điểm phạt."
            />
            <Stagger className="divide-y divide-line" gap={0.05}>
              {incidents.map((inc) => (
                <IncidentRow key={inc.id} inc={inc} />
              ))}
            </Stagger>
            {incidentsMeta ? (
              <Pager
                page={incidentsMeta.page}
                totalPages={incidentsMeta.totalPages}
                total={incidentsMeta.total}
                onChange={setIncidentsPage}
              />
            ) : null}
          </Panel>
        )}
      </div>

      {/* Lịch sử nhận bàn giao */}
      <div className="mt-5">
        {replacementsRes.loading ? (
          <LoadingBlock rows={2} />
        ) : replacementsRes.error ? (
          <ErrorBlock error={replacementsRes.error} onRetry={replacementsRes.reload} />
        ) : replacements.length === 0 ? (
          <Panel>
            <PanelHeader
              icon={<History className="size-4 icon" />}
              title="Lịch sử nhận bàn giao"
              description="Phân công được chuyển từ thành viên khác sang bạn."
            />
            <Empty
              icon={<ArrowRightLeft className="size-5 icon" />}
              title="Chưa có lịch sử bàn giao"
              description="Khi có thành viên rời phiên, các phân công phù hợp có thể được bàn giao sang bạn — lịch sử sẽ xuất hiện tại đây."
            />
          </Panel>
        ) : (
          <Panel>
            <PanelHeader
              icon={<History className="size-4 icon" />}
              title="Lịch sử nhận bàn giao"
              description="Phân công được chuyển từ thành viên khác sang bạn."
            />
            <Stagger className="divide-y divide-line" gap={0.05}>
              {replacements.map((item) => (
                <ReplacementRow key={item.id} item={item} />
              ))}
            </Stagger>
            {replacementsMeta && replacementsMeta.totalPages > 1 ? (
              <p className="border-t border-line px-5 py-3 text-xs text-faint">
                Hiển thị {replacements.length}/{replacementsMeta.total} bản ghi.
              </p>
            ) : null}
          </Panel>
        )}
      </div>
    </ViewFrame>
  );
}
