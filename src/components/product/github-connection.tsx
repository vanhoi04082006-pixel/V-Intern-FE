"use client";
import { useCallback, useState } from "react";
import { Github, ExternalLink } from "lucide-react";
import {
  githubStatus,
  connectGithub,
  disconnectGithub,
  sessionRepository,
  provisionRepository,
  inviteRepositoryMembers,
  configureGithubWebhook,
  githubRepositoryActivity,
  repositoryAccountStatus,
  selectRepositoryAccount,
} from "@/lib/api/github";
import { useResource } from "@/lib/api/use-resource";
import { errorMessage } from "@/lib/auth/api-client";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Panel, Pager, Empty, buttonClass } from "./primitives";

export function GithubConnection({ repositoryAdmin = false }: { repositoryAdmin?: boolean }) {
  const data = useResource(
    useCallback((signal: AbortSignal) => githubStatus(signal), []),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function connect() {
    setBusy(true);
    setError("");
    try {
      window.location.assign(await connectGithub());
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }
  async function disconnect() {
    setBusy(true);
    setError("");
    try {
      await disconnectGithub();
      data.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Github size={20} />
          Tài khoản GitHub
        </span>
      }
    >
      {data.loading ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : (
        data.data && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {repositoryAdmin
                ? 'Admin kết nối tài khoản GitHub dùng chung để hệ thống tạo repository và gửi lời mời cho các phiên thực tập. Mật khẩu GitHub không lưu trong V-INTERN.'
                : 'Liên kết GitHub để nhận lời mời repository và xác minh danh tính khi nộp bài. Repository được hệ thống tạo bằng tài khoản chung do Admin cấu hình; giảng viên và sinh viên không cần tự tạo repo.'}
            </p>
            {!data.data.configured && (
              <p
                role="status"
                className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
              >
                Tích hợp GitHub chưa được bật. Vui lòng liên hệ quản trị viên để
                hoàn tất cấu hình.
              </p>
            )}
            {data.data.connected && (
              <p className="rounded-xl bg-emerald-50 p-4 text-sm">
                Đã liên kết: <strong>@{data.data.login}</strong>
                {data.data.reconnectRequired ? " · Cần kết nối lại" : ""}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                disabled={busy || !data.data.configured}
                className={buttonClass}
                onClick={() => void connect()}
              >
                {busy
                  ? "Đang xử lý…"
                  : data.data.connected
                    ? "Kết nối lại GitHub"
                    : "Kết nối GitHub"}
              </button>
              {data.data.connected && (
                <button
                  disabled={busy}
                  onClick={() => void disconnect()}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                >
                  Ngắt kết nối trên V-INTERN
                </button>
              )}
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Admin cấp quyền tạo và quản lý repo public cho tài khoản chung.
              Giảng viên và sinh viên chỉ cần liên kết danh tính. Tài khoản chung
              đang được chọn cần thay thế trước khi ngắt kết nối; các kết nối cá
              nhân có thể ngắt trên V-INTERN hoặc thu hồi tại cài đặt GitHub.
            </p>
          </div>
        )
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </Panel>
  );
}
export function GithubRepositoryAdmin() {
  const account = useResource(useCallback((signal: AbortSignal) => repositoryAccountStatus(signal), []));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function select() {
    setBusy(true); setError('');
    try { await selectRepositoryAccount(); account.reload(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <div className="mb-6 space-y-4">
    <GithubConnection repositoryAdmin />
    <Panel title="Tài khoản tạo repository chung">
      {account.loading ? <LoadingState /> : account.error ? <ErrorState error={account.error} onRetry={account.reload} /> : <>
        <p className="text-sm">{account.data?.configured ? `Tài khoản đã chọn: @${account.data.login ?? 'cần kết nối lại'} · ${account.data.ready ? 'Sẵn sàng' : 'Cần Admin kiểm tra kết nối/quyền'}` : 'Chưa chọn tài khoản tạo repository chung.'}</p>
        <p className="my-3 text-sm text-slate-600">Sau khi kết nối đúng tài khoản ở trên, chọn làm tài khoản chung. Các phiên đang chạy sẽ được tự đồng bộ. Repo cũ giữ nguyên chủ sở hữu và đường dẫn.</p>
        <button className={buttonClass} disabled={busy} onClick={() => void select()}>{busy ? 'Đang lưu…' : 'Dùng GitHub đã liên kết của tôi làm tài khoản chung'}</button>
        <button className="ml-3 text-sm text-blue-700" onClick={account.reload}>Tải lại cấu hình GitHub</button>
        <p className="mt-3 text-xs text-slate-500">Tên repo: vintern-dự-án-tên-phiên-ngày-bắt-đầu-mã-phiên. Không đưa email hoặc tên sinh viên vào tên repository public.</p>
      </>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </Panel>
  </div>;
}
export function SessionRepositoryCard({
  sessionId,
  manage = false,
}: {
  sessionId: string;
  manage?: boolean;
}) {
  const data = useResource(
    useCallback(
      (signal: AbortSignal) => sessionRepository(sessionId, signal),
      [sessionId],
    ),
  );
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  async function action(invite = false) {
    setBusy(true);
    setNotice("");
    try {
      if (invite) await inviteRepositoryMembers(sessionId);
      else await provisionRepository(sessionId);
      data.reload();
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function updateWebhook() {
    setBusy(true); setNotice('');
    try { await configureGithubWebhook(sessionId); data.reload(); }
    catch (e) { setNotice(errorMessage(e)); }
    finally { setBusy(false); }
  }
  const repo = data.data?.repository;
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Github size={18} />
          Repository của phiên
        </span>
      }
    >
      {data.loading ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : (
        <div className="space-y-3 text-sm">
          {repo ? (
            <>
              <p className="font-semibold">
                {repo.owner}/{repo.name}
              </p>
              <p>
                {repo.status === "ready"
                  ? "Sẵn sàng · Public"
                  : repo.status === "provisioning"
                    ? "Đang tạo repository…"
                    : "Chưa tạo được repository; hãy kiểm tra kết nối và thử lại."}
              </p>
              {repo.status === 'ready' && <p className={repo.webhookStatus === 'ready' ? 'text-emerald-700' : 'text-slate-500'}>{repo.webhookStatus === 'ready' ? 'Webhook đang đồng bộ' : repo.webhookStatus === 'configuring' ? 'Đang thiết lập đồng bộ GitHub…' : repo.webhookStatus === 'failed' ? 'Chưa đồng bộ được webhook. Kiểm tra quyền GitHub hoặc thử lại.' : 'Đồng bộ webhook chưa được bật. Nhờ quản trị hệ thống cấu hình kết nối nhận sự kiện GitHub.'}</p>}
              {repo.url && (
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-blue-700"
                >
                  Mở trên GitHub
                  <ExternalLink size={14} />
                </a>
              )}
            </>
          ) : (
            <p>
              Repository được tạo tự động khi phiên bắt đầu, bằng tài khoản chung do Admin cấu hình. Nếu chưa có, liên hệ Admin kiểm tra cấu hình.
            </p>
          )}
          {manage && (
            <div className="flex flex-wrap gap-3">
              <button
                disabled={busy}
                onClick={() => void action()}
                className={buttonClass}
              >
                Đồng bộ repository của phiên
              </button>
              {repo?.status === "ready" && (
                <button
                  disabled={busy}
                  onClick={() => void action(true)}
                  className={buttonClass}
                >
                  Mời lại thành viên đã kết nối
                </button>
              )}
              {repo?.status === 'ready' && <button disabled={busy} onClick={() => void updateWebhook()} className={buttonClass}>{repo.webhookStatus === 'ready' ? 'Cập nhật webhook' : 'Thiết lập webhook'}</button>}
            </div>
          )}
          {data.data && data.data.members.length > 0 && (
            <p className="text-xs text-slate-500">
              {data.data.members.filter((m) => m.status === "invited").length}{" "}
              thành viên đã gửi lời mời ·{" "}
              {data.data.members.filter((m) => m.status !== "invited").length}{" "}
              thành viên cần kết nối hoặc mời lại. Thành viên chấp nhận lời mời
              trên GitHub trước khi push code.
            </p>
          )}
          <button onClick={data.reload} className="text-blue-700">
            Tải lại trạng thái repository
          </button>
          {repo?.status === 'ready' && <RepositoryActivity key={sessionId} sessionId={sessionId} />}
        </div>
      )}
      {notice && (
        <p role="alert" className="mt-3 text-sm text-amber-800">
          {notice}
        </p>
      )}
    </Panel>
  );
}

function RepositoryActivity({ sessionId }: { sessionId: string }) {
  const [page, setPage] = useState(1);
  const state = useResource(useCallback((signal: AbortSignal) => githubRepositoryActivity(sessionId, page, signal), [sessionId, page]));
  const actionLabels: Record<string, string> = { synchronize: 'Cập nhật code', opened: 'Mở PR', reopened: 'Mở lại PR', closed: 'Đóng PR', pushed: 'Push commit', completed: 'Cập nhật CI', requested: 'Yêu cầu chạy CI', ping: 'Kiểm tra kết nối', received: 'Nhận sự kiện' };
  return <section aria-label="Hoạt động GitHub của phiên" className="mt-4 border-t border-slate-100 pt-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Hoạt động GitHub gần đây</h3><button className="text-xs text-blue-700" onClick={state.reload}>Tải lại hoạt động</button></div>
    {state.loading ? <p role="status" className="text-sm text-slate-500">Đang tải hoạt động…</p> : state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : !state.data?.items.length ? <Empty>Chưa ghi nhận sự kiện GitHub cho phiên này.</Empty> : <>
      <ol className="divide-y divide-slate-100">{state.data.items.map(e => <li key={e.id} className="py-2"><p>{actionLabels[e.action] ?? 'Cập nhật GitHub'}{e.pullNumber ? ` · PR #${e.pullNumber}` : ''}{e.branch ? ` · ${e.branch}` : ''}</p>{e.headSha && <p className="mt-1 break-all font-mono text-xs text-slate-500">{e.headSha}</p>}<time className="text-xs text-slate-400">{new Date(e.receivedAt).toLocaleString('vi-VN')}</time></li>)}</ol>
      {state.data.total > 5 && <Pager page={page} totalPages={Math.ceil(state.data.total / 5)} total={state.data.total} onChange={setPage} unit="sự kiện" />}
    </>}
    <p className="mt-3 text-xs text-slate-500">Trạng thái CI từ repository là bằng chứng bổ sung; quyết định chấm và duyệt được lưu riêng theo bài nộp.</p>
  </section>;
}
