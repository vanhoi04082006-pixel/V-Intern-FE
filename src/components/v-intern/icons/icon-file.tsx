import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Báo cáo / Audit log" · trang tài liệu gấp góc. */
export const IconFile: UiIcon = function IconFile({ size = 24, ...props }: UiIconProps) {
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
      <path d="M6.4 3.8h7.5l3.8 3.9v12.5H6.4z" />
      <path d="M13.9 3.8v3.9h3.8" />
      <path d="M9.4 11.2h5.2" />
      <path d="M9.4 14h5.3" />
      <path d="M9.4 16.9h2.8" />
    </svg>
  );
};
