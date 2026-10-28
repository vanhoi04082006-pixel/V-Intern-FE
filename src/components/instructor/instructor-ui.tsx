"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

export function InstructorHeading({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <WorkspacePageHeader
      title={title}
      description={description}
      action={action}
      back={
        back ? (
          <Link href={back.href}>
            <ArrowLeft size={15} aria-hidden="true" />
            {back.label}
          </Link>
        ) : undefined
      }
    />
  );
}
export function InstructorNotice({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="ins-notice">
      <Info size={18} aria-hidden="true" />
      <div>
        {title && <strong>{title}</strong>}
        <p>{children}</p>
      </div>
    </div>
  );
}
export function InstructorSectionNav({
  items,
}: {
  items: { id: string; label: string; count?: number }[];
}) {
  return (
    <nav className="ins-section-nav" aria-label="Các phần trong phiên">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={() => {
            const disclosure = document.getElementById(item.id)?.querySelector("details");
            if (disclosure) disclosure.open = true;
          }}
          aria-label={`Đến phần ${item.label}${item.count !== undefined ? ` (${item.count})` : ""}`}
        >
          {item.label}
          {item.count !== undefined && <span>{item.count}</span>}
        </a>
      ))}
    </nav>
  );
}
export function instructorDate(value: string | null | undefined) {
  if (!value) return "Chưa đặt";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", { timeZone: "UTC" }).format(date);
}
export const instructorSessionStatus = (status: string) =>
  (
    ({
      upcoming: "Sắp diễn ra",
      recruiting: "Đang tuyển",
      active: "Đang chạy",
      paused: "Tạm dừng",
      completed: "Đã hoàn thành",
      ending: "Sắp kết thúc",
      cancelled: "Đã hủy",
      archived: "Đã lưu trữ",
      draft: "Bản nháp",
    }) as Record<string, string>
  )[status] ?? status;
export const instructorPlanStatus = (status: string) =>
  (
    ({
      draft: "Bản nháp",
      queued: "Đang chờ xử lý",
      generating: "AI đang lập kế hoạch",
      ready: "Chờ giảng viên duyệt",
      generated: "Chờ giảng viên duyệt",
      proposed: "Chờ giảng viên duyệt",
      confirmed: "Đã xác nhận",
      published: "Đã phát hành",
      failed: "Cần thử lại",
      archived: "Đã lưu trữ",
      rejected: "Đã từ chối",
    }) as Record<string, string>
  )[status] ?? status;
