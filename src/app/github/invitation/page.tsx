"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { SessionRepositoryCard } from "@/components/product/github-connection";
import { Logo } from "@/components/v-intern/logo";
import { LoadingState } from "@/components/shared/data-state";
function Invitation() {
  const session = useSearchParams().get("session");
  return (
    <WorkspaceGuard allowedRoles={["intern", "instructor", "admin"]}>
      <main className="mx-auto min-h-dvh max-w-3xl px-5 py-8 sm:py-12">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-slate-900">
          Lời mời cộng tác dự án
        </h1>
        <p className="mb-7 mt-2 text-sm leading-6 text-slate-600">
          Kiểm tra đúng tài khoản GitHub đã liên kết trước khi mở lời mời. Sau
          khi chấp nhận trên GitHub, quay lại kiểm tra quyền truy cập.
        </p>
        {session &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          session,
        ) ? (
          <SessionRepositoryCard sessionId={session} />
        ) : (
          <p role="alert">
            Liên kết thiếu mã phiên hợp lệ. Mở mục GitHub trong không gian làm
            việc hoặc liên hệ giảng viên.
          </p>
        )}
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-blue-700 hover:underline"
        >
          Về V-Intern
        </Link>
      </main>
    </WorkspaceGuard>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Invitation />
    </Suspense>
  );
}
