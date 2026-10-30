import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Nút quay lại của PageTitle · mũi tên trái cong nhẹ. */
export const IconArrowLeft: UiIcon = function IconArrowLeft({ size = 24, ...props }: UiIconProps) {
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
      <path d="M19.3 12H5.2" />
      <path d="M10.4 6.6C8.6 8.4 6.8 10.2 5 12c1.8 1.8 3.6 3.6 5.4 5.4" />
    </svg>
  );
};
