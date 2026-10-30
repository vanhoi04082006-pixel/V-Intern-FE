import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "KPI & Lương ảo" · túi đựng thẻ và đồng xu. */
export const IconWallet: UiIcon = function IconWallet({ size = 24, ...props }: UiIconProps) {
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
      <path d="M4.3 6.8h15.4V19H4.3z" />
      <path d="M6.4 10.2h5.2" />
      <path d="M15.8 11.6c.7 0 1.3.6 1.3 1.3s-.6 1.3-1.3 1.3-1.3-.6-1.3-1.3.6-1.3 1.3-1.3Z" />
    </svg>
  );
};
