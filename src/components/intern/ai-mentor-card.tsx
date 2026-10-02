import { Bot, Send } from "lucide-react";

import { Avatar, CardLinkAction, SectionCard } from "./intern-primitives";
import type { InternWorkspaceState } from "./data/intern-mock-data";

/**
 * Card "AI Mentor" (state active) — hội thoại mock cố định theo task spec,
 * KHÔNG gọi AI API. Nội dung mock không mâu thuẫn auth thật (401 → kiểm tra
 * payload, thông tin xác thực, error code, session/token).
 * Input chỉ là visual (không submit, không state).
 */
export function AiMentorCard({
  mentor,
}: {
  mentor: Extract<
    InternWorkspaceState,
    { status: "active" }
  >["mentor"];
}) {
  return (
    <SectionCard
      id="ai-mentor"
      icon={Bot}
      tone="blue"
      title="AI Mentor"
      actions={<CardLinkAction label="Xem lịch sử" />}
    >
      <p className="text-xs text-slate-500">{mentor.contextLine}</p>

      <ul className="mt-3 flex flex-col gap-3">
        {mentor.messages.map((message) =>
          message.author === "intern" ? (
            <li key={message.id} className="flex items-start justify-end gap-2.5">
              <div className="flex max-w-[85%] flex-col items-end gap-1">
                <p className="rounded-2xl rounded-br-md bg-brand px-3.5 py-2.5 text-[13px] leading-relaxed text-white">
                  {message.text}
                </p>
                <time className="text-[11px] text-slate-400">
                  {message.timeLabel}
                </time>
              </div>
              <Avatar initials="NA" className="size-8 text-[11px]" />
            </li>
          ) : (
            <li key={message.id} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600"
              >
                <Bot className="size-4" />
              </span>
              <div className="flex max-w-[85%] flex-col gap-1">
                <p className="rounded-2xl rounded-bl-md border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700">
                  {message.text}
                </p>
                <time className="text-[11px] text-slate-400">
                  {message.timeLabel}
                </time>
              </div>
            </li>
          )
        )}
      </ul>

      <form
        className="mt-4 flex items-center gap-2"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="ai-mentor-input" className="sr-only">
          Hỏi AI Mentor về task này
        </label>
        <input
          id="ai-mentor-input"
          type="text"
          placeholder={mentor.inputPlaceholder}
          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-navy outline-none transition-shadow placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-brand/30"
        />
        <button
          type="submit"
          aria-label="Gửi câu hỏi cho AI Mentor"
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>
    </SectionCard>
  );
}
