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
      <p className="text-caption text-muted-foreground">{mentor.contextLine}</p>

      <ul className="mt-3 flex flex-col gap-3">
        {mentor.messages.map((message) =>
          message.author === "intern" ? (
            <li key={message.id} className="flex items-start justify-end gap-3">
              <div className="flex max-w-[85%] flex-col items-end gap-1">
                <p className="rounded-panel rounded-br-md bg-primary px-4 py-3 text-small leading-relaxed text-primary-foreground">
                  {message.text}
                </p>
                <time className="text-caption text-muted-foreground">
                  {message.timeLabel}
                </time>
              </div>
              <Avatar initials="NA" className="size-8 text-caption" />
            </li>
          ) : (
            <li key={message.id} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-primary"
              >
                <Bot className="size-4" />
              </span>
              <div className="flex max-w-[85%] flex-col gap-1">
                <p className="rounded-panel rounded-bl-md border border-border bg-background px-4 py-3 text-small leading-relaxed text-foreground">
                  {message.text}
                </p>
                <time className="text-caption text-muted-foreground">
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
          className="h-10 min-w-0 flex-1 rounded-control border border-border bg-background px-4 text-body text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand/30"
        />
        <button
          type="submit"
          aria-label="Gửi câu hỏi cho AI Mentor"
          className="grid size-10 shrink-0 place-items-center rounded-control bg-primary text-primary-foreground transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>
    </SectionCard>
  );
}
