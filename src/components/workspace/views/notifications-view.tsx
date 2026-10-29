"use client";

/**
 * Thông báo — dùng chung mọi vai trò. Đọc/đánh dấu đã đọc, tuỳ chọn danh mục.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchNotifications,
  fetchNotificationPreferences,
  markAllNotificationsRead,
  markNotificationRead,
  setNotificationPreference,
} from "@/lib/api/insight";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  general: "Chung",
  evaluation: "Đánh giá",
  deadline: "Hạn chót",
  kpi: "KPI",
  salary: "Lương ảo",
  certificate: "Chứng nhận",
  recruitment: "Tuyển dụng",
  session: "Phiên thực tập",
  task: "Nhiệm vụ",
};

export function NotificationsView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [onlyUnread, setOnlyUnread] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications", onlyUnread],
    queryFn: ({ signal }) => fetchNotifications({ unread: onlyUnread }, signal),
  });

  const { data: prefs } = useQuery({
    queryKey: ["notification-prefs"],
    queryFn: ({ signal }) => fetchNotificationPreferences(signal),
  });

  const readOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const readAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast({ title: "Đã đánh dấu tất cả là đã đọc ✦" });
    },
    onError: (e) => toast({ title: "Chưa xử lý được", description: errorMessage(e), variant: "destructive" }),
  });

  const togglePref = useMutation({
    mutationFn: ({ category, enabled }: { category: string; enabled: boolean }) =>
      setNotificationPreference(category, enabled),
    onError: (e) => toast({ title: "Lưu tuỳ chọn thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông báo"
        description="Mọi cập nhật quan trọng của hành trình thực tập — đánh giá mới, hạn chót, KPI, chứng nhận…"
        actions={
          <>
            <Button
              variant={onlyUnread ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyUnread((v) => !v)}
              className="gap-2"
            >
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
              {onlyUnread ? "Đang lọc: chưa đọc" : "Chỉ hiện chưa đọc"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={readAll.isPending}
              onClick={() => readAll.mutate()}
              className="gap-2"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Đọc tất cả
            </Button>
          </>
        }
      />

      {prefs && Object.keys(prefs).length > 0 ? (
        <SectionCard title="Nhận thông báo theo chủ đề" description="Bật/tắt từng nhóm thông báo.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(prefs).map(([category, enabled]) => (
              <label
                key={category}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-dashed border-ink/15 bg-paper px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-blue/50"
              >
                {CATEGORY_LABELS[category] ?? category}
                <Switch
                  checked={enabled}
                  onCheckedChange={(v) => togglePref.mutate({ category, enabled: v })}
                  aria-label={`Bật thông báo ${CATEGORY_LABELS[category] ?? category}`}
                />
              </label>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {isLoading ? (
        <LoadingState label="Đang tải thông báo…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title={onlyUnread ? "Không có thông báo chưa đọc" : "Chưa có thông báo nào"}
          description="Khi có đánh giá mới, hạn chót hay cập nhật KPI, mọi thứ sẽ hiện ở đây."
        />
      ) : (
        <ul className="space-y-3">
          {data.data.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-2xl border-2 p-4 transition-colors",
                n.read
                  ? "border-ink/10 bg-paper-raised"
                  : "border-blue/40 bg-blue-mist/50 shadow-[3px_3px_0_0_rgba(32,96,240,0.15)]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-ink/20 bg-paper px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">
                      {CATEGORY_LABELS[n.category] ?? n.category}
                    </span>
                    {!n.read ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue">
                        <Bell className="h-3 w-3" aria-hidden="true" /> mới
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm font-extrabold text-ink">{n.title}</p>
                  {n.body ? <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{n.body}</p> : null}
                  <p className="mt-1.5 font-mono text-[11px] text-ink-faint">{fmtDateTime(n.createdAt)}</p>
                </div>
                {!n.read ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={readOne.isPending}
                    onClick={() => readOne.mutate(n.id)}
                    className="shrink-0"
                  >
                    Đánh dấu đã đọc
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
