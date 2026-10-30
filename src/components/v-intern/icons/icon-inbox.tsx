import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Empty-state mặc định · khay thư rỗng nét mực. */
export const IconInbox: UiIcon = function IconInbox({ size = 24, ...props }: UiIconProps) {
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
      <path d="m3.9 12.9 2.6 6.8h11l2.6-6.8" />
      <path d="M3.9 12.9h4.9c0 1.7 1.4 2.7 3.2 2.7 1.8 0 3.2-1 3.2-2.7h4.8" />
      <path d="M6.9 4.6h10.2" />
    </svg>
  );
};
