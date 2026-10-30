import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Nút đóng (modal, drawer, tìm kiếm) · hai nét bút gạch chéo nhau. */
export const IconClose: UiIcon = function IconClose({ size = 24, ...props }: UiIconProps) {
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
      <path d="M6.1 6c3.8 3.8 7.9 8.1 11.8 12" />
      <path d="M18.1 6.2c-3.8 3.7-8.1 8-11.9 11.7" />
    </svg>
  );
};
