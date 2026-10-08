"use client";
import { useCallback, useState } from "react";
import {
  archiveConversation,
  createConversation,
  getConversation,
  listConversations,
  sendMentorMessage,
} from "@/lib/api/mentor";
import { useResource } from "@/lib/api/use-resource";
import { errorMessage } from "@/lib/auth/api-client";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import {
  buttonClass,
  Empty,
  inputClass,
  PageTitle,
  Pager,
  Panel,
} from "./primitives";
export function Mentor() {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState<"active" | "archived">("active"),
    [selected, setSelected] = useState<string>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const list = useResource(
    useCallback(
      (signal: AbortSignal) => listConversations(page, status, signal),
      [page, status],
    ),
  );
  async function create() {
    setBusy(true);
    setError(undefined);
    try {
      const conversation = await createConversation();
      setSelected(conversation.id);
      setStatus("active");
      setPage(1);
      list.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="AI Mentor"
        subtitle="Gợi ý từ AI để hỗ trợ học tập. Giảng viên quyết định đánh giá chính thức."
        action={
          <button
            className={buttonClass}
            disabled={busy}
            onClick={() => void create()}
          >
            Cuộc trò chuyện mới
          </button>
        }
      />
      {Boolean(error) && <ErrorState error={error} />}
      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <Panel title="Cuộc trò chuyện">
          <select
            aria-label="Trạng thái cuộc trò chuyện"
            value={status}
            className={`${inputClass} mb-3`}
            onChange={(e) => {
              setStatus(e.target.value as "active" | "archived");
              setPage(1);
              setSelected(undefined);
            }}
          >
            <option value="active">Đang hoạt động</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
          {list.loading ? (
            <LoadingState />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : (
            list.data && (
              <>
                {list.data.items.length ? (
                  <ul className="space-y-2">
                    {list.data.items.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => setSelected(c.id)}
                          className={`w-full rounded-lg border p-3 text-left text-sm ${selected === c.id ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-100 hover:bg-slate-50"}`}
                        >
                          <strong className="block truncate">
                            {c.title ?? "Cuộc trò chuyện mới"}
                          </strong>
                          <time className="text-xs text-slate-400">
                            {new Date(
                              c.lastMessageAt ?? c.createdAt,
                            ).toLocaleString("vi-VN")}
                          </time>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>Chưa có cuộc trò chuyện.</Empty>
                )}
                <Pager {...list.data} onChange={setPage} />
              </>
            )
          )}
        </Panel>
        {selected ? (
          <MentorChat key={selected} id={selected} onChanged={list.reload} />
        ) : (
          <Panel title="Bắt đầu trao đổi">
            <Empty>
              Tạo hoặc chọn một cuộc trò chuyện để trao đổi với AI Mentor.
            </Empty>
          </Panel>
        )}
      </div>
    </>
  );
}
function MentorChat({ id, onChanged }: { id: string; onChanged: () => void }) {
  const detail = useResource(
    useCallback((signal: AbortSignal) => getConversation(id, signal), [id]),
  );
  const [content, setContent] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  async function send() {
    setBusy(true);
    setError(undefined);
    try {
      await sendMentorMessage(id, content.trim());
      setContent("");
      detail.reload();
      onChanged();
    } catch (e) {
      setError(e);
      detail.reload();
      onChanged();
    } finally {
      setBusy(false);
    }
  }
  async function archive() {
    setBusy(true);
    setError(undefined);
    try {
      await archiveConversation(id);
      detail.reload();
      onChanged();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title="Trao đổi với Mentor"
      action={
        <button
          className={buttonClass}
          disabled={busy || detail.data?.conversation.status !== "active"}
          onClick={() => void archive()}
        >
          Lưu trữ
        </button>
      }
    >
      {detail.loading ? (
        <LoadingState />
      ) : detail.error ? (
        <ErrorState error={detail.error} onRetry={detail.reload} />
      ) : (
        detail.data && (
          <>
            <div
              className="max-h-[55dvh] space-y-3 overflow-y-auto pr-1"
              aria-live="polite"
            >
              {detail.data.messages.length ? (
                detail.data.messages.map((m) => (
                  <article
                    key={m.id}
                    className={`rounded-xl p-4 text-sm ${m.role === "assistant" ? "mr-5 border border-blue-100 bg-blue-50" : "ml-5 bg-slate-100"}`}
                  >
                    <p className="mb-2 text-xs font-bold text-blue-700">
                      {m.role === "assistant" ? "AI Mentor · Gợi ý" : "Bạn"}
                    </p>
                    <p className="whitespace-pre-wrap break-words">
                      {m.content}
                    </p>
                    <time className="mt-2 block text-xs text-slate-400">
                      {new Date(m.createdAt).toLocaleString("vi-VN")}
                    </time>
                  </article>
                ))
              ) : (
                <Empty>Chưa có tin nhắn.</Empty>
              )}
            </div>
            {Boolean(error) && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
              >
                <p>{errorMessage(error)}</p>
                <p className="mt-1">
                  Kiểm tra lịch sử trước khi gửi lại: câu hỏi có thể đã được lưu
                  dù AI chưa phản hồi.
                </p>
                <button
                  className="mt-2 font-semibold underline"
                  onClick={detail.reload}
                >
                  Tải lại lịch sử
                </button>
              </div>
            )}
            {detail.data.conversation.status === "archived" ? (
              <p role="status" className="mt-4 text-sm text-slate-500">
                Cuộc trò chuyện đã lưu trữ. Tạo cuộc trò chuyện mới để tiếp tục.
              </p>
            ) : (
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <label className="block text-sm font-medium">
                  Câu hỏi của bạn
                  <textarea
                    required
                    maxLength={8000}
                    rows={3}
                    className={`${inputClass} mt-2`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={busy}
                  />
                </label>
                <button
                  className={buttonClass}
                  disabled={busy || !content.trim()}
                >
                  {busy ? "Đang chờ AI..." : "Gửi câu hỏi"}
                </button>
              </form>
            )}
          </>
        )
      )}
    </Panel>
  );
}
