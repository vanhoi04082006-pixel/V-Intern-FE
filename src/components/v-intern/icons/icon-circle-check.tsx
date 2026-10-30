import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** InlineAlert success · dấu tick tròn vẽ tay. */
export const IconCircleCheck: UiIcon = function IconCircleCheck({ size = 24, ...props }: UiIconProps) {
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
      <path d="M8.2 12.2 10.8 14.8 15.9 9.6" />
    </svg>
  );
};
