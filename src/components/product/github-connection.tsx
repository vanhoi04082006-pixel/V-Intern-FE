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
} from "@/lib/api/github";
import { useResource } from "@/lib/api/use-resource";
import { errorMessage } from "@/lib/auth/api-client";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Panel, buttonClass } from "./primitives";

export function GithubConnection() {
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
              Kết nối tài khoản GitHub của bạn để tạo repository cho phiên hoặc
              xác minh danh tính khi nộp bài. Gmail có thể là email đăng ký
              GitHub.
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
              Giảng viên cấp quyền tạo và quản lý repo public. Sinh viên chỉ cần
              liên kết danh tính. Ngắt kết nối trên V-INTERN xóa credential đã
              lưu; bạn cũng có thể thu hồi quyền ứng dụng trong cài đặt GitHub.
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
              Chưa có repository. Giảng viên chủ trì cần kết nối GitHub và khởi
              động phiên.
            </p>
          )}
          {manage && (
            <div className="flex flex-wrap gap-3">
              <button
                disabled={busy}
                onClick={() => void action()}
                className={buttonClass}
              >
                Tạo hoặc khôi phục repo
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
