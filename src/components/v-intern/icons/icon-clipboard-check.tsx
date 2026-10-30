import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Thời hạn & ghi nhận / Đánh giá" · bảng kẹp dấu tick. */
export const IconClipboardCheck: UiIcon = function IconClipboardCheck({ size = 24, ...props }: UiIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7.3 5h9.4v15.2H7.3z" />
      <path d="M9.6 5V3.4h4.8V5" />
      <path d="M9.8 8.6h4.4" />
      <path d="m9.8 13.2 1.8 2 2.8-3.8" />
    </svg>
  );
};
