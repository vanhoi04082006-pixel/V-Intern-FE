"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Eraser, Loader2, SendHorizonal, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import type { ChatMsg } from "@/lib/types";

const SUGGESTIONS = [
  "Mình có nhiệm vụ sắp tới hạn, giúp mình chia nhỏ việc nhé!",
  "Đề xuất cách viết commit message rõ ràng đi!",
  "Mình đang hơi mất động lực…",
  "Review checklist cho một pull request nên có gì?",
];

async function fetchHistory(userId: string): Promise<{ messages: ChatMsg[] }> {
  const res = await fetch(`/api/ai/chat?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Không tải được lịch sử hội thoại.");
  return res.json();
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="AI đang soạn tin">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-blink-dot rounded-full bg-blue"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

export function MentorView() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["chat", user?.id],
    queryFn: () => fetchHistory(user!.id),
    enabled: Boolean(user),
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id, message }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error ?? "AI đang bận.");
      return payload as { reply: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", user?.id] });
    },
    onError: (err: Error) => {
      queryClient.invalidateQueries({ queryKey: ["chat", user?.id] });
      toast({
        title: "Tin nhắn chưa gửi được",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const messages = data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sendMutation.isPending]);

  function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message || sendMutation.isPending || !user) return;
    setInput("");
    sendMutation.mutate(message);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,64fr)_minmax(0,36fr)]">
      {/* Khung chat */}
      <section
        className="flex h-[calc(100vh-220px)] min-h-[460px] flex-col overflow-hidden rounded-2xl border-2 border-ink bg-raised shadow-[5px_5px_0_0_var(--hard-shadow)]"
        aria-label="Hội thoại cùng AI Mentor"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-ink/15 bg-coal p-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-royal bg-royal text-white">
              <Bot className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-coal bg-emerald-400" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-chalk">AI Mentor</p>
              <p className="text-[11px] text-chalk-soft">
                luôn online · trả lời như một người đồng nghiệp tận tâm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["chat", user?.id] })}
            aria-label="Làm mới hội thoại"
            title="Làm mới"
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/15 text-chalk-soft transition-colors hover:border-royal hover:text-white"
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Danh sách tin */}
        <div className="bg-dots-paper flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue" aria-hidden="true" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Sparkles className="h-8 w-8 text-blue/60" aria-hidden="true" />
              <p className="max-w-xs font-hand text-xl leading-snug text-ink-soft">
                bạn ơi, cứ hỏi mình bất cứ điều gì về hành trình thực tập nhé!
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={"flex gap-2.5 " + (m.role === "user" ? "flex-row-reverse" : "")}
              >
                <span
                  className={
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 " +
                    (m.role === "user"
                      ? "border-ink/15 bg-raised text-ink"
                      : "border-royal bg-royal text-white")
                  }
                  aria-hidden="true"
                >
                  {m.role === "user" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </span>
                <div
                  className={
                    "max-w-[82%] rounded-2xl border-2 p-3.5 text-sm leading-relaxed sm:max-w-[75%] " +
                    (m.role === "user"
                      ? "rounded-tr-sm border-ink bg-blue-mist text-ink"
                      : "rounded-tl-sm border-ink/12 bg-raised text-ink")
                  }
                >
                  {m.role === "assistant" ? (
                    <div className="space-y-2 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_p]:leading-relaxed">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">{m.content}</p>
                  )}
                </div>
              </div>
            ))
          )}

          {sendMutation.isPending ? (
            <div className="flex gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-royal bg-royal text-white">
                <Bot className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="rounded-2xl rounded-tl-sm border-2 border-ink/12 bg-raised px-4 py-3.5">
                <TypingDots />
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        {/* Ô nhập */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="border-t-2 border-dashed border-ink/15 bg-raised p-3.5"
        >
          <div className="flex items-end gap-2.5">
            <label htmlFor="mentor-input" className="sr-only">
              Nhập tin nhắn gửi AI Mentor
            </label>
            <textarea
              id="mentor-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="nhập điều bạn đang băn khoăn…"
              className="max-h-32 min-h-12 flex-1 resize-none rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 text-sm font-medium text-ink placeholder:text-ink-faint focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
            />
            <button
              type="submit"
              disabled={sendMutation.isPending || !input.trim()}
              aria-label="Gửi tin nhắn"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-royal text-white shadow-[3px_3px_0_0_var(--ink)] transition-all hover:-translate-y-0.5 hover:bg-royal-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizonal className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 px-1 font-hand text-[15px] text-ink-faint">
            enter để gửi · shift+enter để xuống dòng
          </p>
        </form>
      </section>

      {/* Gợi ý + lưu ý */}
      <aside className="space-y-5">
        <section className="rounded-2xl border-2 border-ink/10 bg-raised p-5">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <Sparkles className="h-4 w-4 text-blue" aria-hidden="true" />
            Thử hỏi những câu này
          </h3>
          <div className="mt-4 space-y-2.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={sendMutation.isPending}
                onClick={() => handleSend(s)}
                className="w-full rounded-xl border-2 border-dashed border-ink/20 bg-paper p-3.5 text-left text-[13px] font-medium leading-snug text-ink-soft transition-all hover:-translate-y-0.5 hover:border-blue hover:bg-blue-mist hover:text-blue disabled:pointer-events-none disabled:opacity-50"
              >
                “{s}”
              </button>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border-2 border-ink bg-coal p-5 text-chalk">
          <div className="absolute inset-0 bg-dots-chalk" aria-hidden="true" />
          <div className="relative">
            <p className="font-hand text-xl leading-snug text-blue">
              lời nhắc nhỏ từ mentor
            </p>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-chalk-soft">
              <li>AI đưa ra <strong className="text-chalk">gợi ý tham khảo</strong> — quyết định cuối cùng vẫn là của bạn.</li>
              <li>Nhờ AI chia nhỏ nhiệm vụ lớn thành các bước 25 phút.</li>
              <li>Điểm số chính thức do giảng viên chốt sau mỗi sprint.</li>
            </ul>
          </div>
        </section>
      </aside>
    </div>
  );
}
