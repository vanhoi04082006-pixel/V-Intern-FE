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

/** Mẩu băng dính washi dán chéo — xoay qua --tape-rotate để hover peel ăn đúng.
 *  variant chọn màu: "blue" (mặc định) | "warm" | "candy" | "mint". */
export function Tape({
  className,
  rotate = -6,
  variant = "blue",
}: {
  className?: string;
  rotate?: number;
  variant?: "blue" | "warm" | "candy" | "mint";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "tape tape-peel pointer-events-none z-20",
        variant === "warm" && "tape-warm",
        variant === "candy" && "tape-candy",
        variant === "mint" && "tape-mint",
        className,
      )}
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

/* ══════════════════════════════════════════════════════════════════ */
/* NOTEBOOK v2 — bộ doodle mở rộng: đồ vật học sinh & dấu hiệu tay     */
/* ══════════════════════════════════════════════════════════════════ */

/** Kẹp giấy (paperclip) vẽ tay — dán kèm thẻ/giấy cho cảm giác bàn học */
export function PaperclipDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 56"
      className={cn("h-11 w-7", className)}
      fill="none"
    >
      <path
        d="M19.5 12.5 L 19.5 38.5 C 19.5 44, 15.5 48, 10.5 48 C 5.5 48, 2.5 44, 2.5 39 L 2.5 15.5 C 2.5 10, 6 6.5, 10.5 6.5 C 15 6.5, 17.5 9.5, 17.5 13.5 L 17.5 38.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Vết cà phê — vòng loang mảnh, góc dưới đậm hơn như ly đặt lệch */
export function CoffeeStainDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 80 80"
      className={cn("h-16 w-16", className)}
      fill="none"
    >
      <path
        d="M40 8 C 58 7, 71 20, 70.5 39 C 70 58, 57 72, 39 71.5 C 21 71, 8.5 57, 9 39.5 C 9.5 22, 22 8.5, 40 8"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M62 52 C 65 55.5, 64.5 60.5, 61 62.5 C 57.5 64.5, 53.5 62.5, 53.5 58.5"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M22 18.5 C 24 20, 23 23, 21 23.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/** Trái tim vẽ tay — nét đậm + fill mờ, dùng cho ghi chú cảm xúc */
export function HeartDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 30"
      className={cn("h-6 w-[32px]", className)}
      fill="none"
    >
      <path
        d="M16 27 C 9 21, 3 16.5, 3 10.5 C 3 6.5, 6 3.5, 9.5 3.5 C 12.5 3.5, 14.5 5.5, 16 8 C 17.5 5.5, 19.5 3.5, 22.5 3.5 C 26 3.5, 29 6.5, 29 10.5 C 29 16.5, 23 21, 16 27 Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.14"
      />
    </svg>
  );
}

/** Dấu tick vẽ tay — 2 nét bút chì cho trạng thái hoàn thành */
export function CheckDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 34 28"
      className={cn("h-6 w-[34px]", className)}
      fill="none"
    >
      <path
        d="M3 15.5 C 7 17, 11 20.5, 13 24.5"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M11.5 24.5 C 16 16, 22 8, 31 3"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Mũi tên xoắn 1 vòng — nét dẫn hướng "bút đỏ của giáo viên" */
export function ArrowLoopDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 56"
      className={cn("h-12 w-16", className)}
      fill="none"
    >
      <path
        d="M6 10 C 2 22, 8 34, 20 38 C 32 42, 44 36, 45 26 C 46 17, 38 12, 30 15 C 23 18, 22 27, 28 33"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M22 27 C 25 30, 28 32.5, 32 34 C 28.5 34.5, 24.5 36, 22 38.5"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Dấu sao * viết tay — chấm phá cạnh tiêu đề, dữ liệu nhỏ */
export function AsteriskDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 26 26"
      className={cn("h-4 w-4", className)}
      fill="none"
    >
      <path
        d="M13 3 C 12.6 9, 12.6 17, 13 23"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M4 8.5 C 8 11, 18 15, 22 17.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M4 17.5 C 8 15, 18 11, 22 8.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Nét scribble năng lượng — gạch chéo tập trung, cho điểm nhấn mạnh */
export function ScribbleDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 32"
      className={cn("h-6 w-12", className)}
      fill="none"
    >
      <path
        d="M4 25 C 10 14, 16 10, 22 15 C 27 19, 30 24, 36 17 C 40 12, 44 7, 46 4"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M8 28.5 C 15 20, 22 16, 30 21 C 35 24, 40 22, 45 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** Khung polaroid chuẩn — ảnh nền trắng, đế dày + caption viết tay.
 *  Nội dung ảnh truyền qua children; caption hiển thị dưới đế. */
export function PolaroidFrame({
  children,
  caption,
  className,
  captionClassName,
  tilt = -1.2,
}: {
  children: React.ReactNode;
  caption?: React.ReactNode;
  className?: string;
  captionClassName?: string;
  /** Độ nghiêng tấm ảnh (độ); hover sẽ vênh thẳng lại. */
  tilt?: number;
}) {
  return (
    <figure
      className={cn(
        "polaroid paper-tilt-hover",
        className,
      )}
      style={{ "--paper-tilt": `${tilt}deg` } as React.CSSProperties}
    >
      {children}
      {caption ? (
        <figcaption className={cn("polaroid-caption", captionClassName)}>
          {caption}
        </figcaption>
      ) : (
        <figcaption className="polaroid-caption" aria-hidden="true">
          &nbsp;
        </figcaption>
      )}
    </figure>
  );
}

