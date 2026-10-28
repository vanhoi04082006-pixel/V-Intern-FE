"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./primitives";

export function ChatBubble({
  role,
  name,
  children,
  time,
}: {
  role: "user" | "assistant";
  name?: string;
  children: React.ReactNode;
  time?: string;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {isUser ? (
        name ? <UserAvatar name={name} size={30} /> : null
      ) : (
        <span className="grid size-[30px] shrink-0 place-items-center rounded-full border border-brand/30 bg-brand/10 text-brand-bright">
          <Sparkles className="size-3.5 icon" />
        </span>
      )}
      <div className={cn("max-w-[82%] min-w-0", isUser && "items-end text-right")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed",
            isUser
              ? "rounded-tr-md bg-brand/15 text-ink border border-brand/20"
              : "rounded-tl-md bg-panel-2 border border-line text-ink"
          )}
        >
          {children}
        </div>
        {time ? (
          <div className={cn("mt-1 text-[10px] text-faint", isUser && "text-right")}>{time}</div>
        ) : null}
      </div>
    </div>
  );
}

export function TypingDots({ label = "AI đang soạn…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-[30px] shrink-0 place-items-center rounded-full border border-brand/30 bg-brand/10 text-brand-bright">
        <Sparkles className="size-3.5 icon" />
      </span>
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-line bg-panel-2 px-4 py-2.5">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-pulse-soft rounded-full bg-brand-bright"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>
        <span className="text-xs text-dim">{label}</span>
      </div>
    </div>
  );
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Nhập tin nhắn…",
  busy,
  disabled,
  hint,
  submitLabel = "Gửi",
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  busy?: boolean;
  disabled?: boolean;
  hint?: React.ReactNode;
  submitLabel?: string;
  rows?: number;
}) {
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy && !disabled && value.trim()) onSubmit();
    }
  };
  return (
    <div className="rounded-2xl border border-line bg-panel p-2.5 focus-within:border-line-strong">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-faint disabled:opacity-50"
      />
      <div className="flex items-center justify-between gap-3 px-1 pt-1">
        <span className="text-[11px] text-faint">{hint ?? "Enter để gửi · Shift+Enter xuống dòng"}</span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || disabled || !value.trim()}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-xs font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
        >
          <Send className="size-3.5 icon" />
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
