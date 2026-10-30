import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** InlineAlert danger · dấu X tròn vẽ tay. */
export const IconCircleX: UiIcon = function IconCircleX({ size = 24, ...props }: UiIconProps) {
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
      <path d="M9.4 9.4c1.5 1.5 3.5 3.5 5.3 5.2" />
      <path d="M14.7 9.5c-1.7 1.6-3.7 3.6-5.3 5.2" />
    </svg>
  );
};
