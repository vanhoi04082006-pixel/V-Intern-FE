"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellRing } from "@/components/animate-ui/icons/bell-ring";
import { fetchUnreadCount } from "@/lib/api/outcomes";

/**
 * Unread badge for the workspace bell: loads once, then refreshes every 60s
 * and when the tab regains focus. Fails soft — a missing count never blocks
 * navigation, and 401s are swallowed (the shell handles re-auth elsewhere).
 *
 * v6: chuông là icon động animate-ui — rê chuột lên cả vùng nút thì chuông
 * rung như có thư mới; giảm chuyển động thì đứng yên.
 */
export function NotificationBell({ href }: { href: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);

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

  return (
    <Link
      aria-label={count ? `Thông báo, ${count} chưa đọc` : "Thông báo"}
      href={href}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      className="relative grid size-10 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1"
    >
      <BellRing
        size={19}
        aria-hidden="true"
        animate={hovering ? "default" : undefined}
      />
      {count ? (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-5 text-primary-foreground tabular-nums shadow-app-xs"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
