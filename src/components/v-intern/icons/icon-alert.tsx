import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** InlineAlert warning · tam giác chấm than nét đậm. */
export const IconAlert: UiIcon = function IconAlert({ size = 24, ...props }: UiIconProps) {
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
      <path d="M12 3.9 20.3 18.9c.2.4-.1.8-.5.8H4.2c-.4 0-.7-.4-.5-.8z" />
      <path d="M12 9.4v4.2" />
      <path d="M12 16.6v.02" />
    </svg>
  );
};
