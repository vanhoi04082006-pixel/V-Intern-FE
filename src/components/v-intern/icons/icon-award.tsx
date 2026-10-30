import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Chứng nhận" · huy hiệu rosette đuôi ruy băng. */
export const IconAward: UiIcon = function IconAward({ size = 24, ...props }: UiIconProps) {
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
      <path d="M12 3.8c2.8-.1 5 2.2 5 5-.1 2.8-2.2 5-5 4.9-2.8-.1-5-2.2-4.9-5 .1-2.7 2.2-4.8 4.9-4.9Z" />
      <path d="M12 6.9c1.1 0 1.9.8 1.9 1.9 0 1-.8 1.9-1.9 1.9-1 0-1.9-.9-1.9-1.9 0-1.1.8-1.9 1.9-1.9Z" />
      <path d="m9.4 13.2-1.4 7.2 4-2.5 4 2.4-1.3-7.1" />
    </svg>
  );
};
