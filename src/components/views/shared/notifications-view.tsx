"use client";

import * as React from "react";
import {
  Award,
  Bell,
  Bot,
  CheckCheck,
  ChevronRight,
  ClipboardCheck,
  KanbanSquare,
  Megaphone,
  Presentation,
  Server,
  Settings2,
  Target,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { navigate } from "@/lib/client/router";
import { notificationApi, type AppNotification } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { notificationCategoryLabels, relativeTime } from "@/lib/client/labels";
import { ViewFrame } from "@/components/shared/view";
import {
  Empty,
  PageHeader,
  Panel,
  PanelHeader,
  Pager,
} from "@/components/shared/primitives";
import { ErrorBlock, InlineSpinner, LoadingBlock } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 8;

/* Icon + màu theo nhóm thông báo */
const CATEGORY_META: Record<string, { icon: React.ElementType; chip: string }> = {
  task: { icon: KanbanSquare, chip: "bg-teal/10 text-teal" },
  session: { icon: Presentation, chip: "bg-brand/10 text-brand-bright" },
  evaluation: { icon: ClipboardCheck, chip: "bg-amber/10 text-amber" },
  kpi: { icon: Target, chip: "bg-orange/10 text-orange" },
  salary: { icon: Wallet, chip: "bg-emerald-500/10 text-emerald-300" },
  certificate: { icon: Award, chip: "bg-brand/12 text-brand-bright" },
  announcement: { icon: Megaphone, chip: "bg-zinc-500/10 text-zinc-300" },
  system: { icon: Server, chip: "bg-zinc-500/10 text-zinc-300" },
  recruitment: { icon: Bot, chip: "bg-orange/10 text-orange" },
};

function CategoryIcon({
  category,
  compact,
  className,
}: {
  category: string;
  compact?: boolean;
  className?: string;
}) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.system;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl",
        compact ? "size-8" : "size-9",
        meta.chip,
        className
      )}
    >
      <Icon className={cn("icon", compact ? "size-4" : "size-[18px]")} />
    </span>
  );
}

/* ==================== Trang thông báo (dùng chung 3 role) ==================== */

