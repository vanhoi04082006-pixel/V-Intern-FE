"use client";
import Image from "next/image";
import { Bot, MessageSquarePlus, Send } from "lucide-react";
import {
  StudentHeading,
  StudentPanel as Panel,
} from "@/components/intern/student-ui";
import { listTasks } from "@/lib/api/work";
import { useCallback, useRef, useState } from "react";
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
import { Pager } from "./primitives";
export function Mentor() {
  const creating = useRef(false);
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
    if (creating.current) return;
    creating.current = true;
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
      creating.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <StudentHeading
        title="AI Mentor"
        eyebrow="Học cùng một người đồng hành"
        description="Gỡ vướng bằng câu hỏi cụ thể, hiểu cách làm và tự hoàn thiện bài tập. Gợi ý AI hỗ trợ bạn; giảng viên quyết định đánh giá chính thức."
        action={
          <button
            className="student-action"
            disabled={busy}
            onClick={() => void create()}
          >
            <MessageSquarePlus size={16} aria-hidden="true" />
            Cuộc trò chuyện mới
          </button>
        }
      />
      {Boolean(error) && <ErrorState error={error} />}
      <div className="workspace-mentor-layout grid items-start gap-5 lg:grid-cols-[282px_minmax(0,1fr)]">
        <Panel
          title="Cuộc trò chuyện"
          action={
            <span className="student-board-count">
              {list.data?.total ?? "·"}
            </span>
          }
        >
          <label className="student-field mb-3">
            <span>Hiển thị</span>
            <select
              aria-label="Trạng thái cuộc trò chuyện"
              value={status}
              className="student-input"
              onChange={(e) => {
                setStatus(e.target.value as "active" | "archived");
                setPage(1);
                setSelected(undefined);
              }}
            >
              <option value="active">Đang hoạt động</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </label>
          {list.loading ? (
            <div className="space-y-2" role="status">
              <span className="sr-only">Đang tải cuộc trò chuyện…</span>
              {[0, 1, 2].map((row) => (
                <div key={row} className="student-skeleton h-[54px]" />
              ))}
            </div>
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.reload} />
          ) : (
            list.data && (
              <>
                {list.data.items.length ? (
                  <ul className="student-conversation-list">
                    {list.data.items.map((c) => (
                      <li key={c.id}>
                        <button
                          aria-pressed={selected === c.id}
                          onClick={() => setSelected(c.id)}
                          className="student-conversation"
                        >
                          <strong>{c.title ?? "Cuộc trò chuyện mới"}</strong>
                          <time>
                            {new Date(
                              c.lastMessageAt ?? c.createdAt,
                            ).toLocaleString("vi-VN")}
                          </time>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="student-empty !py-8">
                    <MessageSquarePlus size={30} aria-hidden="true" />
                    <h3>Chưa có cuộc trò chuyện</h3>
                    <p>
                      {status === "archived"
                        ? "Các cuộc trò chuyện bạn lưu trữ sẽ nằm ở đây."
                        : "Bắt đầu một cuộc trò chuyện mới khi bạn cần gỡ vướng."}
                    </p>
                  </div>
                )}
                {list.data.totalPages > 1 && (
                  <Pager {...list.data} onChange={setPage} />
                )}
              </>
            )
          )}
        </Panel>
        {selected ? (
          <MentorChat key={selected} id={selected} onChanged={list.reload} />
        ) : (
          <section className="student-panel student-chat-welcome">
            <Image
              src="/images/robot-v2.png"
              alt=""
              width={100}
              height={100}
              className="h-24 w-24 object-contain"
            />
            <h2>Bắt đầu từ điều bạn chưa hiểu</h2>
            <p>
              Mô tả mục tiêu, đoạn bạn đang mắc và những cách đã thử. Mentor có
              thể giúp phân tích yêu cầu, giải thích lỗi và gợi ý cách kiểm thử.
            </p>
            <button
              className="student-action mt-6"
              disabled={busy}
              onClick={() => void create()}
            >
              <MessageSquarePlus size={17} aria-hidden="true" />
              {busy ? "Đang tạo…" : "Bắt đầu trao đổi"}
            </button>
            <p className="mt-5 !text-xs">
              Không đưa mật khẩu, token hoặc dữ liệu riêng tư vào câu hỏi.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
function MentorChat({ id, onChanged }: { id: string; onChanged: () => void }) {
  const composer = useRef<HTMLTextAreaElement>(null);
  const [taskId, setTaskId] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const ownTasks = useResource(
    useCallback(
      (signal: AbortSignal) =>
        listTasks(
          new URLSearchParams({
            mine: "true",
            pageSize: "100",
            ...(taskSearch.trim() ? { search: taskSearch.trim() } : {}),
          }),
          signal,
        ),
      [taskSearch],
    ),
  );
  const mutationPending = useRef(false);
  const detail = useResource(
    useCallback((signal: AbortSignal) => getConversation(id, signal), [id]),
  );
  const [content, setContent] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  async function send() {
    if (mutationPending.current || !content.trim()) return;
    mutationPending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await sendMentorMessage(id, content.trim(), taskId || undefined);
      setContent("");
      detail.reload();
      onChanged();
    } catch (e) {
      setError(e);
      detail.reload();
      onChanged();
    } finally {
      mutationPending.current = false;
      setBusy(false);
    }
  }
  async function archive() {
    if (mutationPending.current) return;
    mutationPending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await archiveConversation(id);
      detail.reload();
      onChanged();
    } catch (e) {
      setError(e);
    } finally {
      mutationPending.current = false;
      setBusy(false);
    }
  }
  return (
    <Panel
      title={
        detail.data?.conversation.title ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate">
              {detail.data.conversation.title}
            </span>
            <span
              className="student-badge"
              data-tone={
                detail.data.conversation.status === "active"
                  ? "green"
                  : "slate"
              }
            >
              {detail.data.conversation.status === "active"
                ? "Đang hoạt động"
                : "Đã lưu trữ"}
            </span>
          </span>
        ) : (
          "Trao đổi với Mentor"
        )
      }
      action={
        <button
          className="student-action student-action-secondary student-action-sm"
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
              className="student-chat"
              aria-live="polite"
              aria-label="Nội dung cuộc trò chuyện"
            >
              {detail.data.messages.length ? (
                detail.data.messages.map((m) => (
                  <article
                    key={m.id}
                    className="student-chat-message"
                    data-role={m.role}
                  >
                    {m.role === "assistant" && (
                      <span className="student-avatar-bot" aria-hidden="true">
                        <Bot size={16} />
                      </span>
                    )}
                    <div>
                      <div className="student-chat-bubble">
                        <span className="student-chat-author">
                          {m.role === "assistant" ? "AI Mentor · Gợi ý" : "Bạn"}
                        </span>
                        <p className="whitespace-pre-wrap break-words">
                          {m.content}
                        </p>
                        <time>
                          {new Date(m.createdAt).toLocaleString("vi-VN")}
                        </time>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="student-empty">
                  <Bot size={32} aria-hidden="true" />
                  <h3>Mentor đang sẵn sàng</h3>
                  <p>
                    Chọn một gợi ý bên dưới, rồi bổ sung ngữ cảnh trước khi gửi.
                  </p>
                </div>
              )}
            </div>
            {Boolean(error) && (
              <div role="alert" className="student-callout mt-4" data-tone="amber">
                <div>
                  <strong>{errorMessage(error)}</strong>
                  <p className="mt-1">
                    Kiểm tra lịch sử trước khi gửi lại: câu hỏi có thể đã được
                    lưu dù AI chưa phản hồi.
                  </p>
                  <button
                    className="mt-2 font-semibold underline"
                    onClick={detail.reload}
                  >
                    Tải lại lịch sử
                  </button>
                </div>
              </div>
            )}
            {detail.data.conversation.status === "archived" ? (
              <p role="status" className="mt-4 text-sm text-slate-500">
                Cuộc trò chuyện đã lưu trữ. Tạo cuộc trò chuyện mới để tiếp tục.
              </p>
            ) : (
              <form
                className="student-composer space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                {!detail.data.messages.length && (
                  <div
                    className="student-prompt-grid"
                    aria-label="Gợi ý câu hỏi"
                  >
                    {[
                      "Giúp tôi phân tích yêu cầu và chia nhỏ nhiệm vụ này.",
                      "Tôi gặp lỗi khi triển khai. Hãy giúp tôi tìm nguyên nhân từ những gì tôi đã thử.",
                      "Gợi ý các trường hợp kiểm thử để tôi tự kiểm tra bài làm.",
                    ].map((prompt) => (
                      <button
                        type="button"
                        key={prompt}
                        disabled={busy}
                        onClick={() => {
                          setContent(prompt);
                          composer.current?.focus();
                        }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
                <details className="workspace-mentor-context rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                    {taskId
                      ? "Đã chọn ngữ cảnh công việc · Thay đổi"
                      : "Thêm ngữ cảnh công việc (không bắt buộc)"}
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="student-field">
                      <span>Tìm công việc đang hỏi</span>
                      <input
                        className="student-input"
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        placeholder="Mã hoặc tên task"
                      />
                    </label>
                    <label className="student-field">
                      <span>Ngữ cảnh công việc</span>
                      <select
                        className="student-input"
                        value={taskId}
                        onChange={(e) => setTaskId(e.target.value)}
                        disabled={busy}
                      >
                        <option value="">Hỏi chung về kỳ thực tập</option>
                        {ownTasks.data?.items.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.code} · {t.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    {Boolean(ownTasks.error) && (
                      <ErrorState
                        error={ownTasks.error}
                        onRetry={ownTasks.reload}
                      />
                    )}
                  </div>
                </details>
                <label className="student-field">
                  <span>Câu hỏi của bạn</span>
                  <textarea
                    ref={composer}
                    placeholder="Tôi đang làm… Tôi đã thử… Kết quả tôi mong muốn là…"
                    required
                    maxLength={8000}
                    rows={3}
                    className="student-input min-h-[104px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={busy}
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] tabular-nums text-slate-500">
                    {content.length.toLocaleString("vi-VN")}/8.000 ký tự · Enter
                    để xuống dòng
                  </span>
                  <button
                    className="student-action"
                    disabled={busy || !content.trim()}
                  >
                    <Send size={15} aria-hidden="true" />
                    {busy ? "Đang chờ AI..." : "Gửi câu hỏi"}
                  </button>
                </div>
                {busy && (
                  <p role="status" className="text-xs text-blue-700">
                    Mentor đang xử lý yêu cầu. Hãy giữ cuộc trò chuyện này mở.
                  </p>
                )}
              </form>
            )}
          </>
        )
      )}
    </Panel>
  );
}
