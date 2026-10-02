import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

import { CardLinkAction, SectionCard } from "./intern-primitives";
import { INTERN_TONES } from "./intern-ui-tones";
import type { InternWorkspaceState } from "./data/intern-mock-data";

/**
 * Card "Thông báo gần đây" (state active) — 4 mock notifications theo task
 * spec. Chưa đọc hiển thị bằng chấm màu + nền nhẹ; số chưa đọc derive từ
 * `unread` (không hardcode "3"). Trạng thái KHÔNG chỉ dùng màu: mỗi item
 * chưa đọc có thêm "•" text sr-only.
 */
export function NotificationsCard({
  notifications,
  actionLabel,
}: {
  notifications: Extract<
    InternWorkspaceState,
    { status: "active" }
  >["notifications"];
  actionLabel: string;
}) {
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <SectionCard
      id="thong-bao-gan-day"
      icon={Bell}
      tone="blue"
      title="Thông báo gần đây"
      titleSuffix={
        unreadCount > 0 ? `${unreadCount} chưa đọc` : undefined
      }
      actions={<CardLinkAction label={actionLabel} />}
    >
      <ul className="flex flex-col">
        {notifications.map((item) => {
          const toneStyle = INTERN_TONES[item.tone];

          return (
            <li
              key={item.id}
              className={cn(
                "flex items-start gap-3 py-3 first:pt-0 last:pb-0",
                item.unread && "rounded-lg bg-blue-50/40 px-2.5"
              )}
            >
              <span
                aria-hidden="true"
                className={cn("mt-1.5 size-2 shrink-0 rounded-full", toneStyle.bar)}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-[13px] leading-relaxed",
                    item.unread ? "font-semibold text-navy" : "text-slate-600"
                  )}
                >
                  {item.text}
                  {item.unread ? (
                    <span className="sr-only"> (chưa đọc)</span>
                  ) : null}
                </p>
              </div>
              <time className="shrink-0 text-xs text-slate-400">
                {item.timeLabel}
              </time>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