export function NotificationsView() {
  const [tab, setTab] = React.useState<"all" | "unread">("all");
  const [page, setPage] = React.useState(1);

  const list = useResource(
    () =>
      notificationApi.list({
        page,
        pageSize: PAGE_SIZE,
        unread: tab === "unread" ? true : undefined,
      }),
    [page, tab]
  );

  const prefs = useResource(() => notificationApi.preferences());
  const [markingAll, setMarkingAll] = React.useState(false);

  const items = list.data?.data ?? [];
  const meta = list.data?.meta;

  const openItem = (n: AppNotification) => {
    if (!n.read) {
      list.setData((prev) =>
        prev
          ? { ...prev, data: prev.data.map((x) => (x.id === n.id ? { ...x, read: true } : x)) }
          : prev
      );
      notificationApi.markRead(n.id).catch(() => {
        /* cập nhật im lặng, reload tab sẽ đồng bộ lại */
      });
    }
    const target = n.link?.replace(/^#/, "");
    if (target && target.startsWith("/")) navigate(target);
  };

  const readAll = async () => {
    setMarkingAll(true);
    try {
      const res = await notificationApi.markAllRead();
      toast.success(
        res.updated > 0
          ? `Đã đánh dấu ${res.updated} thông báo là đã đọc`
          : "Không có thông báo chưa đọc"
      );
      list.reload();
    } catch {
      toast.error("Không thể cập nhật thông báo");
    } finally {
      setMarkingAll(false);
    }
  };

  const onTogglePref = async (category: string, enabled: boolean) => {
    const prev = prefs.data;
    prefs.setData((p) =>
      p ? p.map((x) => (x.category === category ? { ...x, enabled } : x)) : p
    );
    try {
      const next = await notificationApi.updatePreference(category, enabled);
      prefs.setData(next);
    } catch {
      if (prev) prefs.setData(prev);
      toast.error("Không lưu được cài đặt nhận thông báo");
    }
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Tài khoản"
        title="Thông báo"
        description="Mọi cập nhật về công việc, đánh giá, KPI và hệ thống — thông báo mới nhất lên đầu."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={readAll}
            disabled={markingAll}
          >
            {markingAll ? (
              <InlineSpinner className="size-3.5" />
            ) : (
              <CheckCheck className="size-3.5 icon" />
            )}
            Đọc tất cả
          </Button>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v === "unread" ? "unread" : "all");
          setPage(1);
        }}
      >
        <TabsList className="border border-line bg-panel">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="unread">
            Chưa đọc
            {!list.loading && tab === "unread" && meta ? (
              <span className="ml-1 font-mono text-[10px] text-faint">{meta.total}</span>
            ) : null}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {list.loading ? (
          <LoadingBlock rows={5} />
        ) : list.error ? (
          <ErrorBlock error={list.error} onRetry={list.reload} />
        ) : items.length === 0 ? (
          <div className="card-surface">
            <Empty
              icon={<Bell />}
              title={tab === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo nào"}
              description={
                tab === "unread"
                  ? "Bạn đã đọc hết mọi thông báo. Thông báo mới sẽ xuất hiện tại đây."
                  : "Thông báo về công việc, đánh giá và hệ thống sẽ xuất hiện tại đây."
              }
              action={
                tab === "unread" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                    onClick={() => setTab("all")}
                  >
                    Xem tất cả thông báo
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="card-surface overflow-hidden">
            <div className="divide-y divide-line">
              {items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openItem(n)}
                  className={cn(
                    "flex w-full items-start gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-panel-2/70 md:px-5",
                    !n.read && "bg-brand/[0.04]"
                  )}
                >
                  <CategoryIcon category={n.category} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "truncate text-[13px]",
                          n.read ? "font-medium text-dim" : "font-semibold text-ink"
                        )}
                      >
                        {n.title}
                      </span>
                      {!n.read ? (
                        <span
                          className="mt-0.5 size-1.5 shrink-0 rounded-full bg-brand shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          aria-label="Chưa đọc"
                        />
                      ) : null}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-dim">
                      {n.content}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-faint">
                      <span className="font-medium">
                        {notificationCategoryLabels[n.category] ?? n.category}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{relativeTime(n.createdAt)}</span>
                      {n.link ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="font-medium text-brand-bright/80">Xem chi tiết</span>
                        </>
                      ) : null}
                    </span>
                  </span>
                  <ChevronRight className="mt-2.5 size-4 shrink-0 icon text-faint" />
                </button>
              ))}
            </div>
            <Pager
              page={page}
              totalPages={meta?.totalPages ?? 1}
              total={meta?.total}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Cài đặt nhận thông báo */}
      <Panel className="mt-6">
        <PanelHeader
          icon={<Settings2 />}
          title="Cài đặt nhận thông báo"
          description="Bật/tắt từng nhóm sự kiện — thay đổi được lưu ngay."
        />
        {prefs.loading ? (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        ) : prefs.error ? (
          <div className="p-5">
            <ErrorBlock error={prefs.error} onRetry={prefs.reload} />
          </div>
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {(prefs.data ?? []).map((pref) => (
              <label
                key={pref.category}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-deep/40 px-3.5 py-3 transition-colors hover:border-line-strong"
              >
                <CategoryIcon category={pref.category} compact />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-ink">
                    {notificationCategoryLabels[pref.category] ?? pref.category}
                  </span>
                  <span className="block text-[11px] text-faint">
                    {pref.enabled ? "Đang nhận" : "Đang tắt"}
                  </span>
                </span>
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={(checked) => onTogglePref(pref.category, checked)}
                  aria-label={`Nhận thông báo ${
                    notificationCategoryLabels[pref.category] ?? pref.category
                  }`}
                />
              </label>
            ))}
          </div>
        )}
        <p className="border-t border-line px-5 py-3.5 text-[11px] leading-relaxed text-faint">
          Thông báo quan trọng từ hệ thống (bảo trì, bảo mật) vẫn có thể được gửi kể cả khi bạn tắt
          nhóm tương ứng.
        </p>
      </Panel>
    </ViewFrame>
  );
}
