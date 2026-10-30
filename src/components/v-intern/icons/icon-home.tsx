import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Tổng quan" mọi vai · aria-hidden tại call site. */
export const IconHome: UiIcon = function IconHome({ size = 24, ...props }: UiIconProps) {
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
      <path d="M3.8 11.6 12 4.1l8.2 7.1" />
      <path d="M6 9.9v9.7h12V9.8" />
      <path d="M10.2 19.6v-5.2h3.7v5.2" />
    </svg>
  );
};
