"use client";

import * as React from "react";
import {
  BadgeCheck,
  Check,
  Github,
  GitCommitHorizontal,
  GitPullRequest,
  Info,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import { githubApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { ViewFrame } from "@/components/shared/view";
import { PageHeader, Panel, StatusDot, ToneBadge } from "@/components/shared/primitives";
import { ErrorBlock, InlineSpinner, LoadingBlock } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { Button } from "@/components/ui/button";

const BENEFITS: { icon: React.ReactNode; chip: string; title: string; desc: string }[] = [
  {
    icon: <GitPullRequest className="size-[18px] icon" />,
    chip: "bg-teal/10 text-teal",
    title: "Nộp bài bằng pull request",
    desc: "Mỗi nhiệm vụ hoàn thành được nộp qua PR — AI review 6 tiêu chí gắn thẳng vào pull request của bạn.",
  },
  {
    icon: <GitCommitHorizontal className="size-[18px] icon" />,
    chip: "bg-brand/10 text-brand-bright",
    title: "Tiến độ từ commit thật",
    desc: "Commit và push của bạn cập nhật tiến độ nhiệm vụ tự nhiên — giống như đi làm thật.",
  },
  {
    icon: <BadgeCheck className="size-[18px] icon" />,
    chip: "bg-amber/10 text-amber",
    title: "Hồ sơ GitHub đẹp hơn",
    desc: "Lịch sử PR đã duyệt trở thành bằng chứng kinh nghiệm thực tế khi đi xin việc.",
  },
];

/** Trang kết nối GitHub — dùng chung intern + instructor. */
export function GithubView() {
  const res = useResource(() => githubApi.me());
  const status = res.data;

  const [connecting, setConnecting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [disconnecting, setDisconnecting] = React.useState(false);

  const connect = async () => {
    setConnecting(true);
    try {
      await githubApi.connect();
      toast.success("Hoàn tất uỷ quyền (demo)", {
        description: "Đã kết nối GitHub với tài khoản V-Intern của bạn.",
      });
      res.reload();
    } catch {
      toast.error("Không kết nối được GitHub. Vui lòng thử lại.");
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await githubApi.disconnect();
      toast.success("Đã ngắt kết nối GitHub");
      setConfirmOpen(false);
      res.reload();
    } catch {
      toast.error("Không ngắt kết nối được. Vui lòng thử lại.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Tài khoản"
        title="GitHub"
        description="Kết nối tài khoản GitHub để nộp bài bằng pull request và nhận AI code review."
      />

      {res.loading ? (
        <LoadingBlock variant="detail" rows={4} />
      ) : res.error ? (
        <ErrorBlock error={res.error} onRetry={res.reload} />
      ) : status?.connected ? (
        /* ===== Đã kết nối ===== */
        <div className="mx-auto max-w-xl rounded-3xl bg-gradient-to-br from-brand/40 via-teal/20 to-transparent p-[1px]">
          <div className="noise relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-panel p-6 md:p-8">
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand/12 text-brand-bright">
                  <Github className="size-6 icon" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Đã kết nối GitHub</p>
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-dim">
                    <StatusDot tone="emerald" />
                    {status.login ?? "github-demo"}
                  </p>
                </div>
              </div>
              <ToneBadge tone="emerald" dot>
                Đang hoạt động
              </ToneBadge>
            </div>

            <div className="relative mt-6 grid gap-2.5 sm:grid-cols-2">
              <span className="flex items-center gap-2 rounded-xl border border-line bg-deep/50 px-3.5 py-2.5 text-xs text-dim">
                <Check className="size-3.5 shrink-0 icon text-brand-bright" />
                {status.canCreatePublicRepo
                  ? "Được phép tạo repo công khai"
                  : "Chế độ chỉ đọc"}
              </span>
              <span className="flex items-center gap-2 rounded-xl border border-line bg-deep/50 px-3.5 py-2.5 text-xs text-dim">
                <Check className="size-3.5 shrink-0 icon text-brand-bright" />
                AI review gắn vào pull request
              </span>
            </div>

            <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <p className="max-w-xs text-xs leading-relaxed text-faint">
                Ngắt kết nối sẽ dừng đồng bộ pull request. Lịch sử bài nộp đã lưu vẫn được giữ
                nguyên.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-lg border-rose/30 bg-transparent text-rose hover:bg-rose/10 hover:text-rose"
                onClick={() => setConfirmOpen(true)}
              >
                <Unplug className="size-3.5 icon" />
                Ngắt kết nối
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ===== Chưa kết nối ===== */
        <div className="mx-auto max-w-xl">
          <Panel className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center">
              <span className="glow-brand grid size-14 place-items-center rounded-2xl bg-brand/12 text-brand-bright">
                <Github className="size-7 icon" />
              </span>
              <h2 className="mt-5 text-lg font-bold tracking-tight text-ink">
                Kết nối GitHub với V-Intern
              </h2>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-dim">
                Nộp bài bằng pull request thật và để AI review code của bạn ngay trên repo.
              </p>
            </div>

            <ul className="mt-7 space-y-3.5">
              {BENEFITS.map((benefit) => (
                <li
                  key={benefit.title}
                  className="flex items-start gap-3.5 rounded-xl border border-line bg-deep/40 p-4"
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ${benefit.chip}`}
                  >
                    {benefit.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{benefit.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-dim">{benefit.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-7">
              <Button
                className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-on-brand hover:bg-brand-bright"
                onClick={connect}
                disabled={connecting}
              >
                {connecting ? (
                  <InlineSpinner className="size-4" />
                ) : (
                  <Github className="size-4 icon" />
                )}
                {connecting ? "Đang uỷ quyền…" : "Kết nối GitHub"}
              </Button>
              <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-faint">
                <Info className="mt-0.5 size-3 shrink-0 icon" />
                Bản demo mô phỏng OAuth — nhấn kết nối sẽ dùng tài khoản GitHub giả lập, không
                chuyển tới github.com.
              </p>
            </div>
          </Panel>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Ngắt kết nối GitHub?"
        description="V-Intern sẽ dừng đồng bộ pull request và commit từ tài khoản GitHub này. Bạn có thể kết nối lại bất cứ lúc nào."
        confirmLabel="Ngắt kết nối"
        destructive
        busy={disconnecting}
        onConfirm={disconnect}
      />
    </ViewFrame>
  );
}
