"use client";

/**
 * Bảng điều khiển quản trị — số liệu tổng quan + hoạt động gần đây +
 * các lối tắt tới khu vực hay dùng nhất.
 */

import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CalendarClock,
  ClipboardCheck,
  ListTodo,
  Target,
  Users,
  Users2,
} from "lucide-react";
import { fetchAdminDashboard } from "@/lib/api/insight";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import { useAppStore } from "@/lib/store";
import {
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  type Column,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";

const QUICK_LINKS: { section: string; label: string; icon: typeof Users }[] = [
  { section: "users", label: "Người dùng", icon: Users },
  { section: "rounds", label: "Đợt tuyển dụng", icon: CalendarClock },
  { section: "kpi", label: "Kỳ KPI", icon: Target },
  { section: "certificates", label: "Chứng nhận", icon: Award },
];

interface AuditRow {
  id: string;
  action: string;
  actorName: string;
  createdAt: string | null;
}

export function AdminDashboardView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: ({ signal }) => fetchAdminDashboard(signal),
  });

  const auditRows: AuditRow[] = (data?.recentAudit ?? []).map((a) => ({
    id: a.id,
    action: a.action,
    actorName: a.actorName ?? "—",
    createdAt: a.createdAt,
  }));

  const columns: Column<AuditRow>[] = [
    {
      key: "action",
      header: "Hành động",
      render: (r) => <span className="font-mono text-[12px] font-semibold text-ink">{r.action}</span>,
    },
    { key: "actor", header: "Người thực hiện", render: (r) => <span className="font-medium">{r.actorName}</span> },
    {
      key: "createdAt",
      header: "Thời gian",
      render: (r) => <span className="text-[13px] text-ink-soft">{fmtDateTime(r.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan quản trị"
        description="Toàn cảnh hệ thống: người dùng, phiên thực tập, nhiệm vụ và các đánh giá đang chờ xử lý."
      />

      {isLoading ? (
        <LoadingState label="Đang tải số liệu tổng quan…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Người dùng" value={data.totalUsers} hint="Tổng tài khoản đã đăng ký" icon={Users} tone="blue" />
            <StatCard label="Phiên đang hoạt động" value={data.activeSessions} hint="Phiên thực tập đang mở" icon={Users2} tone="ink" />
            <StatCard label="Nhiệm vụ mở" value={data.openTasks} hint="Nhiệm vụ chưa hoàn thành" icon={ListTodo} tone="amber" />
            <StatCard label="Đánh giá chờ" value={data.pendingEvaluations} hint="Cần giảng viên xử lý" icon={ClipboardCheck} tone="rose" />
          </div>

          <SectionCard
            title="Lối tắt nhanh"
            description="Nhảy thẳng tới các khu vực quản trị hay dùng."
          >
            <div className="flex flex-wrap gap-2">
              {QUICK_LINKS.map(({ section, label, icon: Icon }) => (
                <Button
                  key={section}
                  variant="outline"
                  className="h-11 gap-2 rounded-xl border-2 border-ink/20 bg-raised px-4 font-bold text-ink hover:border-blue/50 hover:text-blue"
                  onClick={() => useAppStore.getState().goSection(section)}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Hoạt động gần đây"
            description="Các thao tác mới nhất được ghi nhận trong nhật ký hệ thống."
          >
            <ListTable
              columns={columns}
              rows={auditRows}
              rowKey={(r) => r.id}
              emptyTitle="Chưa có hoạt động nào"
              emptyDescription="Nhật ký hệ thống đang trống — mọi thao tác quản trị sẽ hiện ở đây."
            />
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
