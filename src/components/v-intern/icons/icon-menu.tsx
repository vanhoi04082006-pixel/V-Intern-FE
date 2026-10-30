import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Nút mở menu mobile · ba gạch dài ngắn khác nhau. */
export const IconMenu: UiIcon = function IconMenu({ size = 24, ...props }: UiIconProps) {
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
      <path d="M4.2 7.3h15.6" />
      <path d="M4.2 12h10.7" />
      <path d="M4.2 16.7h13.4" />
    </svg>
  );
};
