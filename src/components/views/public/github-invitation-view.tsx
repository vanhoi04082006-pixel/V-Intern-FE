"use client";

/**
 * Lời mời GitHub (public) — route `#/github/invitation?session=<id phiên>`.
 *
 * Xem repository của phiên + trạng thái lời mời GitHub từng thành viên +
 * activity feed (Pager 5/trang). Nút "Kiểm tra quyền GitHub của tôi" gọi
 * accountApi.githubReconcile (pending → accepted, provisioning → ready).
 * Chưa đăng nhập vẫn xem được trang; bấm reconcile → toast nhắc đăng nhập + link.
 *
 * Lưu ý hợp đồng API: GET /sessions/:id/github yêu cầu đăng nhập — client http
 * tự chuyển về /login khi nhận 401, nên khi chưa có token view KHÔNG gọi API
 * mà hiển thị cổng đăng nhập.
 */

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  GitPullRequest,
  Loader2,
  LogIn,
  RefreshCw,
  SearchX,
  ShieldQuestion,
  Users,
} from "lucide-react";
import { Link, useRoute } from "@/lib/client/router";
import { useSession } from "@/lib/client/session";
import { accountApi, type GithubInvitationState } from "@/lib/client/api-org";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { formatDateTime, relativeTime, shortSha } from "@/lib/client/labels";
import { Stagger, StaggerItem } from "@/components/shared/view";
import {
  Empty,
  Pager,
  Panel,
  PanelHeader,
  StatusDot,
  ToneBadge,
  UserAvatar,
} from "@/components/shared/primitives";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/* ==================== Nhãn & tone ==================== */

const REPO_STATUS_META: Record<
  GithubInvitationState["repository"]["status"],
  { label: string; dotClass: string; tone: "brand" | "amber" | "rose" }
> = {
  ready: {
    label: "Sẵn sàng",
    dotClass: "bg-brand shadow-[0_0_8px_var(--brand-glow)]",
    tone: "brand",
  },
  provisioning: { label: "Đang khởi tạo", dotClass: "", tone: "amber" },
  failed: { label: "Thất bại", dotClass: "", tone: "rose" },
};

const WEBHOOK_META: Record<
  GithubInvitationState["repository"]["webhookStatus"],
  { label: string; tone: "emerald" | "amber" | "rose" }
> = {
  healthy: { label: "Webhook hoạt động", tone: "emerald" },
  pending: { label: "Webhook chờ kích hoạt", tone: "amber" },
  failed: { label: "Webhook lỗi", tone: "rose" },
};

const MEMBER_STATUS_META: Record<
  GithubInvitationState["members"][number]["status"],
  { label: string; tone: "brand" | "amber" | "rose" | "zinc" }
> = {
  accepted: { label: "Đã tham gia", tone: "brand" },
  pending: { label: "Chờ chấp nhận", tone: "amber" },
  expired: { label: "Hết hạn", tone: "rose" },
  failed: { label: "Lỗi", tone: "rose" },
  not_connected: { label: "Chưa kết nối", tone: "zinc" },
};

const ACTIVITY_PAGE_SIZE = 5;

/* ==================== Cổng đăng nhập (chưa có token) ==================== */

function LoginGate({ sessionId }: { sessionId: string }) {
  const next = encodeURIComponent(`/github/invitation?session=${sessionId}`);
  return (
    <Panel className="overflow-hidden">
      <div className="relative flex flex-col items-center px-6 py-12 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-brand/[0.08] to-transparent"
          aria-hidden
        />
        <span className="glow-brand relative mb-5 grid size-14 place-items-center rounded-2xl border border-brand/25 bg-brand/10 text-brand-bright">
          <LogIn className="size-6 icon" />
        </span>
        <h2 className="relative text-lg font-bold tracking-tight text-ink">
          Đăng nhập để xem trạng thái lời mời
        </h2>
        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-dim">
          Trang này hiển thị repository và quyền GitHub của phiên thực tập. Hãy đăng nhập
          bằng tài khoản V-Intern để đối soát quyền của bạn.
        </p>
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button
            variant="outline"
            onClick={() =>
              toast.info("Đăng nhập để thực hiện", {
                description:
                  "Kiểm tra quyền GitHub cần đăng nhập bằng tài khoản V-Intern của bạn.",
              })
            }
            className="rounded-lg border-line bg-transparent text-dim hover:border-line-strong hover:bg-panel-2 hover:text-ink"
          >
            <RefreshCw className="size-4 icon" /> Kiểm tra quyền GitHub của tôi
          </Button>
          <Link
            to={`/login?next=${next}`}
            className="glow-brand inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.98]"
          >
            Đăng nhập <ArrowRight className="size-4 icon" />
          </Link>
        </div>
      </div>
    </Panel>
  );
}

