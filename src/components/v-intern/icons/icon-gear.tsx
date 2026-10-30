import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Cấu hình AI / AI features" · bánh răng vẽ tay (cài đặt máy). */
export const IconGear: UiIcon = function IconGear({ size = 24, ...props }: UiIconProps) {
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
      <path d="M12 8.4c1.9-.1 3.6 1.5 3.6 3.5 0 1.9-1.6 3.5-3.5 3.5-1.9 0-3.6-1.6-3.6-3.6 0-1.8 1.6-3.4 3.5-3.4Z" />
      <path d="M12 3.2v2" />
      <path d="m17.8 6.2-1.5 1.4" />
      <path d="M20.8 12h-2" />
      <path d="m17.7 17.8-1.4-1.5" />
      <path d="M12 20.8v-2" />
      <path d="m6.3 17.7 1.4-1.4" />
      <path d="M3.2 12h2" />
      <path d="m6.2 6.3 1.5 1.4" />
    </svg>
  );
};
