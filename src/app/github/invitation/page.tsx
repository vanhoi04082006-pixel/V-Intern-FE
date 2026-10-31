"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { SessionRepositoryCard } from "@/components/product/github-connection";
import { Logo } from "@/components/v-intern/logo";
import { LoadingState } from "@/components/shared/data-state";
import { btn } from "@/components/product/primitives";
import { IconCircleHelp } from "@/components/v-intern/icons";
import { PaperclipDoodle, Tape } from "@/components/v-intern/doodles";
import { MarginNote } from "@/components/workspace/notebook";
import "@/components/auth/support.css";

const INVITATION_STEPS = [
  "Kiểm tra tài khoản GitHub hiển thị bên dưới là đúng tài khoản đã liên kết.",
  "Mở lời mời và chọn “Accept” trên GitHub.",
  "Quay lại đây để kiểm tra quyền truy cập kho mã.",
];

function Invitation() {
  const session = useSearchParams().get("session");
  return (
    <WorkspaceGuard allowedRoles={["intern", "instructor", "admin"]}>
      <div className="app-surface support-invitation">
        <main>
          <Logo />
          <h1 className="mt-8 text-page font-semibold tracking-tight text-foreground">
            Lời mời <span className="marker">cộng tác dự án</span>
          </h1>
          <p className="mb-5 mt-2 text-body leading-6 text-muted-foreground">
            Ba nhịp như lật một trang sổ: kiểm tra, chấp nhận, quay lại xác
            nhận.
          </p>
          {/* Các bước — sợi chỉ nét đứt nối các dấu mực đánh số */}
          <ol className="relative mb-6 ml-3 list-none border-l-2 border-dashed border-primary/45 pl-6">
            {INVITATION_STEPS.map((step, i) => (
              <li key={step} className="relative pb-4 last:pb-0">
                <span
                  aria-hidden="true"
                  className={
                    i === 0
                      ? "absolute -left-[39px] top-0 grid size-7 place-items-center rounded-full border border-primary bg-primary text-caption font-bold text-primary-foreground ring-4 ring-primary/15"
                      : "absolute -left-[39px] top-0 grid size-7 place-items-center rounded-full border border-primary/50 bg-card text-caption font-bold text-primary"
                  }
                >
                  {i + 1}
                </span>
                <p className="text-body leading-6 text-foreground">{step}</p>
              </li>
            ))}
          </ol>
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
            <div
              role="alert"
              className="dashed-cut relative rounded-xl bg-raised p-5"
            >
              <PaperclipDoodle className="pointer-events-none absolute -right-2 -top-4 h-9 w-5 text-ink/30" />
              <div className="flex items-start gap-3">
                <IconCircleHelp
                  className="mt-0.5 size-5 shrink-0 text-destructive"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    Thiếu mã phiên hợp lệ
                  </p>
                  <p className="mt-1 text-body leading-6 text-muted-foreground">
                    Liên kết không kèm mã phiên hoặc mã đã hết hạn. Hãy mở lại
                    từ mục GitHub trong không gian làm việc, hoặc liên hệ
                    giảng viên để nhận lời mời mới.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className={btn("secondary")}>
              Về trang chính
            </Link>
          </div>
        </main>
      </div>
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
