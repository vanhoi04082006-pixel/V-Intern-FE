import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Hồ sơ" + avatar menu · đầu người phác họa. */
export const IconUser: UiIcon = function IconUser({ size = 24, ...props }: UiIconProps) {
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
      <path d="M12 3.8c2.3-.1 4.2 1.9 4.1 4.2-.1 2.3-1.8 4.1-4.1 4.1-2.3-.1-4.1-1.9-4.1-4.2 0-2.2 1.8-4 4.1-4.1Z" />
      <path d="M4.6 20.2c.8-4 3.8-6.3 7.4-6.3 3.6 0 6.6 2.3 7.4 6.3" />
    </svg>
  );
};
