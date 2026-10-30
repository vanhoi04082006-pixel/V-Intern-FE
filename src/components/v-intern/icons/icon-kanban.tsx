import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Sprint Board" · bảng kanban ba cột cao thấp lệch. */
export const IconKanban: UiIcon = function IconKanban({ size = 24, ...props }: UiIconProps) {
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
      <path d="M4.5 4.2h15v15.6h-15z" />
      <path d="M8.3 8v8.2" />
      <path d="M12 8v5.4" />
      <path d="M15.7 8v9.8" />
    </svg>
  );
};
