import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "GitHub" (intern) + nhãn kỹ thuật · dấu ngoặc mã `</>`. */
export const IconCode: UiIcon = function IconCode({ size = 24, ...props }: UiIconProps) {
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
      <path d="M8.6 7 4.4 12l4.1 5" />
      <path d="m15.4 7 4.2 5-4.1 5" />
    </svg>
  );
};
