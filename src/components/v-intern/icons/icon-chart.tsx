import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Hiệu suất" · đường biểu đồ uốn lượn vẽ tay. */
export const IconChart: UiIcon = function IconChart({ size = 24, ...props }: UiIconProps) {
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
      <path d="M4.1 16.9c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1c0-.6.5-1.1 1.1-1.1Z" />
      <path d="M4.7 16.9c3.8-.3 4.5-6.3 7.3-6.5 2.8-.2 3.4-3.2 7.6-3.6" />
    </svg>
  );
};
