import type { UiIcon, UiIconProps } from "@/lib/ui/icon";

/** Deadline / ngày tháng · tờ lịch xé mép với hai móng treo. */
export const IconCalendar: UiIcon = function IconCalendar({ size = 24, ...props }: UiIconProps) {
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
      <path d="M4.6 6.6h14.8v13.2H4.6z" />
      <path d="M8.4 4v3.2" />
      <path d="M15.6 4v3.2" />
      <path d="M4.6 10.6h14.8" />
      <path d="M8.2 14v.02" />
      <path d="M12 14v.02" />
      <path d="M15.8 14v.02" />
    </svg>
  );
};
