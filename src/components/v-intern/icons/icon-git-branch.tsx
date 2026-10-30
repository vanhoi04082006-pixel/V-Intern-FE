import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Điều hướng "Kết nối GitHub" · nhánh git với hai nútcommit tròn. */
export const IconGitBranch: UiIcon = function IconGitBranch({ size = 24, ...props }: UiIconProps) {
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
      <path d="M6.2 6c-.2 3.8.2 7.6-.1 10.4" />
      <path d="M17.8 7.6c-.2 4.6-4 8.8-9.6 10" />
      <path d="M6.2 2.5c.9 0 1.7.8 1.7 1.7S7.1 5.9 6.2 5.9 4.5 5.2 4.5 4.2s.8-1.7 1.7-1.7Z" />
      <path d="M6.2 16.5c.9 0 1.7.8 1.7 1.7s-.8 1.7-1.7 1.7-1.7-.7-1.7-1.7c0-.9.8-1.7 1.7-1.7Z" />
      <path d="M17.8 4.1c.9 0 1.7.8 1.7 1.7s-.7 1.7-1.7 1.7-1.7-.7-1.7-1.7.8-1.7 1.7-1.7Z" />
    </svg>
  );
};
