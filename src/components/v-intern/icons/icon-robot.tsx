import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "AI Mentor / Cấu hình AI" · đầu robot thân thiện ăng-ten lệch. */
export const IconRobot: UiIcon = function IconRobot({ size = 24, ...props }: UiIconProps) {
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
      <path d="M12 1.9c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9Z" />
      <path d="M12 3.7v2.7" />
      <path d="M5.5 6.5l13-.1.1 9.3-13.2.1z" />
      <path d="M9.4 10v.02" />
      <path d="M14.6 10v.02" />
      <path d="M9.8 13.4h4.4" />
      <path d="M3.6 10h1.9" />
      <path d="M18.5 10h1.9" />
    </svg>
  );
};
