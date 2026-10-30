"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IconBell } from "@/components/v-intern/icons";
import { fetchUnreadCount } from "@/lib/api/outcomes";

/**
 * Unread badge for the workspace bell: loads once, then refreshes every 60s
 * and when the tab regains focus. Fails soft — a missing count never blocks
 * navigation, and 401s are swallowed (the shell handles re-auth elsewhere).
 */
export function NotificationBell({ href }: { href: string }) {
  const [count, setCount] = useState<number | null>(null);

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
      className="relative grid size-10 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
    >
      <IconBell size={19} aria-hidden="true" />
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
