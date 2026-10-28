"use client";

import type { CSSProperties } from "react";

/** Nhãn tiếng Việt + formatter dùng chung toàn app. */

export const taskStatusLabels: Record<string, string> = {
  todo: "Cần làm",
  doing: "Đang làm",
  review: "Chờ duyệt",
  done: "Hoàn thành",
};

export const taskStatusTones: Record<string, string> = {
  todo: "zinc",
  doing: "teal",
  review: "amber",
  done: "emerald",
};

export const priorityLabels: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

export const priorityTones: Record<string, string> = {
  low: "zinc",
  medium: "teal",
  high: "orange",
  critical: "rose",
};

export const roleLabels: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Full-stack",
  qa: "QA / Tester",
  business_analyst: "Business Analyst",
  intern: "Thực tập sinh",
  instructor: "Giảng viên",
  admin: "Quản trị viên",
};

export const sessionStatusLabels: Record<string, string> = {
  planning: "Đang chuẩn bị",
  active: "Đang diễn ra",
  completed: "Đã kết thúc",
  cancelled: "Đã hủy",
};

export const submissionStatusLabels: Record<string, string> = {
  submitted: "Đã nộp",
  approved: "Đã duyệt",
  rework: "Cần làm lại",
  withdrawn: "Đã rút",
};

export const reviewStatusLabels: Record<string, string> = {
  running: "AI đang review",
  awaiting_instructor: "Chờ giảng viên",
  needs_changes: "Cần chỉnh sửa",
  passed: "Đạt",
};

export const evaluationStatusLabels: Record<string, string> = {
  draft: "Bản nháp",
  submitted: "Đã nộp",
  finalized: "Đã chốt",
};

export const recruitmentStatusLabels: Record<string, string> = {
  not_started: "Chưa bắt đầu",
  role_selected: "Đã chọn vai trò",
  interview_in_progress: "Đang phỏng vấn",
  evaluation_pending: "Chờ đánh giá",
  passed: "Đã trúng tuyển",
  failed: "Chưa đạt",
};

export const notificationCategoryLabels: Record<string, string> = {
  task: "Công việc",
  session: "Buổi thực tập",
  evaluation: "Đánh giá",
  kpi: "KPI",
  salary: "Lương ảo",
  certificate: "Chứng chỉ",
  announcement: "Thông báo chung",
  system: "Hệ thống",
  recruitment: "Tuyển dụng",
};

export const workspaceStatusCopy: Record<string, { title: string; desc: string }> = {
  recruitment_required: {
    title: "Hoàn tất phỏng vấn AI để bắt đầu",
    desc: "Bạn cần chọn vai trò và hoàn thành buổi phỏng vấn AI trước khi nhận dự án.",
  },
  recruitment_in_progress: {
    title: "Buổi phỏng vấn đang diễn ra",
    desc: "Tiếp tục buổi phỏng vấn AI để hoàn tất hồ sơ tuyển dụng.",
  },
  recruitment_failed: {
    title: "Chưa đạt vòng phỏng vấn",
    desc: "Bạn có thể thử lại khi đủ điều kiện. Xem kết quả chi tiết bên dưới.",
  },
  unassigned: {
    title: "Bạn đã trúng tuyển!",
    desc: "Hồ sơ của bạn đang chờ giảng viên phân vào dự án phù hợp.",
  },
  active: { title: "", desc: "" },
};

/* ---------------- formatters ---------------- */

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatVnd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(digits)}%`;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return formatDate(iso);
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const AVATAR_HUES = [158, 172, 45, 28, 330, 262, 190, 12];

export function avatarStyleOf(name: string): CSSProperties {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const hue = AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
  return {
    background: `linear-gradient(135deg, hsl(${hue} 45% 22%), hsl(${hue} 52% 32%))`,
    color: `hsl(${hue} 70% 82%)`,
  };
}

export function shortSha(sha: string | null | undefined): string {
  if (!sha) return "—";
  return sha.slice(0, 7);
}
