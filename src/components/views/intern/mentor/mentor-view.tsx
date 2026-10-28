"use client";

import * as React from "react";
import {
  Archive,
  ArrowLeft,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useResource } from "@/lib/client/use-resource";
import { relativeTime } from "@/lib/client/labels";
import {
  mentorApi,
  type MentorConversation,
  type MentorMessage,
} from "@/lib/client/api";
import { useSession } from "@/lib/client/session";
import { ViewFrame } from "@/components/shared/view";
import {
  Empty,
  PageHeader,
  Panel,
  ToneBadge,
} from "@/components/shared/primitives";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { ChatBubble, ChatComposer, TypingDots } from "@/components/shared/chat";
import { ConfirmDialog } from "@/components/shared/confirm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** /intern/mentor — chat với Mentor AI (LLM thật, có thể mất ~10s). */
export function MentorView() {
  const [tab, setTab] = React.useState<"active" | "archived">("active");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [archiveTarget, setArchiveTarget] = React.useState<MentorConversation | null>(null);
  const [archiving, setArchiving] = React.useState(false);

  const list = useResource(
    () => mentorApi.conversations({ page: 1, pageSize: 50, status: tab }),
    [tab]
  );
  const conversations = list.data?.data ?? [];

  // Desktop: tự chọn cuộc trò chuyện đầu tiên; mobile: để trống (bấm mới mở chat)
  React.useEffect(() => {
    const exists = selectedId != null && conversations.some((c) => c.id === selectedId);
    if (exists) return;
    const isDesktop =
      typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
    setSelectedId(isDesktop && conversations.length > 0 ? conversations[0].id : null);
  }, [conversations, selectedId]);

  const createConversation = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const conv = await mentorApi.createConversation();
      toast.success("Đã tạo cuộc trò chuyện mới.");
      setSelectedId(conv.id);
      list.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không tạo được cuộc trò chuyện.");
    } finally {
      setCreating(false);
    }
  };

  const archiveConversation = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await mentorApi.archive(archiveTarget.id);
      toast.success(`Đã lưu trữ “${archiveTarget.title}”.`);
      setArchiveTarget(null);
      list.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không lưu trữ được.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Trợ lý AI"
        title="Mentor AI"
        description="Cố vấn kỹ thuật 24/7 — hỏi về task, kiến trúc, testing hay sự nghiệp. Trả lời có thể mất vài giây."
        actions={
          <Button
            onClick={createConversation}
            disabled={creating}
            className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
          >
            <Plus className="size-3.5 icon" /> Cuộc trò chuyện mới
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[320px_1fr]">
        {/* ------------------------- Cột trái: danh sách ------------------------- */}
        <Panel
          className={cn(
            "min-w-0 overflow-hidden",
            selectedId != null && "hidden lg:block"
          )}
        >
          <div className="border-b border-line p-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "archived")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Hoạt động</TabsTrigger>
                <TabsTrigger value="archived">Lưu trữ</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="max-h-[560px] overflow-y-auto p-2">
            {list.loading && !list.data ? (
              <div className="space-y-2 p-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-line p-3">
                    <div className="h-3.5 w-2/3 rounded-md skeleton-shimmer bg-white/[0.05]" />
                    <div className="mt-2 h-3 w-1/3 rounded-md skeleton-shimmer bg-white/[0.05]" />
                  </div>
                ))}
              </div>
            ) : list.error && !list.data ? (
              <div className="p-3">
                <ErrorBlock error={list.error} onRetry={list.reload} />
              </div>
            ) : conversations.length === 0 ? (
              <Empty
                className="py-8"
                icon={<Sparkles className="size-5 icon" />}
                title={
                  tab === "active"
                    ? "Chưa có cuộc trò chuyện nào"
                    : "Chưa có gì trong lưu trữ"
                }
                description={
                  tab === "active"
                    ? "Bắt đầu hỏi Mentor AI về task, kỹ thuật hay định hướng nghề nghiệp."
                    : "Các cuộc trò chuyện đã lưu trữ sẽ xuất hiện tại đây."
                }
                action={
                  tab === "active" ? (
                    <Button
                      size="sm"
                      onClick={createConversation}
                      disabled={creating}
                      className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
                    >
                      <Plus className="size-3.5 icon" /> Bắt đầu hỏi
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="space-y-1.5">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <div
                      className={cn(
                        "group flex items-center gap-1 rounded-xl border p-3 transition-colors",
                        selectedId === c.id
                          ? "border-brand/40 bg-brand/[0.06]"
                          : "border-transparent hover:border-line hover:bg-panel-2"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p
                          className={cn(
                            "truncate text-[13px] font-medium",
                            selectedId === c.id ? "text-ink" : "text-ink/90"
                          )}
                          title={c.title}
                        >
                          {c.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                          <span>{relativeTime(c.lastMessageAt)}</span>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="size-3 icon" />
                            {c.messageCount}
                          </span>
                        </p>
                      </button>
                      {c.status === "archived" ? (
                        <ToneBadge tone="zinc" className="shrink-0">
                          <Archive className="size-3 icon" /> Lưu trữ
                        </ToneBadge>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Tùy chọn cuộc trò chuyện"
                              className="grid size-7 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-panel hover:text-ink"
                            >
                              <MoreHorizontal className="size-4 icon" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-line bg-panel-2">
                            <DropdownMenuItem onClick={() => setArchiveTarget(c)}>
                              <Archive className="size-4" /> Lưu trữ cuộc trò chuyện
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        {/* ------------------------- Cột phải: chat ------------------------- */}
        <div className={cn("min-w-0", selectedId == null && "hidden lg:block")}>
          {selectedId ? (
            <MentorChatPane
              conversationId={selectedId}
              onBack={() => setSelectedId(null)}
              onChanged={list.reload}
            />
          ) : (
            <Panel>
              <Empty
                className="py-16"
                icon={<Sparkles className="size-5 icon" />}
                title="Chọn một cuộc trò chuyện"
                description="Hoặc tạo cuộc trò chuyện mới để bắt đầu hỏi Mentor AI."
                action={
                  <Button
                    size="sm"
                    onClick={createConversation}
                    disabled={creating}
                    className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
                  >
                    <Plus className="size-3.5 icon" /> Cuộc trò chuyện mới
                  </Button>
                }
              />
            </Panel>
          )}
        </div>
      </div>

      {/* Xác nhận lưu trữ */}
      <ConfirmDialog
        open={archiveTarget != null}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title="Lưu trữ cuộc trò chuyện?"
        description={`“${archiveTarget?.title ?? ""}” sẽ được chuyển sang tab Lưu trữ. Bạn vẫn có thể xem lại lịch sử.`}
        confirmLabel="Lưu trữ"
        busy={archiving}
        onConfirm={archiveConversation}
      />
    </ViewFrame>
  );
}

/* ============================== Chat pane ============================== */

function MentorChatPane({
  conversationId,
  onBack,
  onChanged,
}: {
  conversationId: string;
  onBack: () => void;
  onChanged: () => void;
}) {
  const { user } = useSession();
  const convRes = useResource(
    () => mentorApi.conversation(conversationId),
    [conversationId]
  );
  const conversation = convRes.data?.conversation ?? null;
  const messages = convRes.data?.messages ?? [];

  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [optimistic, setOptimistic] = React.useState<MentorMessage | null>(null);
  const [followUps, setFollowUps] = React.useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Reset trạng thái khi đổi cuộc trò chuyện
  React.useEffect(() => {
    setDraft("");
    setFollowUps([]);
    setOptimistic(null);
  }, [conversationId]);

  const displayed = optimistic ? [...messages, optimistic] : messages;
  const archived = conversation?.status === "archived";

  // Tự cuộn xuống cuối khi có tin nhắn mới / đang gõ
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [displayed.length, sending]);

  const send = async () => {
    const content = draft.trim();
    if (!content || sending || archived) return;
    setDraft("");
    setFollowUps([]);
    setOptimistic({
      id: `optimistic-${Date.now()}`,
      role: "user",
      content,
      at: new Date().toISOString(),
      taskId: null,
    });
    setSending(true);
    try {
      const res = await mentorApi.send(conversationId, content);
      setOptimistic(null);
      setFollowUps(res.followUps ?? []);
      convRes.reload();
      onChanged();
    } catch (err) {
      setOptimistic(null);
      toast.error(err instanceof Error ? err.message : "Không gửi được tin nhắn.");
      convRes.reload();
    } finally {
      setSending(false);
    }
  };

  if (convRes.loading && !convRes.data) {
    return <LoadingBlock rows={4} className="min-h-[420px]" />;
  }
  if (convRes.error && !convRes.data) {
    return <ErrorBlock error={convRes.error} onRetry={convRes.reload} />;
  }

  return (
    <Panel className="flex h-[calc(100vh-300px)] min-h-[480px] flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại danh sách"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-dim transition-colors hover:bg-panel-2 hover:text-ink lg:hidden"
        >
          <ArrowLeft className="size-4 icon" />
        </button>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand-bright">
          <Sparkles className="size-4 icon" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink" title={conversation?.title}>
            {conversation?.title ?? "Cuộc trò chuyện"}
          </p>
          <p className="text-[11px] text-faint">
            Mentor AI · trả lời trong vài giây
          </p>
        </div>
        {archived ? (
          <ToneBadge tone="zinc">
            <Archive className="size-3 icon" /> Đã lưu trữ
          </ToneBadge>
        ) : null}
      </header>

      {/* Tin nhắn */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
        {displayed.length === 0 && !sending ? (
          <Empty
            className="py-10"
            icon={<Sparkles className="size-5 icon" />}
            title="Hỏi Mentor AI bất cứ điều gì"
            description="Ví dụ: “Zustand và Context dùng khi nào?”, “Sao trang của em render lại chậm?”…"
          />
        ) : (
          displayed.map((m) => (
            <ChatBubble
              key={m.id}
              role={m.role}
              name={m.role === "user" ? (user?.displayName ?? "Bạn") : undefined}
              time={relativeTime(m.at)}
            >
              <span className="whitespace-pre-line">{m.content}</span>
            </ChatBubble>
          ))
        )}
        {sending ? (
          <TypingDots label="Mentor AI đang trả lời…" />
        ) : null}
      </div>

      {/* Gợi ý câu hỏi kế + composer */}
      <div className="space-y-2.5 border-t border-line p-3 md:p-4">
        {!sending && followUps.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {followUps.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setDraft(q)}
                className="rounded-full border border-line bg-panel px-3 py-1.5 text-left text-[11px] text-dim transition-colors hover:border-brand/40 hover:bg-brand/[0.06] hover:text-brand-bright"
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSubmit={send}
          busy={sending}
          disabled={archived}
          placeholder={
            archived
              ? "Cuộc trò chuyện đã lưu trữ — không thể nhắn thêm."
              : "Hỏi Mentor AI bất cứ điều gì…"
          }
          submitLabel="Gửi"
          rows={2}
        />
      </div>
    </Panel>
  );
}
