"use client";

import { cn } from "@/lib/utils";

/**
 * Bộ doodle vẽ tay — SVG nét mực không đối xứng hoàn toàn
 * để giữ cảm giác con người tự tay phác họa.
 * Mọi doodle tô màu theo `currentColor`.
 */

export function SquiggleUnderline({
  className,
  draw = false,
}: {
  className?: string;
  /** Vẽ dần theo scroll (pathLength chuẩn hoá 120; tôn trọng reduced-motion). */
  draw?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 10"
      preserveAspectRatio="none"
      className={cn("h-[10px] w-full", className)}
    >
      <path
        d="M2 7 Q 14 2.5, 27 6 T 52 5.5 T 77 6.5 T 102 5 T 118 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={120}
        className={draw ? "squiggle-draw" : undefined}
      />
    </svg>
  );
}

/** Mũi tên cong vẽ tay, chỉ xuống dưới */
export function HandArrowDown({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 72"
      className={cn("h-16 w-11", className)}
      fill="none"
    >
      <path
        d="M36 4 C 20 22, 14 38, 21 58"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M12 50 C 15 55, 18 59, 22 63 C 25 58, 29 54, 34 51"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Mũi tên cong vẽ tay, chỉ sang phải */
export function HandArrowRight({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 72 48"
      className={cn("h-11 w-[72px]", className)}
      fill="none"
    >
      <path
        d="M4 14 C 22 6, 44 8, 60 20"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M50 12 C 55 15, 59 18, 63 22 C 58 25, 54 29, 51 34"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function StarDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className={cn("h-6 w-6", className)}
      fill="none"
    >
      <path
        d="M20 3.5 C 21 12, 23 15, 31 16.5 C 24 18.5, 22 21, 20.5 30 C 19 22, 16.5 19, 9.5 17 C 17 15, 19.5 11, 20 3.5 Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.18"
      />
    </svg>
  );
}

export function SparkleDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 28"
      className={cn("h-5 w-5", className)}
      fill="none"
    >
      <path
        d="M14 3 C 14.6 9, 16 11, 22 12 C 16.6 13.4, 15 15.4, 14.4 22 C 13.8 15.6, 12 13.4, 6.5 12 C 12 11, 13.4 9, 14 3 Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M22.5 19.5 C 22.8 22, 23.5 22.8, 26 23.2 C 23.6 23.8, 22.8 24.6, 22.4 27 C 22 24.7, 21.2 23.8, 18.8 23.3 C 21.2 22.8, 22.2 22, 22.5 19.5 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
    </svg>
  );
}

/** Vòng tròn vẽ tay quanh số thứ tự */
export function CircleDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 52"
      preserveAspectRatio="none"
      className={cn("h-[52px] w-16", className)}
      fill="none"
    >
      <path
        d="M31 4 C 15 3.5, 5 12, 4.5 25 C 4 38, 14 48, 30 48.5 C 45 49, 58.5 41, 59.5 27 C 60.5 13, 47 4.5, 33 4"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Mẩu băng dính washi dán chéo — xoay qua --tape-rotate để hover peel ăn đúng */
export function Tape({
  className,
  rotate = -6,
}: {
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("tape tape-peel pointer-events-none z-20", className)}
      style={{ "--tape-rotate": `${rotate}deg` } as React.CSSProperties}
    />
  );
}

/** Con dấu mộc tròn xoay nhẹ — dùng utility .stamp-moc (nét không đều + mực loang) */
export function StampBadge({
  children,
  className,
  rotate = -12,
}: {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      className={cn(
        "stamp-moc inline-flex items-center justify-center px-5 py-2 font-mono text-[11px] tracking-[0.14em]",
        className,
      )}
      style={{ "--stamp-rotate": `${rotate}deg` } as React.CSSProperties}
    >
      {children}
    </span>
  );
}

/** Dấu cộng trang trí kiểu sketch */
export function CrossDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("h-4 w-4", className)}
      fill="none"
    >
      <path
        d="M5 6.5 C 9 10.5, 14.5 16, 19.5 19"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M6.5 18.5 C 10 14, 14.5 9.5, 18.5 5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
