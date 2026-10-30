import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Mục nav chưa khả dụng · ổ khóa vẽ tay (kèm title giải thích). */
export const IconLock: UiIcon = function IconLock({ size = 24, ...props }: UiIconProps) {
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
      <path d="M6.4 10.8h11.2V20H6.4z" />
      <path d="M8.9 10.8V8c0-1.8 1.4-3.2 3.1-3.2 1.7 0 3.1 1.4 3.1 3.2v2.8" />
      <path d="M12 14.2c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9Z" />
    </svg>
  );
};
