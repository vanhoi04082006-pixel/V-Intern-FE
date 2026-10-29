"use client";

/**
 * Trạng thái hệ thống — số liệu vận hành (người dùng, phiên, câu hỏi…),
 * tình trạng dịch vụ và thời gian hoạt động, tự làm mới mỗi 15 giây.
 */

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bot,
  FileQuestion,
  FolderKanban,
  Github,
  ListChecks,
  Users2,
  Users,
} from "lucide-react";
import { fetchSystemStatus } from "@/lib/api/admin";
import { fetchHealth } from "@/lib/api/insight";
import { errorMessage } from "@/lib/api/transport";
import {
  ErrorState,
  KeyVal,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/shared/kit";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const REFRESH_MS = 15_000;

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  parts.push(`${secs} giây`);
  return parts.join(" ");
}

function HealthPill({ label, value }: { label: string; value: string }) {
  const ok = value === "up" || value === "ok" || value === "healthy" || value === "connected";
  const unknown = value === "unknown" || value === "";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        ok
          ? "border-emerald-400/50 bg-emerald-50 text-emerald-700"
          : unknown
            ? "border-ink/20 bg-ink/5 text-ink-faint"
            : "border-rose-300 bg-rose-50 text-rose-600",
      )}
    >
      {label}: {value === "" ? "—" : value}
    </span>
  );
}

export function AdminSystemView() {
  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["admin-system-status"],
    queryFn: ({ signal }) => fetchSystemStatus(signal),
    refetchInterval: REFRESH_MS,
  });

  const {
    data: health,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["admin-health"],
    queryFn: ({ signal }) => fetchHealth(signal),
    refetchInterval: REFRESH_MS,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trạng thái hệ thống"
        description={`Số liệu vận hành realtime — tự làm mới mỗi ${REFRESH_MS / 1000} giây.`}
      />

      {statusLoading ? (
        <LoadingState label="Đang tải số liệu hệ thống…" />
      ) : statusError ? (
        <ErrorState message={errorMessage(statusError)} onRetry={() => void refetchStatus()} />
      ) : status ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Người dùng" value={status.userCount} hint="Tổng tài khoản" icon={Users} tone="blue" />
          <StatCard label="Phiên thực tập" value={status.sessionCount} hint="Tổng phiên đã tạo" icon={Users2} tone="ink" />
          <StatCard label="Câu hỏi" value={status.questionCount} hint="Ngân hàng câu hỏi" icon={FileQuestion} tone="amber" />
          <StatCard label="Mẫu đồ án" value={status.templateCount} hint="Đồ án mẫu khả dụng" icon={FolderKanban} tone="ink" />
          <StatCard label="Lượt AI 24h" value={status.aiRunsLast24h} hint="Lần chạy AI trong 24 giờ" icon={Bot} tone="green" />
          <StatCard
            label="GitHub"
            value={status.githubConfigured ? "Đã cấu hình ✓" : "Chưa cấu hình ✗"}
            hint="Tài khoản GitHub của hệ thống"
            icon={Github}
            tone={status.githubConfigured ? "green" : "rose"}
          />
        </div>
      ) : null}

      <SectionCard
        title="Tình trạng dịch vụ"
        description="Kết quả health check từ máy chủ."
        actions={
          health ? (
            <Badge className="gap-1.5 rounded-full border-2 border-emerald-400/50 bg-emerald-50 font-bold uppercase text-emerald-700">
              <Activity className="h-3 w-3" aria-hidden="true" />
              {health.status}
            </Badge>
          ) : null
        }
      >
        {healthLoading ? (
          <LoadingState label="Đang kiểm tra tình trạng…" />
        ) : healthError ? (
          <ErrorState message={errorMessage(healthError)} onRetry={() => void refetchHealth()} />
        ) : health ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <HealthPill label="Database" value={health.database} />
              <HealthPill label="AI" value={health.ai} />
            </div>
            <div className="space-y-1.5 rounded-xl border-2 border-dashed border-ink/15 bg-paper px-4 py-3">
              <KeyVal label="Trạng thái">
                <span className="font-bold text-ink">{health.status}</span>
              </KeyVal>
              <KeyVal label="Database">
                <span className="font-mono text-[13px]">{health.database}</span>
              </KeyVal>
              <KeyVal label="AI">
                <span className="font-mono text-[13px]">{health.ai}</span>
              </KeyVal>
              <KeyVal label="Thời gian hoạt động">
                <ListChecks className="mr-1 inline h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                <span className="font-bold">{formatUptime(health.uptimeSeconds)}</span>
                <span className="ml-2 font-mono text-[12px] text-ink-faint">({health.uptimeSeconds.toLocaleString("vi-VN")} giây)</span>
              </KeyVal>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
