"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { BellRing } from "@/components/animate-ui/icons/bell-ring";
import { IconCheckCheck, IconInbox } from "@/components/v-intern/icons";
import { InkBadge } from "@/components/notebook/ui";
import { cn } from "@/lib/utils";
import {
  fetchUnreadCount,
  getNotifications,
  markAllNotifications,
  markNotification,
  notificationLinkForRole,
  parseNotification,
} from "@/lib/api/outcomes";

/** Mục thông báo thật trả về từ GET /notifications (xem parseNotification
 *  trong src/lib/api/outcomes.ts) — dùng ReturnType để luôn khớp API thật. */
type BellNotification = ReturnType<typeof parseNotification>;

/** "6 phút trước" kiểu ghi chú sổ tay — thuần định dạng hiển thị. */
function relativeTimeVN(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const minutes = Math.floor((Date.now() - then) / 60_000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

/**
 * Chuông thông báo popover (port sandbox Journey v3): ~6 mục mới nhất từ API
 * thật, chấm chưa đọc, "Đọc tất cả" gọi endpoint thật, footer tới trang thông
 * báo của role hiện tại.
 *
 * Badge unread: tải 1 lần rồi refresh 60s / khi tab lấy lại focus — fail soft,
 * 401 nuốt im lặng (shell xử lý re-auth chỗ khác). Khi số chưa đọc TĂNG so với
 * lần poll trước, chuông nhún một nhịp (bob) — tôn trọng giảm chuyển động.
 *
 * v6: chuông là icon động animate-ui — rê chuột lên cả vùng nút thì chuông
 * rung như có thư mới; giảm chuyển động thì đứng yên.
 */
export function NotificationBell({ href }: { href: string }) {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BellNotification[] | null>(null);
  const [itemsFailed, setItemsFailed] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const reduced = useReducedMotion() ?? false;
  const bobControls = useAnimationControls();

  const load = useCallback(async (signal: AbortSignal) => {
    try {
      setCount(await fetchUnreadCount(signal));
    } catch (error) {
      if (signal.aborted) return;
      const status =
        typeof error === "object" && error && "statusCode" in error
          ? (error as { statusCode?: number }).statusCode
          : undefined;
      if (status !== 401) setCount(null);
    }
  }, []);

  useEffect(() => {
    let controller: AbortController | null = null;
    const run = () => {
      controller?.abort();
      controller = new AbortController();
      void load(controller.signal);
    };
    run();
    const timer = setInterval(run, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      controller?.abort();
    };
  }, [load]);

  /* Mở popover → kéo trang đầu (6 mục mới nhất) từ API thật; đóng thì hủy.
   * Reset trạng thái danh sách thực hiện trong handler nút bấm (không setState
   * trực tiếp trong effect). Lỗi → giữ popover read-only với dòng chú thích
   * + link "Xem tất cả". */
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    getNotifications(1, false, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setItems(page.items.slice(0, 6));
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setItems([]);
        setItemsFailed(true);
      });
    return () => controller.abort();
  }, [open]);

  /* Đóng khi click ngoài hoặc Esc (focus trả về nút chuông). */
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node))
        setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* Bob nhẹ khi có thông báo CHƯA ĐỌC MỚI đến (so với lần poll trước). */
  const prevUnread = useRef<number | null>(null);
  useEffect(() => {
    const grew =
      prevUnread.current !== null &&
      count !== null &&
      count > prevUnread.current;
    prevUnread.current = count;
    if (!grew || reduced) return;
    void bobControls.start({
      y: [0, -5, 0, -3, 0],
      transition: { duration: 0.85, ease: "easeInOut" },
    });
  }, [count, reduced, bobControls]);

  function openItem(item: BellNotification) {
    if (!item.readAt) {
      /* Đánh dấu đã đọc — cập nhật UI lạc quan, POST thật fire-and-forget
       * như sandbox; trang thông báo là nơi hiển thị lỗi nếu endpoint hụt. */
      const now = new Date().toISOString();
      setItems(
        (prev) =>
          prev?.map((n) => (n.id === item.id ? { ...n, readAt: now } : n)) ??
          prev,
      );
      setCount((c) => (typeof c === "number" && c > 0 ? c - 1 : c));
      void markNotification(item.id).catch(() => undefined);
    }
    setOpen(false);
    const role = href.split("/")[1] ?? "";
    router.push(notificationLinkForRole(item.linkUrl, role) ?? href);
  }

  async function markAll() {
    if (!count) return;
    setMarkingAll(true);
    try {
      await markAllNotifications();
      const now = new Date().toISOString();
      setItems(
        (prev) => prev?.map((n) => (n.readAt ? n : { ...n, readAt: now })) ?? prev,
      );
      setCount(0);
    } catch {
      /* fail soft: giữ nguyên trạng thái — trang thông báo sẽ báo lỗi. */
    } finally {
      setMarkingAll(false);
    }
  }

  const label = count ? `Thông báo, ${count} chưa đọc` : "Thông báo";

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          /* Reset danh sách khi (re)mở để luôn kéo dữ liệu mới — làm ở handler
           * (event), không setState trong effect. */
          if (!open) {
            setItems(null);
            setItemsFailed(false);
          }
          setOpen((value) => !value);
        }}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        className="relative grid size-11 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1"
      >
        <motion.span animate={bobControls} className="inline-flex">
          <BellRing
            size={19}
            aria-hidden="true"
            animate={hovering ? "default" : undefined}
          />
        </motion.span>
        {count ? (
          <span
            key={count}
            aria-hidden="true"
            className="animate-pop-in absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-5 text-primary-foreground tabular-nums shadow-app-xs"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.16 }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,360px)] overflow-hidden rounded-[12px_14px_12px_14px] border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-ink-4"
            role="dialog"
            aria-label="Thông báo mới nhất"
          >
            <div className="flex items-center justify-between gap-2 border-b-2 border-[var(--ink)] bg-[var(--blue-mist)] px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <p className="text-body font-bold text-[var(--ink)]">Hộp thư</p>
                {count ? (
                  <InkBadge
                    tone="blue"
                    className="shrink-0 px-2 py-0 text-[0.62rem]"
                  >
                    <span className="tabular-nums">{count}</span> chưa đọc
                  </InkBadge>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void markAll()}
                disabled={!count || markingAll}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-caption font-semibold text-[var(--royal)] transition-colors hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconCheckCheck size={14} aria-hidden="true" />
                {markingAll ? "Đang đánh dấu…" : "Đọc tất cả"}
              </button>
            </div>
            <ul className="max-h-96 overflow-y-auto">
              {items === null && !itemsFailed ? (
                <li
                  role="status"
                  className="px-4 py-6 text-center text-caption text-muted-foreground"
                >
                  Đang tải hộp thư…
                </li>
              ) : null}
              {itemsFailed ? (
                <li
                  role="status"
                  className="px-4 py-6 text-center text-caption text-muted-foreground"
                >
                  Không tải được danh sách — mở trang thông báo để xem đầy đủ.
                </li>
              ) : null}
              {items?.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className={cn(
                      "block w-full px-4 py-3 text-left transition-colors hover:bg-[var(--blue-mist)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                      item.readAt
                        ? "opacity-70"
                        : "bg-[color-mix(in_srgb,var(--blue-mist)_55%,transparent)]",
                    )}
                  >
                    <span className="mb-1 flex items-center gap-2">
                      {!item.readAt ? (
                        <span
                          role="img"
                          aria-label="Chưa đọc"
                          className="ws-dot shrink-0"
                          style={{
                            background: "var(--royal)",
                            borderColor: "transparent",
                          }}
                        />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate text-small font-semibold leading-snug text-[var(--ink)]">
                        {item.title}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-caption text-[var(--ink-soft)]">
                      {relativeTimeVN(item.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
              {items !== null && items.length === 0 && !itemsFailed ? (
                <li className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <IconInbox
                    size={30}
                    aria-hidden="true"
                    className="text-[var(--ink-soft)]"
                  />
                  <p className="font-hand text-[0.95rem] text-[var(--ink-soft)]">
                    Chưa có gì mới trong hộp thư cả — yên tâm làm việc thôi! ✎
                  </p>
                </li>
              ) : null}
            </ul>
            <div className="border-t-2 border-dashed border-[color-mix(in_srgb,var(--ink)_25%,transparent)]">
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center justify-center gap-1 text-caption font-bold text-[var(--royal)] transition-colors hover:bg-[var(--blue-mist)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Xem tất cả thông báo →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
