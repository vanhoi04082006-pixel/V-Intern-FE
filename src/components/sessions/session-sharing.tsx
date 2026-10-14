"use client";
import { useCallback, useState } from "react";
import { useResource } from "@/lib/api/use-resource";
import {
  listAccess,
  requestAccess,
  decideAccess,
  sharingSessions,
  sharedSnapshot,
} from "@/lib/api/sharing";
import { getSessionUser } from "@/lib/auth/session";
import { errorMessage } from "@/lib/auth/api-client";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  Panel,
  PageTitle,
  Empty,
  buttonClass,
  inputClass,
} from "@/components/product/primitives";

const labels = {
  pending: "Chờ phản hồi",
  approved: "Đã cấp quyền",
  denied: "Đã từ chối",
  revoked: "Đã thu hồi",
};
export function SessionSharing() {
  const [page, setPage] = useState(1),
    [email, setEmail] = useState(""),
    [reason, setReason] = useState("");
  const [query, setQuery] = useState(""),
    [sessionId, setSessionId] = useState("");
  const [viewId, setViewId] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const access = useResource(
    useCallback((signal: AbortSignal) => listAccess(page, signal), [page]),
  );
  const sessions = useResource(
    useCallback(
      (signal: AbortSignal) => sharingSessions(query, signal),
      [query],
    ),
  );
  const actor = getSessionUser()?.id.toLowerCase();
  async function action(work: () => Promise<unknown>) {
    setBusy(true);
    setNotice("");
    try {
      await work();
      access.reload();
      setNotice("Đã lưu.");
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Chia sẻ dữ liệu"
        subtitle="Chủ trì phiên chọn rõ phạm vi; quyền được cấp chỉ cho phép xem và có thể thu hồi."
      />
      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4"
        >
          {notice}
        </p>
      )}
      <div className="grid gap-5 xl:grid-cols-[minmax(260px,1fr)_2fr]">
        <Panel title="Xin quyền xem">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void action(() => requestAccess(email, reason));
            }}
          >
            <label className="block text-sm">
              Email giảng viên
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Mục đích và phiên muốn xem
              <textarea
                required
                minLength={10}
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className={inputClass}
              />
            </label>
            <button disabled={busy} className={buttonClass}>
              Gửi yêu cầu
            </button>
          </form>
        </Panel>
        <Panel title="Yêu cầu và quyền truy cập">
          {access.loading ? (
            <LoadingState />
          ) : access.error ? (
            <ErrorState error={access.error} onRetry={access.reload} />
          ) : (
            <div className="space-y-4">
              <label className="block text-sm">
                Tìm phiên của bạn để cấp quyền
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={inputClass}
                  placeholder="Tên hoặc mã phiên"
                />
              </label>
              {Boolean(sessions.error) && (
                <ErrorState error={sessions.error} onRetry={sessions.reload} />
              )}
              <label className="block text-sm">
                Phiên cho yêu cầu được chấp nhận
                <select
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Chọn phiên bạn chủ trì</option>
                  {sessions.data?.items
                    .filter((s) => s.leadInstructorId?.toLowerCase() === actor)
                    .map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              {access.data?.items.length === 0 && (
                <Empty>Chưa có yêu cầu chia sẻ.</Empty>
              )}
              {access.data?.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-semibold">
                    {item.requesterName} → {item.ownerName}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {item.reason}
                  </p>
                  <p className="my-3 text-sm text-slate-500">
                    {labels[item.status]}
                    {item.sessionName ? ` · ${item.sessionName}` : ""}
                    {item.expiresAt
                      ? ` · Hết hạn ${new Date(item.expiresAt).toLocaleString("vi-VN")}`
                      : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.ownerId.toLowerCase() === actor &&
                      item.status === "pending" && (
                        <>
                          <button
                            disabled={busy || !sessionId}
                            className={buttonClass}
                            onClick={() =>
                              void action(() =>
                                decideAccess(item.id, "approve", sessionId),
                              )
                            }
                          >
                            Cho xem 7 ngày
                          </button>
                          <button
                            disabled={busy}
                            className={buttonClass}
                            onClick={() =>
                              void action(() => decideAccess(item.id, "deny"))
                            }
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    {item.ownerId.toLowerCase() === actor &&
                      item.status === "approved" && (
                        <button
                          disabled={busy}
                          className={buttonClass}
                          onClick={() =>
                            void action(() => decideAccess(item.id, "revoke"))
                          }
                        >
                          Thu hồi
                        </button>
                      )}
                    {item.requesterId.toLowerCase() === actor &&
                      item.status === "approved" && (
                        <button
                          className={buttonClass}
                          onClick={() => setViewId(item.id)}
                        >
                          Xem dữ liệu được chia sẻ
                        </button>
                      )}
                  </div>
                </article>
              ))}
              <div className="flex items-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trang trước
                </button>
                <span>Trang {page}</span>
                <button
                  disabled={page >= (access.data?.totalPages ?? 0)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>
      {viewId && <SharedView id={viewId} onClose={() => setViewId(null)} />}
    </>
  );
}

function SharedView({ id, onClose }: { id: string; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const view = useResource(
    useCallback(
      (signal: AbortSignal) => sharedSnapshot(id, page, signal),
      [id, page],
    ),
  );
  return (
    <div className="mt-6">
      <Panel
        title="Dữ liệu được chia sẻ · Chỉ đọc"
        action={<button onClick={onClose}>Đóng</button>}
      >
        {view.loading ? (
          <LoadingState />
        ) : view.error ? (
          <ErrorState error={view.error} onRetry={view.reload} />
        ) : (
          view.data && (
            <>
              <h3 className="text-xl font-bold">{view.data.session.name}</h3>
              <p>
                {view.data.projects.join(", ")} · {view.data.session.status}
              </p>
              <p>
                {new Date(view.data.session.startDate).toLocaleDateString(
                  "vi-VN",
                )}{" "}
                –{" "}
                {new Date(view.data.session.endDate).toLocaleDateString(
                  "vi-VN",
                )}
              </p>
              <p className="my-3">
                Thành viên: {view.data.members.join(", ") || "Chưa có"}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {view.data.tasks.map((t) => (
                  <article className="rounded-xl border p-4" key={t.id}>
                    <p className="text-xs text-slate-500">
                      {t.sprintName} · {t.priority}
                    </p>
                    <h4 className="font-semibold">{t.title}</h4>
                    <p className="whitespace-pre-wrap text-sm">
                      {t.description}
                    </p>
                    <p className="mt-2 text-sm">
                      {t.assigneeName ?? "Chưa giao"} · {t.status}
                      {t.dueDate
                        ? ` · ${new Date(t.dueDate).toLocaleDateString("vi-VN")}`
                        : ""}
                    </p>
                  </article>
                ))}
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trang trước
                </button>
                <span>
                  {page}/{view.data.totalPages || 1}
                </span>
                <button
                  disabled={page >= view.data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Trang sau
                </button>
                <button onClick={view.reload}>Kiểm tra lại quyền</button>
              </div>
            </>
          )
        )}
      </Panel>
    </div>
  );
}
