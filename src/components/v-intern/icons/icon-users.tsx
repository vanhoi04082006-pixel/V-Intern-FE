import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Người dùng / Nhóm" · hai người đứng kề nhau. */
export const IconUsers: UiIcon = function IconUsers({ size = 24, ...props }: UiIconProps) {
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
      <path d="M9.2 4.4c2.1-.1 3.8 1.7 3.7 3.8-.1 2.1-1.7 3.7-3.7 3.7-2.1-.1-3.7-1.7-3.7-3.8 0-2 1.6-3.6 3.7-3.7Z" />
      <path d="M2.8 20.4c.7-3.6 3.3-5.7 6.4-5.7 3.1 0 5.7 2.1 6.4 5.7" />
      <path d="M19.6 9c0-1.7-1.3-3-3-3-1.2 0-2.2.7-2.7 1.7" />
      <path d="M16.4 14.7c2.6.4 4.5 2.4 5 5.7" />
    </svg>
  );
};
