"use client";

import { PageTransition } from "@/components/animate-ui/components/page-transition";
import type { ReactNode } from "react";

/**
 * v6 — chuyển trang toàn app bằng View Transitions API (animate-ui).
 * Lớp fade nhẹ 0.3s cho enter / 0.15s cho exit, tự tắt khi người dùng
 * bật giảm chuyển động; trình duyệt chưa hỗ trợ thì đổi trang tức thì.
 *
 * Các template cũ của v5 (admin/instructor/intern dùng `.nb-swap`) đã
 * về pass-through để không bị chồng 2 lớp fade trên cùng một lần điều hướng.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition effect="fade">{children}</PageTransition>;
}
