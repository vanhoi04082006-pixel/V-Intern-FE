import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Danh mục / Kho tri thức" · cuốn sổ mở giữa gáy. */
export const IconBook: UiIcon = function IconBook({ size = 24, ...props }: UiIconProps) {
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
      <path d="M12 6.2C10 4.8 7.2 4.4 4.4 5.2v13.4c2.8-.8 5.6-.4 7.6 1 2-1.4 4.8-1.8 7.6-1V5.2c-2.8-.8-5.6-.4-7.6 1Z" />
      <path d="M12 6.2v13.4" />
      <path d="M6.9 9h2.7" />
      <path d="M14.4 9h2.7" />
    </svg>
  );
};
