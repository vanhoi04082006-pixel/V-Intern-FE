"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Số đếm mượt khi xuất hiện / thay đổi. */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
  duration = 700,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = React.useState(0);
  const fromRef = React.useRef(0);

  React.useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const formatted = display.toLocaleString("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/** Đồng hồ đếm ngược mm:ss từ giây còn lại. */
export function CountdownTimer({
  secondsRemaining,
  className,
  warnUnder = 300,
}: {
  secondsRemaining: number;
  className?: string;
  warnUnder?: number;
}) {
  const [left, setLeft] = React.useState(secondsRemaining);

  React.useEffect(() => setLeft(secondsRemaining), [secondsRemaining]);

  React.useEffect(() => {
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const m = Math.floor(left / 60);
  const s = left % 60;
  const danger = left <= 0;
  const warn = left < warnUnder;

  return (
    <span
      role="timer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-sm font-semibold tabular-nums",
        danger
          ? "border-rose/30 bg-rose/10 text-rose"
          : warn
            ? "border-amber/30 bg-amber/10 text-amber"
            : "border-line bg-panel-2 text-ink",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", danger ? "bg-rose" : warn ? "bg-amber animate-pulse-soft" : "bg-brand")} />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}
