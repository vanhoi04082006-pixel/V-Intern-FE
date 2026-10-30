import type * as React from "react";

/**
 * Hợp đồng icon dùng chung cho toàn hệ thống: icon notebook vẽ tay
 * (src/components/v-intern/icons) và icon lucide đều thỏa hợp đồng này,
 * nhờ đó call site đổi dần sang notebook mà không phá type ở nơi khác.
 */
export type UiIconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
};

export type UiIcon = React.ComponentType<UiIconProps>;
