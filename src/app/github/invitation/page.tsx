"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { SessionRepositoryCard } from "@/components/product/github-connection";
import { Logo } from "@/components/v-intern/logo";
import { LoadingState } from "@/components/shared/data-state";
import { Tape } from "@/components/v-intern/doodles";
import { MarginNote } from "@/components/workspace/notebook";
import "@/components/auth/support.css";
function Invitation() {
  const session = useSearchParams().get("session");
  return (
    <WorkspaceGuard allowedRoles={["intern", "instructor", "admin"]}>
      <div className="app-surface support-invitation"><main>
        <Logo />
        <h1 className="mt-8 text-page font-semibold tracking-tight text-foreground">
          Lời mời <span className="marker">cộng tác dự án</span>
        </h1>
        <p className="mb-4 mt-2 text-body leading-6 text-muted-foreground">
          Kiểm tra đúng tài khoản GitHub đã liên kết trước khi mở lời mời. Sau
          khi chấp nhận trên GitHub, quay lại kiểm tra quyền truy cập.
        </p>
        <MarginNote className="mb-7">
          kiểm tra kỹ tên tài khoản GitHub rồi hẵng bấm chấp nhận nhé ✎
        </MarginNote>
        {session &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          session,
        ) ? (
          <div className="relative">
            <Tape className="-top-3 left-1/2 ml-[-48px]" rotate={-3} />
            <SessionRepositoryCard sessionId={session} />
          </div>
        ) : (
          <p
            role="alert"
            className="dashed-cut rounded-xl p-4 text-body leading-6 text-foreground"
          >
            Liên kết thiếu mã phiên hợp lệ. Mở mục GitHub trong không gian làm
            việc hoặc liên hệ giảng viên.
          </p>
        )}
        <Link
          href="/"
          className="mt-6 inline-block text-body text-primary hover:underline"
        >
          Về V-Intern
        </Link>
      </main></div>
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
