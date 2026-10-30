import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tape } from "@/components/v-intern/doodles";

/* =====================================================================
 * Notebook primitives ("Sổ tay hành trình") — nguyên thủy notebook dùng
 * chung cho mọi vai. Mật độ trang trí (tape/mộc/doodle) điều khiển bằng
 * CSS theo [data-workspace-role] trong notebook.css, component giữ thuần
 * cấu trúc. Chữ ghi chú ngắn dùng Patrick Hand qua .font-hand.
 * ===================================================================== */

/** Thẻ ghi chú giấy vàng — dùng cho gợi ý AI, lưu ý mentor, empty state. */
export function NoteCard({
  children,
  title,
  tape = false,
  rotate = -0.8,
  className,
}: {
  children: ReactNode;
  /** Tiêu đề viết tay ngắn (Patrick Hand). */
  title?: string;
  /** Dán mẩu băng dính chéo góc trên. */
  tape?: boolean;
  rotate?: number;
  className?: string;
}) {
  return (
    <aside
      className={cn("sticky-note p-4 sm:p-5", className)}
      style={{ "--note-rotate": `${rotate}deg` } as React.CSSProperties}
    >
      {tape && (
        <Tape className="-top-3 left-6" rotate={-5} />
      )}
      {title && <p className="note-card-title font-hand mb-1.5 text-lg leading-snug">{title}</p>}
      <div className="note-card-body text-small leading-relaxed">{children}</div>
    </aside>
  );
}

/** Ghi chú lề — dòng chú thích nhỏ đặt cạnh nội dung chính. */
export function MarginNote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "margin-note font-hand text-small leading-relaxed text-ink-soft",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Con dấu mộc — trạng thái quan trọng (ĐÃ DUYỆT / ĐÃ HOÀN THÀNH / PASS). */
export function StampMoc({
  children,
  tone = "red",
  size = "md",
  thump = false,
  rotate = -3,
  className,
}: {
  children: ReactNode;
  /** Mực đỏ (mặc định) hay mực xanh. */
  tone?: "red" | "blue";
  size?: "md" | "sm";
  /** Hiệu ứng đóng dấu khi mount (tôn trọng reduced-motion). */
  thump?: boolean;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "stamp-moc",
        size === "sm" && "stamp-moc-sm",
        thump && "animate-stamp-thump",
        tone === "red" ? "text-[var(--stamp-red)]" : "text-[var(--stamp-blue)]",
        className,
      )}
      style={{ "--stamp-rotate": `${rotate}deg` } as React.CSSProperties}
    >
      {children}
    </span>
  );
}

/** Đường xé giấy — phân mục giữa các section thay border liền. */
export function PaperDivider({ className }: { className?: string }) {
  return <hr aria-hidden="true" className={cn("divider-torn my-6", className)} />;
}
