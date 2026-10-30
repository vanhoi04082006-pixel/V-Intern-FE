import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Hoạt động / Trạng thái dịch vụ" · nhịp sinh tồn vẽ tay. */
export const IconPulse: UiIcon = function IconPulse({ size = 24, ...props }: UiIconProps) {
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
      <path d="M3.6 12.6h3.8L9.8 7l3.4 10.4 2.2-4.8h5" />
    </svg>
  );
};