/* ==================== Thành viên ==================== */

function MembersPanel({
  state,
  onReconcile,
  reconcileBusy,
}: {
  state: GithubInvitationState;
  onReconcile: () => void;
  reconcileBusy: boolean;
}) {
  const stats = state.stats;
  const miniStats = [
    { label: "Lời mời", value: stats.total, cls: "text-ink" },
    { label: "Đã tham gia", value: stats.accepted, cls: "text-teal" },
    { label: "Chờ chấp nhận", value: stats.pending, cls: "text-amber" },
    { label: "Chưa kết nối", value: stats.notConnected, cls: "text-faint" },
  ];

  return (
    <Panel>
      <PanelHeader
        icon={<Users className="size-4 icon" />}
        title="Lời mời GitHub của thành viên"
        description="Trạng thái từng lời mời collaborator đối chiếu với repository."
      />
      <div className="grid grid-cols-2 gap-3 px-5 pt-4 sm:grid-cols-4">
        {miniStats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-deep/40 px-3.5 py-3">
            <p className={`font-mono text-xl font-bold leading-none ${s.cls}`}>{s.value}</p>
            <p className="mt-1.5 text-[11px] text-faint">{s.label}</p>
          </div>
        ))}
      </div>
      {state.members.length === 0 ? (
        <Empty
          icon={<Users className="size-5 icon" />}
          title="Chưa có thành viên nào được mời"
          description="Lời mời collaborator sẽ xuất hiện tại đây khi giảng viên thêm thành viên vào phiên."
        />
      ) : (
        <Stagger className="divide-y divide-line px-5 py-4" gap={0.04}>
          {state.members.map((m) => {
            const meta = MEMBER_STATUS_META[m.status] ?? { label: m.status, tone: "zinc" as const };
            return (
              <StaggerItem key={m.userId} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar name={m.name} size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                    <p className="text-[11px] text-faint">Mời lúc {formatDateTime(m.invitedAt)}</p>
                  </div>
                </div>
                <ToneBadge tone={meta.tone} dot>
                  {meta.label}
                </ToneBadge>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-deep/40 px-5 py-4">
        <p className="max-w-md text-xs leading-relaxed text-dim">
          Đối soát lại quyền GitHub — lời mời "Chờ chấp nhận" sẽ chuyển thành
          "Đã tham gia" sau lần kiểm tra.
        </p>
        <Button
          size="sm"
          onClick={onReconcile}
          disabled={reconcileBusy}
          className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright active:scale-[0.98]"
        >
          {reconcileBusy ? (
            <Loader2 className="size-3.5 animate-spin icon" />
          ) : (
            <RefreshCw className="size-3.5 icon" />
          )}
          Kiểm tra quyền GitHub của tôi
        </Button>
      </div>
    </Panel>
  );
}

/* ==================== Activity feed ==================== */

function ActivityPanel({ sessionId }: { sessionId: string }) {
  const [page, setPage] = React.useState(1);
  const res = useResource(
    () => accountApi.githubActivity(sessionId, { page, pageSize: ACTIVITY_PAGE_SIZE }),
    [sessionId, page]
  );
  const rows = res.data?.data ?? [];
  const meta = res.data?.meta;

  return (
    <Panel>
      <PanelHeader
        icon={<GitPullRequest className="size-4 icon" />}
        title="Hoạt động repository"
        description="Pull request, commit và nhận xét gần nhất trên repository của phiên."
      />
      {res.loading ? (
        <div className="px-5 py-4">
          <LoadingBlock rows={ACTIVITY_PAGE_SIZE} className="border-0 shadow-none" />
        </div>
      ) : res.error ? (
        <div className="px-5 py-4">
          <ErrorBlock error={res.error} onRetry={res.reload} className="border-0 shadow-none" />
        </div>
      ) : rows.length === 0 ? (
        <Empty
          icon={<GitPullRequest className="size-5 icon" />}
          title="Chưa có hoạt động nào"
          description="Hoạt động pull request và commit sẽ xuất hiện khi thành viên bắt đầu làm việc."
        />
      ) : (
        <>
          <Stagger className="divide-y divide-line px-5" gap={0.04}>
            {rows.map((a) => (
              <StaggerItem key={a.id} className="flex items-start gap-3 py-3.5">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-panel-2 text-dim">
                  {a.pr ? (
                    <GitPullRequest className="size-3.5 icon" />
                  ) : (
                    <GitBranch className="size-3.5 icon" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{a.action}</p>
                  {a.pr ? (
                    <p className="mt-0.5 truncate font-mono text-[11px] text-brand-bright">
                      {a.pr}
                    </p>
                  ) : null}
                  <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-faint">
                    {a.branch ? <span className="font-mono">{a.branch}</span> : null}
                    <span className="font-mono">{shortSha(a.headSha)}</span>
                    <span>· {a.actor}</span>
                    <span>· {relativeTime(a.at)}</span>
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          {meta ? (
            <Pager
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onChange={setPage}
            />
          ) : null}
        </>
      )}
    </Panel>
  );
}

/* ==================== Nội dung chính (đã đăng nhập) ==================== */

function InvitationContent({ sessionId }: { sessionId: string }) {
  const res = useResource(() => accountApi.github(sessionId), [sessionId]);
  const [reconcileBusy, setReconcileBusy] = React.useState(false);

  const reconcile = async () => {
    if (reconcileBusy) return;
    setReconcileBusy(true);
    try {
      const out = await accountApi.githubReconcile(sessionId);
      toast.success("Đã cập nhật quyền", {
        description:
          out.updated > 0
            ? `${out.updated} mục được đồng bộ — lời mời đang chờ đã chuyển thành đã tham gia.`
            : "Không có thay đổi mới — mọi quyền đã được đồng bộ.",
      });
      res.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kiểm tra quyền thất bại.");
    } finally {
      setReconcileBusy(false);
    }
  };

  if (res.loading) {
    return (
      <div className="space-y-5">
        <LoadingBlock variant="detail" rows={2} />
        <LoadingBlock rows={4} />
      </div>
    );
  }

  if (res.error) {
    if (res.error instanceof ApiError && res.error.status === 403) {
      return (
        <Panel>
          <Empty
            icon={<ShieldQuestion className="size-5 icon" />}
            title="Trang này dành cho giảng viên và quản trị viên"
            description="Chi tiết repository và quyền GitHub của phiên chỉ hiển thị với tài khoản phụ trách phiên. Hãy đăng nhập bằng tài khoản thích hợp để xem."
            action={
              <Link
                to={`/login?next=${encodeURIComponent(`/github/invitation?session=${sessionId}`)}`}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.98]"
              >
                Đăng nhập tài khoản khác <ArrowRight className="size-3.5 icon" />
              </Link>
            }
          />
        </Panel>
      );
    }
    if (res.error instanceof ApiError && res.error.status === 404) {
      return (
        <Panel>
          <Empty
            icon={<SearchX className="size-5 icon" />}
            title="Không tìm thấy phiên thực tập"
            description="Mã phiên trong liên kết không khớp với phiên nào. Hãy kiểm tra lại link lời mời hoặc liên hệ giảng viên để nhận link mới."
            action={
              <Link
                to="/"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-line px-4 text-xs font-medium text-dim transition-colors hover:border-line-strong hover:text-ink"
              >
                Về trang chủ
              </Link>
            }
          />
        </Panel>
      );
    }
    return <ErrorBlock error={res.error} onRetry={res.reload} />;
  }

  const state = res.data;
  if (!state) return null;

  const repoMeta = REPO_STATUS_META[state.repository.status];
  const webhookMeta = WEBHOOK_META[state.repository.webhookStatus];

  return (
    <div className="space-y-5">
      {/* Card repository */}
      <Panel className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.06] via-transparent to-transparent" />
        <div className="relative space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-bright">
                Repository của phiên
              </p>
              <p className="mt-2 break-all font-mono text-lg font-bold tracking-tight text-ink">
                {state.repository.owner}/<span className="text-brand-bright">{state.repository.name}</span>
              </p>
              <p className="mt-1.5 text-xs text-dim">
                Phiên <span className="font-semibold text-ink">{state.session.name}</span>{" "}
                <span className="font-mono text-faint">({state.session.code})</span>
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                <StatusDot
                  tone={repoMeta.tone === "brand" ? "zinc" : repoMeta.tone}
                  className={repoMeta.dotClass}
                  pulse={state.repository.status === "provisioning"}
                />
                {repoMeta.label}
              </span>
              <ToneBadge tone={webhookMeta.tone} dot>
                {webhookMeta.label}
              </ToneBadge>
            </div>
          </div>

          {state.repository.url ? (
            <a
              href={state.repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand/30 bg-brand/10 px-4 text-xs font-semibold text-brand-bright transition-all hover:bg-brand/20 active:scale-[0.98]"
            >
              <ExternalLink className="size-3.5 icon" />
              Mở repository trên GitHub
            </a>
          ) : (
            <p className="rounded-lg border border-line bg-deep/40 px-3.5 py-2.5 text-xs leading-relaxed text-dim">
              Repository đang được khởi tạo — đường dẫn sẽ xuất hiện sau khi sẵn sàng.
            </p>
          )}
        </div>
      </Panel>

      <MembersPanel state={state} onReconcile={() => void reconcile()} reconcileBusy={reconcileBusy} />

      <ActivityPanel sessionId={sessionId} />
    </div>
  );
}

/* ==================== View chính ==================== */

export function GithubInvitationView({ params }: { params?: Record<string, string> }) {
  const { search } = useRoute();
  const { token } = useSession();
  const sessionId = (params?.session ?? search.get("session") ?? "").trim();

  return (
    <div className="relative min-h-screen bg-canvas">
      <div
        className="dot-bg pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
        {/* Thanh đầu trang */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" aria-label="Về trang chủ" className="py-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-dim transition-colors hover:text-ink"
            >
              Về trang chủ
            </Link>
          </div>
        </header>

        {/* Giới thiệu */}
        <div className="mb-7 mt-8 max-w-2xl">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-bright">
            Lời mời GitHub
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-[28px]">
            Repository & quyền GitHub của phiên thực tập
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-dim">
            <CheckCircle2 className="size-4 icon text-teal" />
            {sessionId ? (
              <>
                Mã phiên trong liên kết:{" "}
                <span className="rounded-md border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-ink">
                  {sessionId}
                </span>
              </>
            ) : (
              "Kiểm tra trạng thái repository, lời mời collaborator và hoạt động gần nhất."
            )}
          </p>
        </div>

        {!sessionId ? (
          <Panel>
            <Empty
              icon={<SearchX className="size-5 icon" />}
              title="Thiếu mã phiên trong liên kết"
              description="Liên kết hợp lệ có dạng /github/invitation?session=<mã phiên>. Hãy mở lại link đầy đủ trong email lời mời."
              action={
                <Link
                  to="/"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.98]"
                >
                  Về trang chủ <ArrowRight className="size-3.5 icon" />
                </Link>
              }
            />
          </Panel>
        ) : !token ? (
          <LoginGate sessionId={sessionId} />
        ) : (
          <InvitationContent sessionId={sessionId} />
        )}

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-[11px] text-faint">
          <span>V-Intern — thực tập ảo cùng AI, dự án thật.</span>
          <span className="font-mono">© 2026 V-Intern Labs</span>
        </footer>
      </div>
    </div>
  );
}
