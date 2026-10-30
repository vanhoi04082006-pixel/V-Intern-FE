import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Mũi tên xổ xuống (menu user, select) · nét cong nhẹ vẽ tay. */
export const IconChevronDown: UiIcon = function IconChevronDown({ size = 24, ...props }: UiIconProps) {
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
      <path d="M5.4 9.3c2.2 2 4.4 4.1 6.6 6.1 2.2-2 4.4-4.1 6.6-6.1" />
    </svg>
  );
};
