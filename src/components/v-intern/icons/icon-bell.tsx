import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Thông báo" + chuông workspace · tiếng chuông úp lệch. */
export const IconBell: UiIcon = function IconBell({ size = 24, ...props }: UiIconProps) {
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
      <path d="M6.2 10.2c0-3.4 2.4-6 5.8-6 3.4 0 5.8 2.6 5.8 6 0 3 .6 4.8 1.5 5.9H4.7c.9-1.1 1.5-2.9 1.5-5.9Z" />
      <path d="M12 4.2v.02" />
      <path d="M10 19.6c.3 1 1 1.7 2 1.7s1.7-.7 2-1.7" />
    </svg>
  );
};
