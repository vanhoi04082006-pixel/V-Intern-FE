import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Dấu tick rời · dùng trong trạng thái hoàn thành. */
export const IconCheck: UiIcon = function IconCheck({ size = 24, ...props }: UiIconProps) {
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
      <path d="M4.9 12.8 9.7 17.5 19.1 6.8" />
    </svg>
  );
};
