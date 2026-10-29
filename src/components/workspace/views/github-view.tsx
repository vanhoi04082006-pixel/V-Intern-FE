"use client";

/**
 * GitHub cá nhân — kết nối OAuth, trạng thái, ngắt kết nối.
 * Admin thấy thêm phần tài khoản repository dùng chung.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Github, Link2, Loader2, Unlink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import { hasAnyPermission } from "@/lib/auth/session";
import { disconnectGitHub, fetchMyGitHub, startGitHubConnect } from "@/lib/api/insight";
import { fetchRepositoryAccount, selectRepositoryAccount } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import { KeyVal, LoadingState, PageHeader, SectionCard, StatusBadge } from "@/components/shared/kit";
import { Button } from "@/components/ui/button";

export function GitHubView() {
  const { toast } = useToast();
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: me, isLoading, error, refetch } = useQuery({
    queryKey: ["github-me"],
    queryFn: ({ signal }) => fetchMyGitHub(signal),
  });

  const isAdminRepo = hasAnyPermission(user, ["settings.read"]);
  const { data: repoAccount } = useQuery({
    queryKey: ["github-repository-account"],
    queryFn: ({ signal }) => fetchRepositoryAccount(signal),
    enabled: isAdminRepo,
  });

  const connect = useMutation({
    mutationFn: async () => {
      const { authorizeUrl } = await startGitHubConnect();
      window.location.href = authorizeUrl;
    },
    onError: (e) => toast({ title: "Không bắt đầu được kết nối", description: errorMessage(e), variant: "destructive" }),
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectGitHub(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["github-me"] });
      toast({ title: "Đã ngắt kết nối GitHub" });
    },
    onError: (e) => toast({ title: "Chưa ngắt được", description: errorMessage(e), variant: "destructive" }),
  });

  const selectAccount = useMutation({
    mutationFn: () => selectRepositoryAccount(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["github-repository-account"] });
      toast({ title: "Đã chọn tài khoản làm chủ repository ✦" });
    },
    onError: (e) => toast({ title: "Chưa chọn được", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="GitHub"
        description="Kết nối tài khoản GitHub cá nhân để nhận lời mời repository của phiên thực tập và nộp bài bằng Pull Request."
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <SectionCard>
          <p className="text-sm text-rose-600">{errorMessage(error)}</p>
        </SectionCard>
      ) : me?.connected ? (
        <SectionCard>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-ink bg-ink text-white">
                <Github className="h-7 w-7" aria-hidden="true" />
              </span>
              <div>
                <p className="flex items-center gap-2 text-base font-extrabold text-ink">
                  {me.login ?? "đã kết nối"}
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" aria-hidden="true" />
                </p>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  Sẵn sàng nhận lời mời repository và nộp bài qua PR.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              disabled={disconnect.isPending}
              onClick={() => disconnect.mutate()}
              className="gap-2 border-rose-300 text-rose-600 hover:bg-rose-50"
            >
              {disconnect.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Unlink className="h-4 w-4" aria-hidden="true" />}
              Ngắt kết nối
            </Button>
          </div>
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-ink/25 bg-paper text-ink-faint">
              <Github className="h-8 w-8" aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-extrabold text-ink">Chưa kết nối GitHub</p>
              <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-ink-soft">
                Kết nối để nhận lời mời repository phiên thực tập, nộp bài bằng
                Pull Request và để AI review code của bạn.
              </p>
            </div>
            <Button
              disabled={connect.isPending}
              onClick={() => connect.mutate()}
              className="h-12 gap-2 rounded-xl border-2 border-ink bg-ink px-6 font-bold text-paper shadow-[4px_4px_0_0_var(--blue)]"
            >
              {connect.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
              Kết nối GitHub
              <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
            </Button>
          </div>
        </SectionCard>
      )}

      {isAdminRepo ? (
        <SectionCard
          title="Tài khoản repository dùng chung"
          description="Admin chọn một tài khoản GitHub đã kết nối để làm chủ repository của các phiên thực tập."
          actions={
            repoAccount?.connected && !repoAccount.selected ? (
              <Button size="sm" disabled={selectAccount.isPending} onClick={() => selectAccount.mutate()}>
                Chọn làm chủ repository
              </Button>
            ) : undefined
          }
        >
          {repoAccount ? (
            <div className="space-y-2">
              <KeyVal label="Trạng thái">
                <StatusBadge status={repoAccount.selected ? "active" : "pending"} />
              </KeyVal>
              <KeyVal label="Tài khoản">{repoAccount.login ?? "—"}</KeyVal>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Đang tải…</p>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}
