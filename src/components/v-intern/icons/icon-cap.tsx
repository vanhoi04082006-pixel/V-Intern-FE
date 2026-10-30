import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Thư viện nghề nghiệp" + footer giảng viên/sinh viên · mũ tốt nghiệp. */
export const IconCap: UiIcon = function IconCap({ size = 24, ...props }: UiIconProps) {
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
      <path d="M3.2 9.4 12 5.2l8.8 4.2L12 13.6z" />
      <path d="M6.6 11.4v4.9c0 1.5 2.6 2.7 5.4 2.7 2.8 0 5.4-1.2 5.4-2.7v-4.9" />
      <path d="M20.8 9.4v5.8" />
    </svg>
  );
};
