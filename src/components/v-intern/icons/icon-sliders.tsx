import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Cài đặt hệ thống / Cài đặt cá nhân" · thanh trượt núm tròn. */
export const IconSliders: UiIcon = function IconSliders({ size = 24, ...props }: UiIconProps) {
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
      <path d="M4.2 7.2h11.7" />
      <path d="M17.8 5.3c1.1 0 1.9.9 1.9 1.9 0 1-.9 1.9-1.9 1.9s-1.9-.9-1.9-1.9c0-1 .9-1.9 1.9-1.9Z" />
      <path d="M4.2 12h4.4" />
      <path d="M10.8 10.1c1 0 1.9.9 1.9 1.9 0 1-.9 1.9-1.9 1.9S8.9 13 8.9 12c0-1 .9-1.9 1.9-1.9Z" />
      <path d="M4.2 16.8h9" />
      <path d="M15.4 14.9c1 0 1.9.9 1.9 1.9 0 1-.9 1.9-1.9 1.9s-1.9-.9-1.9-1.9c0-1 .9-1.9 1.9-1.9Z" />
    </svg>
  );
};
