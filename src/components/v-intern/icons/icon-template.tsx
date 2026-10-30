import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Project template" · khung bố cục trang sổ. */
export const IconTemplate: UiIcon = function IconTemplate({ size = 24, ...props }: UiIconProps) {
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
      <path d="M4.4 4.4h15.2v15.2H4.4z" />
      <path d="M4.4 9.4h15.2" />
      <path d="M11.8 9.4v10.2" />
      <path d="M11.8 14.7h7.8" />
    </svg>
  );
};
