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
 *  variant chọn màu: "blue" (mặc định) | "warm" | "candy" | "mint" | "slate". */
export function Tape({
  className,
  rotate = -6,
  variant = "blue",
}: {
  className?: string;
  rotate?: number;
  variant?: "blue" | "warm" | "candy" | "mint" | "slate";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "tape tape-peel pointer-events-none z-20",
        variant === "warm" && "tape-warm",
        variant === "candy" && "tape-candy",
        variant === "mint" && "tape-mint",
        variant === "slate" && "tape-slate",
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


/* ═══════════ Journey Notebook v3 — bộ doodle "hành trình" ═══════════
 * Thêm chất liệu kể chuyện chuyến đi: giấy bay, la bàn, ghim bản đồ,
 * vệt mực loang, dây kim chỉ và tear dọc. Mọi doodle tô theo currentColor. */

/** Giấy bay — biểu tượng "hành trình bắt đầu", bay chéo lên phải. */
export function PaperPlaneDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 56 48"
      className={cn("h-10 w-12", className)}
      fill="none"
    >
      <path
        d="M4 24 L 50 6 L 34 44 L 26 30 Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.14"
      />
      <path
        d="M26 30 L 50 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M26 30 L 20 40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/** La bàn — vòng tròn + kim chỉ Nam lệch nhẹ như vẽ tay. */
export function CompassDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className={cn("h-8 w-8", className)}
      fill="none"
    >
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeDasharray="3 5"
      />
      <path
        d="M30 14 L 25.5 25 L 15 30 L 21.5 23.5 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.22"
      />
      <circle cx="24" cy="24" r="2.4" fill="currentColor" />
    </svg>
  );
}

/** Ghim bản đồ — con ghim tròn đuôi nhọn, đánh dấu "điểm đến". */
export function PushPinDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 36 48"
      className={cn("h-9 w-7", className)}
      fill="none"
    >
      <path
        d="M18 3 C 26.5 3, 32 9, 32 16 C 32 25, 24 30, 21 36 C 20 38.5, 19.5 41, 18.5 45"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle
        cx="18"
        cy="16"
        r="6.5"
        stroke="currentColor"
        strokeWidth="2.6"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <circle cx="18" cy="16" r="2" fill="currentColor" />
    </svg>
  );
}

/** Vệt mực loang — đầu bút chấm xuống loang 3 giọt, dùng cạnh CTA/con dấu. */
export function InkSplatDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 44 32"
      className={cn("h-6 w-10", className)}
      fill="currentColor"
    >
      <path d="M21.5 2.5 C 24 2, 26 3.5, 25.5 6 C 25 8.5, 22 9, 20.5 7 C 19.2 5.2, 19.6 3, 21.5 2.5 Z" />
      <path d="M10.5 10.5 C 14 8.5, 18 10, 17.5 13.5 C 17 17, 12 18.5, 9.5 16 C 7.6 14, 8 12, 10.5 10.5 Z" opacity="0.85" />
      <path d="M31 12.5 C 34.5 12, 37 14, 36 17 C 35 19.5, 31 20, 29.5 17.5 C 28.4 15.4, 29 13, 31 12.5 Z" opacity="0.7" />
      <path d="M20 20 C 24 18.5, 28 20.5, 27 24 C 26 27, 21 28, 19 25.5 C 17.4 23.4, 18 21, 20 20 Z" opacity="0.9" />
      <path d="M6.5 24.5 C 8.5 24, 10 25.2, 9.5 27 C 9 28.6, 6.8 29, 5.8 27.5 C 5 26.2, 5.4 24.9, 6.5 24.5 Z" opacity="0.5" />
      <path d="M36.5 25 C 38.3 24.6, 39.8 25.6, 39.3 27.2 C 38.8 28.7, 36.7 29, 35.8 27.6 C 35 26.4, 35.5 25.3, 36.5 25 Z" opacity="0.45" />
    </svg>
  );
}

/** Dây kim chỉ uốn lượn nối 2 điểm — đường "hành trình" chính của trang. */
export function RouteTrailDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 40"
      className={cn("h-8 w-40", className)}
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M4 30 C 26 30, 34 10, 56 12 C 76 14, 84 32, 106 28 C 126 24, 134 8, 156 10"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="1 9"
      />
      <circle cx="4" cy="30" r="4" fill="currentColor" />
      <path
        d="M150 4.5 L 158 10 L 149.5 14.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Ribbon dấu trang — dải băng gáy sổ treo xuống, đuôi chẻ hai. */
export function RibbonBookmarkDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 56"
      className={cn("h-12 w-6", className)}
      fill="none"
    >
      <path
        d="M5 4 C 4 22, 5 38, 6.5 52 L 14 44 L 21.5 52 C 23.5 36, 24 20, 23 4 C 17 6.5, 11 6.5, 5 4 Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.16"
      />
    </svg>
  );
}

/** Tear dọc — mép giấy xé chạy dọc, chia 2 cột như xé trang sổ. */
export function VerticalTearDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 120"
      className={cn("h-32 w-2", className)}
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M6 0 L 3 12 L 9 24 L 4 36 L 10 48 L 5 60 L 9 72 L 3 84 L 8 96 L 4 108 L 7 120"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
    </svg>
  );
}
