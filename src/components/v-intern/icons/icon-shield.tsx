import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Vai trò & quyền" + footer admin · khiên đóng dấu tick. */
export const IconShield: UiIcon = function IconShield({ size = 24, ...props }: UiIconProps) {
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
      <path d="M12 3.4 19.2 6.1v5.5c0 4.9-3.1 7.9-7.2 9.3-4.1-1.4-7.2-4.4-7.2-9.3V6.1z" />
      <path d="m8.9 11.9 2.4 2.5 4.1-4.5" />
    </svg>
  );
};
