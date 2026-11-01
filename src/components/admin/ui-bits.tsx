import type { ReactNode } from "react";

/* Mảnh UI dùng chung cho các trang quản trị — giữ chất liệu sổ tay v4:
   chip trung tính đọc được, nút dạng dòng có vùng chạm 44px, dòng thời gian
   chỉ mực đứt đoạn. Không thay thế primitives; chỉ bổ sung cho call-site. */

/** Trạng thái trung tính (đã đóng, đã ngừng, đã lưu trữ…) — nền giấy + viền
 *  mực thay vì muted-on-muted để chip luôn đọc được. */
export function NeutralDot({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded border border-border bg-card px-2 py-1 text-caption font-medium text-muted-foreground shadow-app-xs">
      {children}
    </span>
  );
}

/** Khung nút hành động dạng dòng (Sửa, Xem, Lịch sử…) — vùng chạm tối thiểu
 *  44px + focus ring mực xanh theo v4; call-site tự thêm màu chữ. */
export const linkButtonClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-control px-1 text-small font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

/** Mục dòng thời gian — chỉ mực đứt đoạn dọc, marker đầu tiên (mới nhất) được
 *  tô đặc bằng mực xanh, các mục còn lại rỗng như đầu bài chưa chấm. */
export function TimelineItem({
  current = false,
  children,
  className,
}: {
  current?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={`relative border-l-2 border-dashed border-primary/45 pb-6 pl-6 last:pb-0 motion-safe:animate-paper-settle ${
        className ?? ""
      }`}
    >
      <span
        aria-hidden="true"
        className={
          current
            ? "absolute -left-[7px] top-0 size-4 rounded-full bg-primary ring-4 ring-primary/20"
            : "absolute -left-[7px] top-0.5 size-4 rounded-full border-2 border-primary/45 bg-card"
        }
      />
      {children}
    </li>
  );
}
