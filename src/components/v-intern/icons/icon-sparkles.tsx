import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Cấu hình AI" + điểm nhấn landing · lấp lánh sao bốn cánh. */
export const IconSparkles: UiIcon = function IconSparkles({ size = 24, ...props }: UiIconProps) {
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
      <path d="M11.5 3.4c.4 4.3 2.4 6.3 6.7 6.7-4.3.4-6.3 2.4-6.7 6.7-.4-4.3-2.4-6.3-6.7-6.7 4.3-.4 6.3-2.4 6.7-6.7Z" />
      <path d="M18.7 14.1c.2 2.2 1.4 3.4 3.6 3.6-2.2.2-3.4 1.4-3.6 3.6-.2-2.2-1.4-3.4-3.6-3.6 2.2-.2 3.4-1.4 3.6-3.6Z" />
    </svg>
  );
};
