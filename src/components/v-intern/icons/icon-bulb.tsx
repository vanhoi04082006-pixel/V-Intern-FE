import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Khuyến nghị" · bóng đèn phác thảo. */
export const IconBulb: UiIcon = function IconBulb({ size = 24, ...props }: UiIconProps) {
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
      <path d="M12 3.4c3.2 0 5.7 2.5 5.7 5.6 0 2.2-1.2 3.6-2.3 4.8-.6.6-.9 1.2-.9 1.9h-5c0-.7-.3-1.3-.9-1.9C7.5 12.6 6.3 11.2 6.3 9c0-3.1 2.5-5.6 5.7-5.6Z" />
      <path d="M9.9 18.6h4.2" />
      <path d="M10.6 20.6h2.8" />
    </svg>
  );
};
