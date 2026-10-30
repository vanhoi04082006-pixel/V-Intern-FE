import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Công việc/Nhiệm vụ" · trang sổ với dòng kẻ + tick vẽ tay. */
export const IconChecklist: UiIcon = function IconChecklist({ size = 24, ...props }: UiIconProps) {
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
      <path d="M6.3 3.9h11.4l.1 16.4-11.6.1z" />
      <path d="m8.9 8.2 1 1.1 1.9-2.1" />
      <path d="M13.2 8.3h3" />
      <path d="m8.9 12.1 1 1.1 1.9-2.1" />
      <path d="M13.2 12.2h3.1" />
      <path d="M9.5 14.9c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1Z" />
      <path d="M13.2 16h3" />
    </svg>
  );
};
