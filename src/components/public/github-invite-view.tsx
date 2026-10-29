"use client";

/**
 * Trang thông báo sau OAuth GitHub callback + mời repository phiên.
 * BE redirect về FE với #/github-invite kèm trạng thái.
 */

import { ArrowLeft, CheckCircle2, Github, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/logo";
import { FadeIn } from "@/components/landing/reveal";
import { useAppStore } from "@/lib/store";

export function GitHubInviteView() {
  const navigate = useAppStore((s) => s.navigate);
  const goApp = () => {
    const { user } = useAppStore.getState();
    if (user) useAppStore.getState().goSection("github");
    else navigate("auth");
  };

  // BE callback thường đính kèm ?error=... hoặc &connected=1
  const hadError =
    typeof window !== "undefined" &&
    (window.location.search.includes("error=") || window.location.hash.includes("error="));

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 font-sans text-ink">
      <FadeIn className="w-full max-w-md">
        <div className="sketch-card p-8 text-center">
          <div className="tape -top-3 left-1/2 z-20 -translate-x-1/2" />
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-ink bg-ink text-white">
            <Github className="h-7 w-7" aria-hidden="true" />
          </span>
          {hadError ? (
            <>
              <XCircle className="mx-auto mt-5 h-10 w-10 text-rose-500" aria-hidden="true" />
              <h1 className="mt-3 text-xl font-extrabold">Kết nối GitHub chưa thành công</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                GitHub từ chối hoặc hủy yêu cầu cấp quyền. Bạn thử kết nối lại
                trong phần GitHub của workspace nhé.
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="mx-auto mt-5 h-10 w-10 text-emerald-500" aria-hidden="true" />
              <h1 className="mt-3 text-xl font-extrabold">GitHub đã sẵn sàng!</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Kết nối tài khoản thành công. Lời mời repository của phiên thực
                tập sẽ xuất hiện trong email GitHub của bạn — chấp nhận để bắt
                đầu nộp bài qua Pull Request.
              </p>
            </>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={goApp}
              className="h-12 rounded-xl border-2 border-ink bg-royal px-6 font-bold text-white shadow-[4px_4px_0_0_var(--ink)]"
            >
              Vào workspace của tôi
            </Button>
            <Button variant="outline" onClick={() => navigate("landing")} className="h-11">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" /> Về trang chủ
            </Button>
          </div>
          <p className="mt-6 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-ink-faint">
            <Logo className="mx-auto text-sm" />
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
