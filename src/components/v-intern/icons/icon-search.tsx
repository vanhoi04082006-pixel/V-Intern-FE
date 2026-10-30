import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Ô tìm kiếm workspace · kính lúp vòng tròn lệch. */
export const IconSearch: UiIcon = function IconSearch({ size = 24, ...props }: UiIconProps) {
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
      <path d="M10.6 4.4c3.4-.1 6.3 2.7 6.2 6.2-.1 3.4-2.8 6.1-6.2 6-3.4-.1-6.1-2.8-6-6.2.1-3.3 2.7-5.9 6-6Z" />
      <path d="M15.2 15.3c1.6 1.6 3.2 3.2 4.8 4.8" />
    </svg>
  );
};
