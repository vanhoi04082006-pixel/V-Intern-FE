"use client";

/**
 * AI Mentor — trò chuyện hai chiều với người hướng dẫn ảo:
 * danh sách hội thoại bên trái, khung chat bên phải.
 */

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Bot,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  archiveMentorConversation,
  createMentorConversation,
  fetchMentorConversation,
  fetchMentorConversations,
  sendMentorMessage,
  type MentorConversation,
  type MentorMessage,
} from "@/lib/api/intern";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ConversationDetail = MentorConversation & { messages: MentorMessage[] };

const PRIMARY_BTN =
  "h-12 rounded-xl border-2 border-ink bg-royal px-6 font-bold text-white shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5";

function MessageBubble({ message }: { message: MentorMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[85%] items-end gap-2", isUser && "flex-row-reverse")}>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2",
            isUser ? "border-ink bg-ink text-white" : "border-blue/40 bg-blue-mist text-blue",
          )}
          aria-hidden="true"
        >
          {isUser ? (
            <span className="text-[11px] font-extrabold">Tôi</span>
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </span>
        <div>
          <div
            className={cn(
              "whitespace-pre-wrap rounded-2xl border-2 px-4 py-2.5 text-sm leading-relaxed",
              isUser
                ? "border-ink bg-ink text-white"
                : "border-blue/30 bg-blue-mist text-ink",
            )}
          >
            {message.content}
          </div>
          {message.createdAt ? (
            <p className={cn("mt-0.5 text-[10px] font-bold text-ink-faint", isUser ? "text-right" : "text-left")}>
              {fmtDateTime(message.createdAt)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ChatPane({ conversationId, onArchive }: { conversationId: string; onArchive: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { data: conversation, isLoading, error, refetch } = useQuery({
    queryKey: ["mentor-conversation", conversationId],
    queryFn: ({ signal }) => fetchMentorConversation(conversationId, signal),
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) => sendMentorMessage(conversationId, content),
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ["mentor-conversation", conversationId] });
      const previous = queryClient.getQueryData<ConversationDetail>([
        "mentor-conversation",
        conversationId,
      ]);
      if (previous) {
        queryClient.setQueryData<ConversationDetail>(["mentor-conversation", conversationId], {
          ...previous,
          messages: [
            ...previous.messages,
            {
              id: `optimistic-${Date.now()}`,
              role: "user",
              content,
              createdAt: new Date().toISOString(),
            },
          ],
        });
      }
      return { previous };
    },
    onError: (e, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["mentor-conversation", conversationId], context.previous);
      }
      toast({ title: "Chưa gửi được tin nhắn", description: errorMessage(e), variant: "destructive" });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["mentor-conversation", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["mentor-conversations"] });
    },
  });

  const messages = conversation?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sendMessage.isPending]);

  const send = () => {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    sendMessage.mutate(content);
  };

  if (isLoading) return <LoadingState label="Đang tải cuộc trò chuyện…" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <SectionCard
      title={conversation?.title ?? "Cuộc trò chuyện"}
      description="AI Mentor trả lời dựa trên tiến độ và dữ liệu thực tập của bạn."
      actions={
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50"
          onClick={onArchive}
        >
          <Archive className="h-3.5 w-3.5" aria-hidden="true" />
          Lưu trữ
        </Button>
      }
    >
      <div className="flex h-[58vh] flex-col">
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-2xl border-2 border-dashed border-ink/15 bg-paper p-4"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <Sparkles className="h-6 w-6 text-blue" aria-hidden="true" />
              <p className="text-sm font-bold text-ink">Hãy gửi câu hỏi đầu tiên nhé!</p>
              <p className="max-w-xs text-[12px] leading-relaxed text-ink-soft">
                AI Mentor có thể giải thích đề bài, gợi ý cách làm, ôn lại kiến thức…
              </p>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {sendMessage.isPending ? (
            <div className="flex items-center gap-2 text-[12px] font-bold text-ink-faint">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue" aria-hidden="true" />
              AI Mentor đang soạn câu trả lời…
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-end gap-2">
          <Textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Hỏi AI Mentor bất cứ điều gì… (Enter để gửi, Shift+Enter xuống dòng)"
            className="flex-1 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
          />
          <Button
            className={cn(PRIMARY_BTN, "h-12 w-12 p-0")}
            aria-label="Gửi tin nhắn"
            disabled={!draft.trim() || sendMessage.isPending}
            onClick={send}
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

export function MentorView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  const { data: conversations, isLoading, error, refetch } = useQuery({
    queryKey: ["mentor-conversations"],
    queryFn: ({ signal }) => fetchMentorConversations(signal),
  });

  const createConversation = useMutation({
    mutationFn: () => createMentorConversation(),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: ["mentor-conversations"] });
      setSelectedId(conversation.id);
      toast({ title: "Đã tạo cuộc trò chuyện mới ✦", description: "Hỏi AI Mentor thôi nào!" });
    },
    onError: (e) =>
      toast({ title: "Chưa tạo được cuộc trò chuyện", description: errorMessage(e), variant: "destructive" }),
  });

  const archive = useMutation({
    mutationFn: (conversationId: string) => archiveMentorConversation(conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mentor-conversations"] });
      setSelectedId((current) => (current === confirmArchiveId ? null : current));
      setConfirmArchiveId(null);
      toast({ title: "Đã lưu trữ cuộc trò chuyện ✦" });
    },
    onError: (e) =>
      toast({ title: "Chưa lưu trữ được", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Mentor"
        description="Người hướng dẫn ảo luôn sẵn sàng — hỏi về đề bài, công nghệ, cách làm bài hay chiến lược học tập."
      />

      {isLoading ? (
        <LoadingState label="Đang tải danh sách trò chuyện…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <SectionCard
            title="Cuộc trò chuyện"
            actions={
              <Button
                size="sm"
                className="gap-1.5"
                disabled={createConversation.isPending}
                onClick={() => createConversation.mutate()}
              >
                {createConversation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Mới
              </Button>
            }
          >
            {!conversations || conversations.length === 0 ? (
              <p className="rounded-xl border-2 border-dashed border-ink/15 bg-paper px-3 py-8 text-center text-[12px] leading-relaxed text-ink-soft">
                Chưa có cuộc trò chuyện nào.
                <br />
                Bấm “Mới” để bắt đầu với AI Mentor nhé!
              </p>
            ) : (
              <ul className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={cn(
                        "w-full rounded-xl border-2 p-3 text-left transition-all",
                        conversation.id === selectedId
                          ? "border-blue/50 bg-blue-mist/60 shadow-[3px_3px_0_0_rgba(32,96,240,0.15)]"
                          : "border-ink/10 bg-paper hover:border-blue/40 hover:-translate-y-0.5",
                      )}
                    >
                      <p className="truncate text-[13px] font-extrabold text-ink">{conversation.title}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
                        {fmtDateTime(conversation.updatedAt ?? conversation.createdAt)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {selectedId ? (
            <ChatPane conversationId={selectedId} onArchive={() => setConfirmArchiveId(selectedId)} />
          ) : (
            <SectionCard>
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-blue/40 bg-blue-mist text-blue">
                  <Bot className="h-10 w-10" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-lg font-extrabold text-ink">Hỏi AI Mentor bất cứ điều gì…</p>
                  <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-soft">
                    Chọn một cuộc trò chuyện bên trái hoặc tạo mới để bắt đầu. AI Mentor hiểu ngữ cảnh
                    đồ án, nhiệm vụ và sprint của bạn để đưa lời khuyên sát nhất.
                  </p>
                  <p className="mt-2 font-hand text-[15px] text-ink-faint">
                    không có câu hỏi ngốc nghếch, chỉ có câu hỏi chưa được hỏi ✦
                  </p>
                </div>
                <Button
                  className={cn(PRIMARY_BTN, "gap-2")}
                  disabled={createConversation.isPending}
                  onClick={() => createConversation.mutate()}
                >
                  {createConversation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                  )}
                  Bắt đầu trò chuyện
                </Button>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      <Dialog open={confirmArchiveId !== null} onOpenChange={(open) => (!open ? setConfirmArchiveId(null) : undefined)}>
        <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-ink">Lưu trữ cuộc trò chuyện này?</DialogTitle>
            <DialogDescription>
              Cuộc trò chuyện sẽ được cất vào kho lưu trữ. Bạn vẫn có thể mở lại được nhưng nó sẽ
              không còn hiện nổi bật trong danh sách.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmArchiveId(null)}>
              Thôi
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50"
              disabled={archive.isPending}
              onClick={() => confirmArchiveId && archive.mutate(confirmArchiveId)}
            >
              {archive.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Archive className="h-4 w-4" aria-hidden="true" />
              )}
              Lưu trữ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
