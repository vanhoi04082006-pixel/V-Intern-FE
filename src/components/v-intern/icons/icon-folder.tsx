import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Dự án" · túi hồ sơ đựng thẻ việc. */
export const IconFolder: UiIcon = function IconFolder({ size = 24, ...props }: UiIconProps) {
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
      <path d="M3.8 6.6h5.5l2.1 2.4h8.8v9.6H3.8z" />
      <path d="M9.2 12.1v4.2" />
      <path d="M12.1 12.1v2.9" />
      <path d="M15 12.1v4.7" />
    </svg>
  );
};
