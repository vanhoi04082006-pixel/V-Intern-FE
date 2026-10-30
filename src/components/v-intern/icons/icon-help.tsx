import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Ngân hàng câu hỏi" · dấu hỏi trong vòng tròn vẽ tay. */
export const IconHelp: UiIcon = function IconHelp({ size = 24, ...props }: UiIconProps) {
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
      <path d="M12 3.6C16.7 3.4 20.5 7.3 20.4 12c-.1 4.8-3.9 8.6-8.5 8.4C7.3 20.3 3.6 16.6 3.7 12.1 3.8 7.5 7.4 3.8 12 3.6Z" />
      <path d="M9.7 9.4c.1-1.4 1.1-2.3 2.3-2.3 1.3 0 2.3.9 2.3 2.1 0 1.9-2.3 2-2.3 3.9" />
      <path d="M12 16.8v.02" />
    </svg>
  );
};
