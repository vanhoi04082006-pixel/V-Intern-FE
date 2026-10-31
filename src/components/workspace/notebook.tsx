import type { ReactNode } from "react";
import Image from "next/image";
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

/** Trang sổ trống — artwork "open notebook" cho empty state mọi vai.
 *  Dùng cho danh sách rỗng/chưa có dữ liệu: kèm tiêu đề, gợi ý và slot hành động.
 */
export function NotebookEmpty({
  title,
  hint,
  action,
  className,
  artClassName,
}: {
  /** Tiêu đề chính (VD: "Chưa có nhiệm vụ nào"). */
  title: ReactNode;
  /** Dòng gợi ý viết tay bên dưới. */
  hint?: ReactNode;
  /** Nút/hành động tùy chọn (VD: link "Xem thư viện dự án"). */
  action?: ReactNode;
  className?: string;
  artClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-panel border border-dashed bg-card/60 p-8 text-center",
        className,
      )}
    >
      <Image
        src="/images/empty-states/open-notebook.png"
        alt=""
        width={220}
        height={220}
        aria-hidden="true"
        sizes="220px"
        className={cn("h-36 w-auto opacity-90", artClassName)}
      />
      <div className="max-w-sm">
        <p className="font-semibold text-foreground">{title}</p>
        {hint ? (
          <p className="mt-1.5 font-hand text-[17px] leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
