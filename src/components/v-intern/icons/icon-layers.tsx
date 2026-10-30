import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Phiên thực tập" · chồng trang giấy lệch nhau. */
export const IconLayers: UiIcon = function IconLayers({ size = 24, ...props }: UiIconProps) {
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
      <path d="M12 3.6 20.4 8.1 12 12.6 3.6 8.1z" />
      <path d="m4.6 11.9 7.4 4 7.4-4" />
      <path d="m4.6 15.9 7.4 4 7.4-4" />
    </svg>
  );
};
