import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Breadcrumb + mũi tên tiếp · nét cong nhẹ như bút lướt tay. */
export const IconChevronRight: UiIcon = function IconChevronRight({ size = 24, ...props }: UiIconProps) {
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
      <path d="M9.3 5.4c2 2.2 4.1 4.4 6.1 6.6-2 2.2-4.1 4.4-6.1 6.6" />
    </svg>
  );
};
