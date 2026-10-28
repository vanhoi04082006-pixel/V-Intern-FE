"use client";

import { Cpu, Database, Github, Server } from "lucide-react";
import { adminApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import {
  PageHeader,
  Panel,
  PanelHeader,
  StatusDot,
  ToneBadge,
} from "@/components/shared/primitives";
import { AnimatedNumber } from "@/components/shared/counters";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { ViewFrame } from "@/components/shared/view";

function serviceTone(status: string): "emerald" | "amber" | "rose" {
  if (status === "healthy") return "emerald";
  if (status === "degraded") return "amber";
  return "rose";
}

function serviceLabel(status: string): string {
  if (status === "healthy") return "Ổn định";
  if (status === "degraded") return "Giảm hiệu năng";
  return "Sự cố";
}

export function AdminServicesView() {
  const { data, loading, error, reload } = useResource(() => adminApi.systemStatus(), []);

  const degraded = data?.services.filter((s) => s.status !== "healthy") ?? [];
  const allHealthy = data ? degraded.length === 0 : false;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Dịch vụ hệ thống"
        description="Trạng thái thời gian thực của các dịch vụ nền tảng V-Intern và các tích hợp phụ thuộc."
      />

      {loading ? (
        <LoadingBlock variant="detail" rows={6} />
      ) : error ? (
        <ErrorBlock error={error} onRetry={reload} />
      ) : data ? (
        <div className="space-y-6">
          {/* Trạng thái tổng */}
          <div className="card-surface glow-brand flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <StatusDot tone={allHealthy ? "emerald" : "amber"} pulse className="size-3.5" />
              <div>
                <p className="text-lg font-bold tracking-tight text-ink">
                  {allHealthy
                    ? "Tất cả dịch vụ hoạt động bình thường"
                    : `${degraded.length} dịch vụ đang giảm hiệu năng`}
                </p>
                <p className="mt-0.5 text-sm text-dim">
                  {allHealthy
                    ? "Không có sự cố nào được ghi nhận trong 24 giờ qua."
                    : "Hệ thống vẫn phục vụ được — theo dõi các dịch vụ màu amber bên dưới."}
                </p>
              </div>
            </div>
            <ToneBadge tone={allHealthy ? "emerald" : "amber"} dot>
              {allHealthy ? "operational" : "degraded"}
            </ToneBadge>
          </div>

          {/* Danh sách dịch vụ */}
          <Panel>
            <PanelHeader
              title="Dịch vụ chính"
              description="Độ trễ phản hồi trung bình gần nhất"
              icon={<Server className="icon" />}
            />
            <ul className="divide-y divide-line">
              {data.services.map((service) => (
                <li key={service.name} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-panel-2/60">
                  <StatusDot tone={serviceTone(service.status)} pulse={service.status !== "healthy"} />
                  <span className="min-w-0 flex-1 text-sm font-medium text-ink">{service.name}</span>
                  <ToneBadge tone={serviceTone(service.status)}>{serviceLabel(service.status)}</ToneBadge>
                  <span className="w-20 text-right font-mono text-xs text-dim">{service.latencyMs} ms</span>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Lưới phụ thuộc */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Panel className="p-5">
              <div className="flex items-center gap-2 text-dim">
                <Database className="size-4 icon" />
                <span className="text-xs font-medium uppercase tracking-wide text-faint">Cơ sở dữ liệu</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <StatusDot tone={data.database.connected ? "emerald" : "rose"} pulse />
                <span className="text-sm font-semibold text-ink">
                  {data.database.connected ? "Đã kết nối" : "Mất kết nối"}
                </span>
              </div>
              <p className="mt-1.5 font-mono text-xs text-dim">{data.database.latencyMs} ms độ trễ</p>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center gap-2 text-dim">
                <Github className="size-4 icon" />
                <span className="text-xs font-medium uppercase tracking-wide text-faint">Tích hợp GitHub</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <StatusDot tone={data.githubIntegration.configured ? "emerald" : "amber"} pulse />
                <span className="text-sm font-semibold text-ink">
                  {data.githubIntegration.configured ? "Đã cấu hình" : "Chưa cấu hình"}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-dim">
                Webhook:{" "}
                <span className={data.githubIntegration.webhookHealthy ? "text-emerald-300" : "text-amber"}>
                  {data.githubIntegration.webhookHealthy ? "hoạt động" : "cần kiểm tra"}
                </span>
              </p>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center gap-2 text-dim">
                <Cpu className="size-4 icon" />
                <span className="text-xs font-medium uppercase tracking-wide text-faint">Lượt chạy AI / 24h</span>
              </div>
              <p className="mt-3 font-mono text-3xl font-bold leading-none tracking-tight text-ink">
                <AnimatedNumber value={data.aiRunsLast24h} />
              </p>
              <p className="mt-1.5 text-xs text-dim">phỏng vấn · code review · mentor chat</p>
            </Panel>

            <Panel className={`p-5 ${data.learningAlerts > 0 ? "border-amber/30" : ""}`}>
              <div className="flex items-center gap-2 text-dim">
                <StatusDot tone={data.learningAlerts > 0 ? "amber" : "emerald"} pulse={data.learningAlerts > 0} />
                <span className="text-xs font-medium uppercase tracking-wide text-faint">Cảnh báo học tập</span>
              </div>
              <p
                className={`mt-3 font-mono text-3xl font-bold leading-none tracking-tight ${
                  data.learningAlerts > 0 ? "text-amber" : "text-ink"
                }`}
              >
                <AnimatedNumber value={data.learningAlerts} />
              </p>
              <p className="mt-1.5 text-xs text-dim">
                {data.learningAlerts > 0 ? "thực tập sinh cần can thiệp" : "không có cảnh báo"}
              </p>
            </Panel>
          </div>

          {/* Số liệu tổng */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Người dùng", value: data.counts.users },
              { label: "Phiên thực tập", value: data.counts.sessions },
              { label: "Task", value: data.counts.tasks },
              { label: "Bài nộp", value: data.counts.submissions },
            ].map((item) => (
              <div key={item.label} className="card-surface p-4">
                <p className="text-xs font-medium text-dim">{item.label}</p>
                <p className="mt-2 font-mono text-2xl font-bold leading-none text-ink">
                  <AnimatedNumber value={item.value} />
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </ViewFrame>
  );
}
