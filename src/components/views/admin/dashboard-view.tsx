"use client";

import {
  ArrowRight,
  Award,
  BrainCircuit,
  FolderKanban,
  GraduationCap,
  ListChecks,
  Presentation,
  Server,
  Users,
} from "lucide-react";
import { Link } from "@/lib/client/router";
import { adminApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { relativeTime } from "@/lib/client/labels";
import {
  MetricCard,
  PageHeader,
  Panel,
  PanelHeader,
  StatusDot,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { ViewFrame } from "@/components/shared/view";
import {
  ActionBadge,
  actionIcon,
} from "./admin-shared";

const quickLinks = [
  { to: "/admin/users", label: "Người dùng", description: "Tài khoản, vai trò, trạng thái", icon: Users },
  { to: "/admin/questions", label: "Ngân hàng câu hỏi", description: "Câu hỏi phỏng vấn AI", icon: ListChecks },
  { to: "/admin/ai", label: "Cấu hình AI", description: "Mô hình, timeout, retry", icon: BrainCircuit },
  { to: "/admin/services", label: "Dịch vụ", description: "Trạng thái hệ thống", icon: Server },
];

export function AdminDashboardView() {
  const { data, loading, error, reload } = useResource(() => adminApi.dashboard(), []);

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Bảng điều khiển"
        description="Tổng quan toàn bộ nền tảng V-Intern: người dùng, phiên thực tập, ngân hàng câu hỏi và tình trạng dịch vụ."
      />

      {loading ? (
        <LoadingBlock variant="cards" rows={6} className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" />
      ) : error ? (
        <ErrorBlock error={error} onRetry={reload} />
      ) : data ? (
        <div className="space-y-6">
          {/* Hàng số liệu */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="Người dùng" value={data.counts.users} hint={`${data.counts.interns} thực tập sinh`} icon={<Users className="icon" />} tone="brand" />
            <MetricCard label="Thực tập sinh" value={data.counts.interns} hint={`${data.counts.instructors} giảng viên`} icon={<GraduationCap className="icon" />} tone="teal" />
            <MetricCard label="Phiên đang chạy" value={data.counts.activeSessions} hint={`trên ${data.counts.sessions} phiên`} icon={<Presentation className="icon" />} tone="amber" />
            <MetricCard label="Dự án mẫu" value={data.counts.templates} hint="sẵn sàng khởi tạo" icon={<FolderKanban className="icon" />} tone="orange" />
            <MetricCard label="Câu hỏi" value={data.counts.questions} hint="đang hoạt động" icon={<ListChecks className="icon" />} tone="rose" />
            <MetricCard label="Chứng chỉ" value={data.counts.certificates} hint="đã cấp" icon={<Award className="icon" />} tone="default" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Hoạt động gần đây */}
            <Panel className="lg:col-span-2">
              <PanelHeader
                title="Hoạt động gần đây"
                description="8 sự kiện mới nhất trên toàn nền tảng"
                icon={<ListChecks className="icon" />}
              />
              <ul className="divide-y divide-line">
                {data.recentActivity.map((event) => {
                  const Icon = actionIcon(event.action);
                  return (
                    <li key={event.id} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-panel-2/60">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-panel-2 text-dim [&_svg]:size-4">
                        <Icon className="icon" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-ink">{event.actorName}</span>
                          <ActionBadge action={event.action} />
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-dim">{event.summary}</p>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-[11px] text-faint">
                        {relativeTime(event.at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <div className="space-y-6">
              {/* Trạng thái hệ thống */}
              <Panel className="p-5">
                <div className="flex items-center gap-3">
                  <StatusDot tone="emerald" pulse className="size-2.5" />
                  <div>
                    <p className="text-sm font-semibold text-ink">Hệ thống hoạt động bình thường</p>
                    <p className="mt-0.5 text-xs text-dim">Tất cả dịch vụ chính đang online.</p>
                  </div>
                </div>
                <Link
                  to="/admin/services"
                  className="group mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-bright transition-colors hover:text-brand"
                >
                  Xem trạng thái dịch vụ
                  <ArrowRight className="size-3.5 icon transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Panel>

              {/* Liên kết nhanh */}
              <Panel>
                <PanelHeader title="Liên kết nhanh" />
                <ul className="divide-y divide-line">
                  {quickLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-panel-2/60"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand-bright [&_svg]:size-4">
                          <link.icon className="icon" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-ink">{link.label}</span>
                          <span className="block truncate text-xs text-dim">{link.description}</span>
                        </span>
                        <ArrowRight className="size-4 icon shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      ) : null}
    </ViewFrame>
  );
}
