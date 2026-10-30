import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Lương ảo" · hai đồng xu chồng lệch. */
export const IconCoins: UiIcon = function IconCoins({ size = 24, ...props }: UiIconProps) {
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
      <path d="M14.8 4.6c2.6-.1 4.7 2.1 4.6 4.7-.1 2.5-2.1 4.5-4.6 4.4-2.5-.1-4.5-2.1-4.4-4.6.1-2.4 2-4.4 4.4-4.5Z" />
      <path d="M9.2 10.2c2.6-.1 4.7 2.1 4.6 4.6-.1 2.5-2.1 4.5-4.6 4.5-2.5-.1-4.5-2.1-4.4-4.6 0-2.5 2-4.4 4.4-4.5Z" />
    </svg>
  );
};
