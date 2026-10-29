"use client";

import { cn } from "@/lib/utils";

const AVATAR_STYLES = [
  "bg-royal text-white",
  "bg-blue-mist text-blue border-2 border-blue/40",
  "bg-ink text-paper",
  "bg-blue text-white",
];

/** Avatar chữ cái đầu — màu cố định theo id (hoặc tên), không cần ảnh. */
export function InitialAvatar({
  name,
  id,
  size = "md",
  className,
}: {
  name: string;
  id?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  let hash = 0;
  for (const ch of id ?? name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const style = AVATAR_STYLES[Math.abs(hash) % AVATAR_STYLES.length];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-extrabold",
        size === "sm" && "h-8 w-8 text-[11px]",
        size === "md" && "h-10 w-10 text-xs",
        size === "lg" && "h-14 w-14 text-base",
        style,
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
