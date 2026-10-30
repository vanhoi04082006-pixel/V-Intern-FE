import type { ComponentType, SVGProps } from "react";

/* =====================================================================
 * BỘ ICON NOTEBOOK — "Sổ tay hành trình"
 * Icon vẽ tay thay thế lucide cho icon hiển thị chính của hệ thống.
 * Một bộ nét duy nhất: stroke 2px, bo tròn đầu nét, đường "thẳng" cong
 * rất nhẹ và điểm cuối lệch 0.3–1.2px như vẽ không thước — tinh tế,
 * không nguệch ngoạc. Vòng tròn luôn là chuỗi cung C bán kính lệch nhau,
 * khép hở nhẹ. Màu duy nhất: currentColor.
 * ===================================================================== */

/** Props icon notebook — tương thích cách dùng lucide (size, className, aria). */
export type NotebookIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number;
};

/** Kiểu icon dùng chung cho map icon — nhận cả icon notebook lẫn lucide khi chuyển tiếp. */
export type IconComponent = ComponentType<NotebookIconProps>;

/* Trang chủ — mái nhà vẽ tay */
export function IconHome({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4.2 11.3 C 7.6 8.1, 10.4 5.6, 12.3 3.9 C 14.3 5.7, 17.3 8.4, 20.3 11.2" />
      <path d="M6.3 10.3 C 6.1 13.8, 6.1 16.5, 6.2 19.8 C 10 20.1, 14.2 20.1, 17.9 19.9 C 18.1 16.6, 18.1 13.8, 18 10.5" />
      <path d="M9.8 19.9 C 9.7 17.4, 9.7 15.7, 9.8 14 C 11.3 13.9, 12.9 13.9, 14.4 14 C 14.5 15.8, 14.5 17.6, 14.4 19.9" />
    </svg>
  );
}
IconHome.displayName = "NotebookIconHome";

/* Công việc — danh sách với ô check */
export function IconListTodo({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.8 4.4 C 5.2 4.2, 6.9 4.2, 8.3 4.4 C 8.5 5.8, 8.5 7.3, 8.3 8.7 C 6.9 8.9, 5.1 8.9, 3.7 8.7 C 3.6 7.3, 3.6 5.8, 3.8 4.4 Z" />
      <path d="M4.9 6.5 C 5.4 6.9, 5.9 7.4, 6.3 7.9 C 6.9 6.9, 7.5 6, 8.2 5.2" />
      <path d="M11.2 5.6 C 14.2 5.4, 17.5 5.4, 20.4 5.6" />
      <path d="M3.9 14.1 C 5.2 13.9, 6.9 13.9, 8.2 14.1 C 8.4 15.4, 8.4 16.8, 8.2 18.1 C 6.8 18.3, 5.2 18.3, 3.8 18.1 C 3.7 16.8, 3.7 15.4, 3.9 14.1 Z" />
      <path d="M11.2 15.2 C 14.2 15, 17.5 15, 20.4 15.2" />
      <path d="M3.9 20.1 C 6.5 19.9, 9.5 19.9, 11.8 20.1" />
      <path d="M14.4 20 C 16.4 19.9, 18.5 19.9, 20.4 20.1" />
    </svg>
  );
}
IconListTodo.displayName = "NotebookIconListTodo";

/* Phiên thực tập — ba lớp thẻ chồng */
export function IconLayers({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.7 7.9 C 6.5 6.4, 9.5 4.9, 12 3.7 C 14.6 4.9, 17.6 6.5, 20.4 8 C 17.7 9.4, 14.6 10.9, 12 12.1 C 9.3 10.9, 6.3 9.3, 3.7 7.9 Z" />
      <path d="M3.8 12.4 C 6.5 13.8, 9.4 15.3, 12 16.5 C 14.7 15.3, 17.6 13.8, 20.3 12.4" />
      <path d="M3.9 16.7 C 6.6 18.1, 9.5 19.5, 12.1 20.7 C 14.7 19.5, 17.6 18.1, 20.4 16.7" />
    </svg>
  );
}
IconLayers.displayName = "NotebookIconLayers";

/* Dự án — thư mục với cột kanban */
export function IconFolderKanban({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.3 6.1 C 4.9 5.9, 6.9 5.9, 8.6 6.1 C 9.5 6.9, 10.2 7.6, 11 8.3" />
      <path d="M3.1 6.2 C 3 10.8, 3 15.2, 3.1 19.6 C 8 20, 16.1 20, 20.9 19.7 C 21 15.2, 21 10.6, 20.9 8.5 C 17.8 8.2, 13.8 8.2, 11.1 8.4" />
      <path d="M9.5 11.8 C 9.4 13.8, 9.4 15.8, 9.5 17.6" />
      <path d="M14.7 11.7 C 14.6 14.4, 14.6 17, 14.7 19.6" />
    </svg>
  );
}
IconFolderKanban.displayName = "NotebookIconFolderKanban";

/* Sprint board — bảng với thẻ cột */
export function IconSquareKanban({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4.1 4.3 C 9.4 4, 14.8 4, 19.9 4.3 C 20.2 9.3, 20.2 14.9, 19.9 19.8 C 14.6 20.1, 9.3 20.1, 4 19.8 C 3.8 14.8, 3.8 9.2, 4.1 4.3 Z" />
      <path d="M9.3 8.1 C 9.2 10, 9.2 11.8, 9.3 13.6" />
      <path d="M14.9 8.1 C 14.8 11.4, 14.8 14.6, 14.9 17.4" />
    </svg>
  );
}
IconSquareKanban.displayName = "NotebookIconSquareKanban";

/* Đánh giá — bảng ghi kèm dấu check */
export function IconClipboardCheck({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8.6 3.9 C 7.5 3.9, 6.5 4, 5.6 4.1 C 5.4 8.9, 5.4 15.3, 5.6 20.1 C 9.8 20.4, 14.4 20.4, 18.5 20.1 C 18.7 15.3, 18.7 8.8, 18.5 4.1 C 17.5 4, 16.4 3.9, 15.3 3.9" />
      <path d="M8.5 3.9 C 8.4 3.4, 8.4 3, 8.5 2.7 C 10.8 2.5, 13.3 2.5, 15.4 2.7 C 15.5 3.1, 15.5 3.5, 15.4 4" />
      <path d="M8.9 11.9 C 10 13.1, 11 14.4, 11.9 15.7 C 13.4 13.5, 15 11.3, 16.6 9.3" />
    </svg>
  );
}
IconClipboardCheck.displayName = "NotebookIconClipboardCheck";

/* KPI — ba cột số liệu */
export function IconChartColumn({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 20.1 C 9.3 19.8, 14.9 19.8, 20.2 20.1" />
      <path d="M6.8 17.9 C 6.7 15.6, 6.7 13.4, 6.8 11.2 C 7.8 11.1, 8.8 11.1, 9.7 11.2 C 9.8 13.5, 9.8 15.7, 9.7 17.9" />
      <path d="M13.3 17.8 C 13.2 14.5, 13.2 11.2, 13.3 7.9 C 14.2 7.8, 15.2 7.8, 16.1 7.9 C 16.2 11.2, 16.2 14.6, 16.1 17.8" />
      <path d="M19.6 17.9 C 19.5 16.3, 19.5 14.6, 19.6 13 C 20.4 12.9, 21.2 12.9, 21.9 13" />
      <path d="M2.4 3.6 C 2.3 4.4, 2.3 5.2, 2.4 6" />
      <path d="M3 3.4 C 3.9 3.3, 4.8 3.3, 5.7 3.4" />
    </svg>
  );
}
IconChartColumn.displayName = "NotebookIconChartColumn";

/* Xu hướng — đường gãy đi lên */
export function IconChartTrend({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.6 18.9 C 6.4 15.8, 9 12.6, 11.6 9.4 C 13.2 11.1, 14.9 12.9, 16.6 14.6" />
      <path d="M16.6 14.6 C 18 12.8, 19.4 11, 20.9 9.2" />
      <path d="M17.2 9 C 18.4 9, 19.6 9.1, 20.9 9.3 C 20.9 10.5, 20.9 11.7, 20.8 12.9" />
    </svg>
  );
}
IconChartTrend.displayName = "NotebookIconChartTrend";

/* Báo cáo — tờ giấy gấp góc */
export function IconFileText({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5.4 3.8 C 9.5 3.6, 13.6 3.6, 17.6 3.8 C 17.8 8.7, 17.8 15.1, 17.6 20.2 C 13.5 20.4, 9.3 20.4, 5.2 20.2 C 5 14.9, 5 8.9, 5.4 3.8 Z" />
      <path d="M17.5 3.9 C 18.2 5.9, 18.9 7.7, 19.8 9.4 C 19 9.5, 18.2 9.5, 17.5 9.4" />
      <path d="M8.2 12.2 C 10.2 12, 12.6 12, 14.7 12.2" />
      <path d="M8.2 15.4 C 10.1 15.2, 12.4 15.2, 14.4 15.4" />
      <path d="M8.2 18.4 C 9.6 18.3, 11.1 18.3, 12.6 18.4" />
    </svg>
  );
}
IconFileText.displayName = "NotebookIconFileText";

/* GitHub — octocat tối giản */
export function IconGithub({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M7.3 6.4 C 6.6 5, 6.7 3.7, 7.4 3 C 8.5 3.4, 9.4 4.2, 9.9 5.3" />
      <path d="M16.5 6.4 C 17.3 5.1, 17.2 3.7, 16.5 2.9 C 15.4 3.3, 14.5 4.2, 14 5.2" />
      <path d="M4.3 13.2 C 4.2 8.6, 7.5 5.3, 11.9 5.3 C 16.4 5.3, 19.7 8.6, 19.6 13.2 C 19.6 17.8, 17.5 20.8, 15.4 20.8 C 14.6 20.8, 14.3 20.3, 14.3 19.7 C 14.3 18.6, 14.4 17.2, 14.4 16.2 C 14.4 14.9, 13.6 14.1, 12.4 14.1" />
      <path d="M4.4 13.6 C 4.5 15.9, 5.2 18.1, 6.4 19.4 C 7.2 20.2, 8.1 20.9, 9 20.9 C 9.8 20.9, 10 20.4, 10 19.8 C 10 18.9, 9.9 17.6, 9.9 16.6" />
      <path d="M9.6 9.1 C 9.7 9.6, 9.7 10.1, 9.6 10.6" strokeWidth="2.6" />
      <path d="M14.2 9.1 C 14.3 9.6, 14.3 10.1, 14.2 10.6" strokeWidth="2.6" />
    </svg>
  );
}
IconGithub.displayName = "NotebookIconGithub";

/* Mã nguồn — ký hiệu </> */
export function IconCodeXml({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8.6 8.1 C 7.2 9.4, 5.8 10.7, 4.7 12 C 5.8 13.3, 7.1 14.7, 8.5 15.9" />
      <path d="M15.5 8.2 C 16.9 9.5, 18.3 10.8, 19.4 12.1 C 18.3 13.4, 17 14.7, 15.6 15.8" />
      <path d="M13.3 6.4 C 12.7 10.1, 12.2 13.9, 11.5 17.6" />
    </svg>
  );
}
IconCodeXml.displayName = "NotebookIconCodeXml";

/* AI Mentor — đầu robot */
export function IconBot({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.4 C 11.9 3.2, 11.9 4.1, 12 5" />
      <path d="M12 2.2 C 12.5 2.2, 13 2.4, 13.4 2.7 C 13 3.1, 12.5 3.3, 12 3.3 C 11.5 3.3, 11.1 3.1, 10.7 2.8 C 11.1 2.5, 11.5 2.3, 12 2.2 Z" fill="currentColor" />
      <path d="M5.5 7.9 C 5.3 10.6, 5.3 13.5, 5.5 16.2 C 9.8 16.5, 14.3 16.5, 18.6 16.2 C 18.8 13.4, 18.8 10.5, 18.6 7.8 C 14.3 7.5, 9.7 7.5, 5.5 7.9 Z" />
      <path d="M3.4 10.6 C 3.3 11.6, 3.3 12.6, 3.4 13.6" />
      <path d="M20.7 10.6 C 20.8 11.6, 20.8 12.6, 20.7 13.6" />
      <path d="M9.7 11.1 C 9.8 11.6, 9.8 12, 9.7 12.5" strokeWidth="2.6" />
      <path d="M14.3 11.1 C 14.4 11.6, 14.4 12, 14.3 12.5" strokeWidth="2.6" />
      <path d="M9.9 14.2 C 11 14.6, 13.1 14.6, 14.2 14.2" />
    </svg>
  );
}
IconBot.displayName = "NotebookIconBot";

/* KPI & lương — chiếc ví */
export function IconWallet({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.8 7.4 C 3.6 11, 3.6 15.2, 3.8 18.8 C 8.9 19.1, 15.2 19.1, 20.3 18.8 C 20.5 15.1, 20.5 10.9, 20.3 7.3 C 14.9 7, 8.9 7, 3.8 7.4 Z" />
      <path d="M3.9 7.5 C 6 5.9, 8.1 4.6, 10.2 3.5 C 13.2 4.6, 16.5 6, 19.7 7.6" />
      <path d="M16.4 13 C 16.9 13, 17.4 13.1, 17.8 13.3 C 17.4 13.6, 16.9 13.8, 16.4 13.8 C 15.9 13.8, 15.5 13.6, 15.1 13.3 C 15.5 13.1, 15.9 13, 16.4 13 Z" fill="currentColor" />
    </svg>
  );
}
IconWallet.displayName = "NotebookIconWallet";

/* Lương ảo — hai đồng xu chồng */
export function IconCoins({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12.1 3.9 C 8.9 3.8, 6.4 5.1, 6.4 6.7 C 6.5 8.4, 9 9.6, 12.2 9.5 C 15.3 9.5, 17.7 8.2, 17.7 6.6 C 17.6 4.9, 15.2 3.8, 12.1 3.9 Z" />
      <path d="M6.4 6.8 C 6.3 8, 6.3 9.3, 6.4 10.5 C 6.5 12.2, 9 13.4, 12.2 13.3 C 13.4 13.3, 14.6 13.1, 15.5 12.8" />
      <path d="M17.7 6.7 C 17.7 7.3, 17.7 7.9, 17.7 8.5" />
      <path d="M9 13.2 C 6.6 13.5, 4.9 14.6, 5 16.1 C 5.1 17.9, 7.6 19.3, 10.8 19.2 C 13.9 19.1, 16.3 17.7, 16.2 15.9 C 16.2 14.5, 14.5 13.3, 12.1 13.1" />
      <path d="M5 16.2 C 4.9 17.5, 4.9 18.7, 5 19.9 C 5.1 21.6, 7.7 22.9, 10.8 22.8 C 13.9 22.7, 16.4 21.3, 16.3 19.5 C 16.3 18.4, 16.3 17.3, 16.3 16.2" />
    </svg>
  );
}
IconCoins.displayName = "NotebookIconCoins";

/* Chứng nhận — huy chương ruy băng */
export function IconAward({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.6 C 9 2.5, 6.6 4.8, 6.7 7.7 C 6.8 10.7, 9.1 13.1, 12.1 13 C 15 12.9, 17.4 10.5, 17.3 7.6 C 17.2 4.7, 14.9 2.6, 12 2.6 Z" />
      <path d="M8.7 11.9 C 8 14.5, 7.2 17.2, 6.5 19.8 C 7.9 19.1, 9.3 18.4, 10.7 17.7 C 11.3 18.5, 11.9 19.3, 12.5 20.1 C 13.2 17.4, 13.9 14.6, 14.6 11.9" />
      <path d="M9.9 7 C 10.6 7.6, 11.3 8.3, 11.9 9 C 12.9 7.7, 14 6.5, 15.2 5.4" />
    </svg>
  );
}
IconAward.displayName = "NotebookIconAward";

/* Gợi ý — bóng đèn */
export function IconLightbulb({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.9 C 9.2 2.8, 6.9 5, 7 7.7 C 7.1 9.5, 8 10.8, 9.1 12 C 9.5 12.5, 9.7 13.1, 9.7 13.7 C 11.2 13.9, 12.9 13.9, 14.4 13.7 C 14.4 13.1, 14.6 12.5, 15 12 C 16.1 10.8, 17 9.4, 17 7.7 C 17.1 5, 14.8 2.9, 12 2.9 Z" />
      <path d="M9.8 16.2 C 11.2 16.4, 12.9 16.4, 14.3 16.2" />
      <path d="M10 18.8 C 11.3 19, 12.8 19, 14.1 18.8" />
      <path d="M12 20.9 C 12 20.9, 12 20.9, 12.1 21.4" />
      <path d="M4.6 6.4 C 4 5.8, 3.5 5.2, 3 4.6" />
      <path d="M19.4 6.4 C 20 5.8, 20.5 5.2, 21 4.6" />
      <path d="M2.4 11.6 C 1.8 11.6, 1.2 11.6, 0.9 11.5" />
      <path d="M21.6 11.6 C 22.2 11.6, 22.8 11.6, 23.1 11.5" />
    </svg>
  );
}
IconLightbulb.displayName = "NotebookIconLightbulb";

/* Thông báo — chiếc chuông */
export function IconBell({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3.2 C 8.6 3.1, 6.2 5.6, 6.3 8.8 C 6.4 10.6, 6.3 12.4, 5.7 14 C 5.1 15.3, 4.4 16.6, 3.7 17.8 C 9.1 18.2, 15 18.2, 20.4 17.8 C 19.7 16.6, 19 15.2, 18.4 13.9 C 17.8 12.3, 17.7 10.6, 17.8 8.8 C 17.8 5.6, 15.4 3.2, 12 3.2 Z" />
      <path d="M9.9 20.6 C 10.5 21.3, 11.2 21.7, 12 21.7 C 12.8 21.7, 13.6 21.3, 14.2 20.6" />
    </svg>
  );
}
IconBell.displayName = "NotebookIconBell";

/* Hồ sơ — người */
export function IconUserRound({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3.4 C 9.7 3.3, 7.8 5.1, 7.9 7.4 C 8 9.7, 9.8 11.6, 12.1 11.5 C 14.3 11.4, 16.2 9.6, 16.1 7.3 C 16 5.1, 14.2 3.4, 12 3.4 Z" />
      <path d="M4.9 20.7 C 5.3 17.1, 6.7 14.4, 9.2 13.1 C 11 14.1, 13.2 14.1, 15 13.1 C 17.4 14.4, 18.8 17.1, 19.2 20.7" />
    </svg>
  );
}
IconUserRound.displayName = "NotebookIconUserRound";

/* Nhóm — hai người */
export function IconUsers({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M9.2 3.6 C 7 3.5, 5.2 5.2, 5.3 7.4 C 5.4 9.6, 7.2 11.3, 9.4 11.2 C 11.5 11.1, 13.2 9.4, 13.1 7.2 C 13 5.1, 11.3 3.6, 9.2 3.6 Z" />
      <path d="M2.6 20.6 C 3 16.4, 4.8 13.6, 7.4 12.6 C 8.6 13.3, 9.9 13.3, 11.1 12.6 C 13.6 13.6, 15.4 16.4, 15.8 20.6" />
      <path d="M15.9 4 C 17.6 4.2, 18.9 5.6, 18.8 7.3 C 18.7 8.9, 17.4 10.2, 15.8 10.3" />
      <path d="M17.6 12.9 C 19.5 14.1, 20.7 16.4, 21.2 19.3 C 20.3 19.4, 19.5 19.5, 18.6 19.5" />
    </svg>
  );
}
IconUsers.displayName = "NotebookIconUsers";

/* Vai trò & quyền — khiên */
export function IconShield({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.8 C 9.5 4.2, 6.7 5.3, 3.9 5.8 C 3.7 10.1, 4.4 15.2, 6.5 18.3 C 8 20.5, 9.9 21.9, 12.1 22.3 C 14.3 21.9, 16.2 20.4, 17.6 18.2 C 19.7 15.1, 20.3 10, 20.1 5.7 C 17.3 5.2, 14.5 4.2, 12 2.8 Z" />
      <path d="M8.9 11.9 C 9.9 13, 10.9 14.2, 11.8 15.5 C 13.2 13.6, 14.7 11.8, 16.3 10.2" />
    </svg>
  );
}
IconShield.displayName = "NotebookIconShield";

/* Kho tri thức — quyển sách mở */
export function IconBookOpen({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12.1 5.2 C 12 10.3, 12 15.4, 12.1 20.3" />
      <path d="M12 5.4 C 9.7 4, 6.7 3.4, 3.1 3.6 C 3 8.9, 3 15.1, 3.1 20.4 C 6.2 20.2, 9.2 20.7, 11.9 22" />
      <path d="M12.1 5.4 C 14.4 4, 17.4 3.4, 21 3.6 C 21.1 8.9, 21.1 15.1, 21 20.4 C 17.9 20.2, 14.9 20.7, 12.2 22" />
      <path d="M6.4 8.1 C 7.9 8, 9.3 8.1, 10.6 8.4" />
      <path d="M6.4 11.6 C 7.9 11.5, 9.3 11.6, 10.6 11.9" />
      <path d="M13.6 8.4 C 15 8.1, 16.4 8, 17.9 8.1" />
      <path d="M13.6 11.9 C 15 11.6, 16.4 11.5, 17.9 11.6" />
    </svg>
  );
}
IconBookOpen.displayName = "NotebookIconBookOpen";

/* Câu hỏi — dấu hỏi trong vòng */
export function IconCircleHelp({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.9 C 7 2.8, 3 6.7, 3.1 11.7 C 3.2 16.8, 7.2 20.9, 12.2 20.8 C 17.1 20.7, 21 16.6, 20.9 11.6 C 20.8 6.7, 16.9 2.9, 12 2.9 Z" />
      <path d="M9.3 9 C 9.4 7.4, 10.5 6.3, 12 6.3 C 13.6 6.3, 14.7 7.4, 14.7 8.8 C 14.7 10.5, 13.2 10.9, 12.3 11.9 C 12.1 12.3, 12 12.8, 12 13.3" />
      <path d="M12 16.4 C 12 16.9, 12 17.3, 12 17.8" strokeWidth="2.6" />
    </svg>
  );
}
IconCircleHelp.displayName = "NotebookIconCircleHelp";

/* Nghề nghiệp — mũ tốt nghiệp */
export function IconGraduationCap({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2.4 9.3 C 5.5 8, 8.7 6.7, 11.9 5.4 C 15.2 6.7, 18.5 8.1, 21.6 9.4 C 18.4 10.8, 15.1 12.1, 11.9 13.4 C 8.7 12.1, 5.4 10.7, 2.4 9.3 Z" />
      <path d="M6.1 11.1 C 6 13.7, 6 16.2, 6.1 18.6 C 9.9 21.4, 14.2 21.4, 17.9 18.7 C 18.1 16.2, 18.1 13.7, 18 11.2" />
      <path d="M21.7 9.5 C 21.7 12, 21.7 14.4, 21.6 16.9" />
      <path d="M21.6 17.3 C 21.6 17.8, 21.6 18.3, 21.6 18.8" strokeWidth="2.6" />
    </svg>
  );
}
IconGraduationCap.displayName = "NotebookIconGraduationCap";

/* Template — khung chia vùng */
export function IconLayoutTemplate({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.9 4.2 C 9.2 3.9, 14.9 3.9, 20.1 4.2 C 20.4 9.2, 20.4 14.9, 20.1 19.9 C 14.8 20.2, 9.1 20.2, 3.8 19.9 C 3.6 14.9, 3.6 9.1, 3.9 4.2 Z" />
      <path d="M3.8 9.3 C 9.2 9.1, 14.9 9.1, 20.2 9.3" />
      <path d="M10 9.3 C 9.9 12.9, 9.9 16.4, 10 19.8" />
    </svg>
  );
}
IconLayoutTemplate.displayName = "NotebookIconLayoutTemplate";

/* AI — tia lấp lánh */
export function IconSparkles({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M9.5 3.2 C 9.7 6.2, 10.4 8, 12.2 9.6 C 10.3 11, 9.5 12.9, 9.3 16.1 C 9.2 13, 8.4 11, 6.5 9.6 C 8.3 8, 9.3 6.1, 9.5 3.2 Z" />
      <path d="M17.2 12.9 C 17.3 14.7, 17.7 15.8, 18.8 16.7 C 17.7 17.6, 17.2 18.7, 17 20.6 C 16.9 18.7, 16.4 17.6, 15.3 16.7 C 16.4 15.8, 17 14.7, 17.2 12.9 Z" />
      <path d="M16.9 3.6 C 17 4.5, 17.2 5, 17.8 5.5 C 17.2 6, 16.9 6.6, 16.8 7.5 C 16.7 6.6, 16.4 6, 15.8 5.5 C 16.4 5, 16.8 4.5, 16.9 3.6 Z" />
    </svg>
  );
}
IconSparkles.displayName = "NotebookIconSparkles";

/* Cài đặt — bánh răng */
export function IconSettings({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 8.6 C 10.1 8.5, 8.5 10, 8.6 11.9 C 8.7 13.8, 10.2 15.4, 12.1 15.3 C 14 15.2, 15.5 13.7, 15.4 11.8 C 15.3 9.9, 13.9 8.6, 12 8.6 Z" />
      <path d="M12 2.6 C 11.9 3.6, 11.9 4.5, 12 5.5" />
      <path d="M12 18.5 C 11.9 19.5, 11.9 20.5, 12 21.4" />
      <path d="M3.9 7.3 C 4.7 7.8, 5.5 8.3, 6.3 8.8" />
      <path d="M17.7 15.2 C 18.5 15.7, 19.3 16.2, 20.1 16.7" />
      <path d="M3.9 16.7 C 4.7 16.2, 5.5 15.7, 6.3 15.2" />
      <path d="M17.7 8.8 C 18.5 8.3, 19.3 7.8, 20.1 7.3" />
      <path d="M8.1 3.4 C 8.5 4.2, 8.9 5, 9.4 5.7" />
      <path d="M14.7 18.3 C 15.1 19, 15.5 19.8, 15.9 20.6" />
      <path d="M8.1 20.6 C 8.5 19.8, 8.9 19, 9.4 18.3" />
      <path d="M14.7 5.7 C 15.1 5, 15.5 4.2, 15.9 3.4" />
    </svg>
  );
}
IconSettings.displayName = "NotebookIconSettings";

/* Trạng thái dịch vụ — nhịp hoạt động */
export function IconActivity({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2.6 12.9 C 4.2 12.7, 5.5 12.7, 6.8 12.9 C 7.9 9.9, 8.7 7, 9.6 4.1 C 10.9 9.6, 12.2 15, 13.7 20.4 C 14.7 17.4, 15.5 14.6, 16.4 11.9 C 17.9 12, 19.4 12.1, 21.4 12" />
    </svg>
  );
}
IconActivity.displayName = "NotebookIconActivity";

/* Khóa — chưa mở khóa */
export function IconLock({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M7.8 10.6 C 7.7 8.9, 7.7 7.1, 7.9 5.6 C 8.1 3.7, 9.6 2.4, 11.7 2.4 C 13.8 2.4, 15.4 3.7, 15.6 5.6 C 15.8 7, 15.8 8.8, 15.7 10.5" />
      <path d="M5.3 10.7 C 9.7 10.4, 14.4 10.4, 18.7 10.7 C 19 14.3, 19 17.9, 18.7 21.4 C 14.3 21.7, 9.6 21.7, 5.2 21.4 C 5 17.9, 5 14.3, 5.3 10.7 Z" />
      <path d="M12 15.1 C 12 15.8, 12 16.4, 12 17" strokeWidth="2.6" />
    </svg>
  );
}
IconLock.displayName = "NotebookIconLock";

/* Lịch — lịch có dây xoắn */
export function IconCalendarDays({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4.1 5.4 C 9.3 5.1, 14.9 5.1, 19.9 5.4 C 20.2 10, 20.2 15.7, 19.9 20.3 C 14.7 20.6, 9.1 20.6, 3.9 20.3 C 3.7 15.4, 3.7 9.9, 4.1 5.4 Z" />
      <path d="M3.9 9.5 C 9.2 9.2, 14.9 9.2, 20.1 9.5" />
      <path d="M8.2 2.8 C 8.1 4.2, 8.1 5.5, 8.2 6.9" />
      <path d="M15.8 2.8 C 15.7 4.2, 15.7 5.5, 15.8 6.9" />
      <path d="M7.6 13.1 C 7.6 13.5, 7.6 13.9, 7.6 14.3" strokeWidth="2.6" />
      <path d="M12 13.1 C 12 13.5, 12 13.9, 12 14.3" strokeWidth="2.6" />
      <path d="M16.4 13.1 C 16.4 13.5, 16.4 13.9, 16.4 14.3" strokeWidth="2.6" />
      <path d="M7.6 17.2 C 7.6 17.6, 7.6 18, 7.6 18.4" strokeWidth="2.6" />
      <path d="M12 17.2 C 12 17.6, 12 18, 12 18.4" strokeWidth="2.6" />
    </svg>
  );
}
IconCalendarDays.displayName = "NotebookIconCalendarDays";

/* Đồng hồ — kim vẽ tay */
export function IconClock({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.8 C 7 2.7, 2.9 6.8, 3 11.8 C 3.1 16.9, 7.2 21.1, 12.2 21 C 17.2 20.9, 21.1 16.7, 21 11.7 C 20.9 6.8, 16.9 2.8, 12 2.8 Z" />
      <path d="M12 6.9 C 11.9 9.2, 11.9 11.4, 12 13.6" />
      <path d="M12 13.4 C 13.6 13.4, 15.2 13.4, 16.7 13.5" />
    </svg>
  );
}
IconClock.displayName = "NotebookIconClock";

/* Menu — ba gạch lệch nhẹ */
export function IconMenu({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.8 7.1 C 9.2 6.8, 14.9 6.8, 20.2 7.1" />
      <path d="M3.6 12.1 C 9 11.8, 14.7 11.8, 20.4 12.1" />
      <path d="M4 17 C 9.3 16.7, 14.8 16.7, 20.1 17" />
    </svg>
  );
}
IconMenu.displayName = "NotebookIconMenu";

/* Đóng — dấu X vẽ tay */
export function IconX({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5.2 4.9 C 9.3 9, 14.4 14.2, 18.9 18.9" />
      <path d="M18.8 5.2 C 14.6 9.3, 9.6 14.4, 5 19" />
    </svg>
  );
}
IconX.displayName = "NotebookIconX";

/* Dấu check */
export function IconCheck({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4.3 12.6 C 6.8 15, 9.1 17.4, 11.2 19.8 C 13.4 15.1, 16.2 10.3, 19.9 5.6" />
    </svg>
  );
}
IconCheck.displayName = "NotebookIconCheck";

/* Dấu cộng */
export function IconPlus({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12.1 4.4 C 12 9.4, 12 14.7, 12.1 19.6" />
      <path d="M4.5 11.9 C 9.5 11.8, 14.6 11.8, 19.7 11.9" />
    </svg>
  );
}
IconPlus.displayName = "NotebookIconPlus";

/* Chevron phải */
export function IconChevronRight({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M9.2 4.6 C 11.7 7.4, 14 10.1, 16.3 12.7 C 13.9 15.4, 11.5 18, 9.3 20.7" />
    </svg>
  );
}
IconChevronRight.displayName = "NotebookIconChevronRight";

/* Chevron trái */
export function IconChevronLeft({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M14.8 4.6 C 12.3 7.4, 10 10.1, 7.7 12.7 C 10.1 15.4, 12.5 18, 14.7 20.7" />
    </svg>
  );
}
IconChevronLeft.displayName = "NotebookIconChevronLeft";

/* Chevron xuống */
export function IconChevronDown({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4.7 9.1 C 7.4 11.4, 10.1 13.7, 12.7 15.9 C 15.3 13.6, 18 11.3, 20.6 9.2" />
    </svg>
  );
}
IconChevronDown.displayName = "NotebookIconChevronDown";

/* Mũi tên trái */
export function IconArrowLeft({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20.6 12.2 C 15.1 12, 9.6 12, 4.2 12.2" />
      <path d="M9 7 C 7.4 8.7, 5.8 10.4, 4.1 12 C 5.7 13.7, 7.3 15.4, 8.9 17.2" />
    </svg>
  );
}
IconArrowLeft.displayName = "NotebookIconArrowLeft";

/* Mũi tên phải */
export function IconArrowRight({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.5 12.2 C 9 12, 14.5 12, 19.9 12.2" />
      <path d="M15.1 7 C 16.7 8.7, 18.3 10.4, 20 12 C 18.4 13.7, 16.8 15.4, 15.2 17.2" />
    </svg>
  );
}
IconArrowRight.displayName = "NotebookIconArrowRight";

/* Mũi tên chéo lên phải */
export function IconArrowUpRight({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6.4 17.6 C 9.7 14.4, 13 11.1, 16.3 7.9" />
      <path d="M8.2 7.7 C 10.9 7.5, 13.6 7.5, 16.3 7.7 C 16.5 10.4, 16.5 13.1, 16.3 15.8" />
    </svg>
  );
}
IconArrowUpRight.displayName = "NotebookIconArrowUpRight";

/* Tìm kiếm — kính lúp */
export function IconSearch({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M10.6 3.6 C 6.8 3.5, 3.7 6.5, 3.8 10.3 C 3.9 14.1, 7 17.3, 10.8 17.2 C 14.5 17.1, 17.5 14, 17.4 10.2 C 17.3 6.4, 14.3 3.6, 10.6 3.6 Z" />
      <path d="M16.6 16.4 C 18.1 17.9, 19.6 19.5, 21.1 21.1" />
    </svg>
  );
}
IconSearch.displayName = "NotebookIconSearch";

/* Chủ đề sáng — mặt trời */
export function IconSun({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 6.7 C 9.3 6.6, 7.1 8.7, 7.2 11.4 C 7.3 14.2, 9.5 16.4, 12.2 16.3 C 14.9 16.2, 17 14, 16.9 11.3 C 16.8 8.6, 14.7 6.7, 12 6.7 Z" />
      <path d="M12 2.1 C 11.9 2.8, 11.9 3.5, 12 4.2" />
      <path d="M12 19.8 C 11.9 20.5, 11.9 21.2, 12 21.9" />
      <path d="M2.2 12.1 C 2.9 12, 3.6 12, 4.3 12.1" />
      <path d="M19.7 12.1 C 20.4 12, 21.1 12, 21.8 12.1" />
      <path d="M4.9 4.9 C 5.4 5.4, 5.9 5.9, 6.4 6.4" />
      <path d="M17.6 17.6 C 18.1 18.1, 18.6 18.6, 19.1 19.1" />
      <path d="M4.9 19.1 C 5.4 18.6, 5.9 18.1, 6.4 17.6" />
      <path d="M17.6 6.4 C 18.1 5.9, 18.6 5.4, 19.1 4.9" />
    </svg>
  );
}
IconSun.displayName = "NotebookIconSun";

/* Chủ đề tối — trăng khuyết */
export function IconMoon({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20.2 14.2 C 16.6 15.3, 13.8 14.2, 12.3 11.7 C 10.9 9.2, 11.5 6.1, 13.6 4.1 C 8.9 4.4, 5.2 8.2, 5.3 12.9 C 5.4 17.8, 9.4 21.6, 14.2 21.5 C 17.4 21.4, 20.1 19.3, 20.2 14.2 Z" />
    </svg>
  );
}
IconMoon.displayName = "NotebookIconMoon";

/* Theo máy — màn hình */
export function IconMonitor({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.4 4.4 C 9.1 4.1, 15 4.1, 20.6 4.4 C 20.9 9, 20.9 13.6, 20.6 18.1 C 14.9 18.4, 9 18.4, 3.3 18.1 C 3.1 13.6, 3.1 9, 3.4 4.4 Z" />
      <path d="M8.6 21.2 C 10.8 21, 13.3 21, 15.5 21.2" />
      <path d="M12 18.3 C 11.9 19.3, 11.9 20.2, 12 21.2" />
    </svg>
  );
}
IconMonitor.displayName = "NotebookIconMonitor";

/* Đăng xuất — cửa và mũi tên */
export function IconLogout({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M14.1 3.9 C 11.1 3.7, 7.8 3.7, 4.9 3.9 C 4.6 9.2, 4.6 15, 4.9 20.3 C 7.9 20.5, 11.2 20.5, 14.3 20.3" />
      <path d="M10.4 12.1 C 13.9 11.9, 17.3 11.9, 20.6 12.1" />
      <path d="M17.4 8.9 C 18.4 9.9, 19.4 11, 20.4 12 C 19.4 13.1, 18.5 14.2, 17.6 15.3" />
    </svg>
  );
}
IconLogout.displayName = "NotebookIconLogout";

/* Empty state — hộp thư */
export function IconInbox({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.1 13.1 C 4.7 10, 6.4 6.8, 8.1 3.7 C 10.7 3.5, 13.4 3.5, 16 3.7 C 17.7 6.8, 19.4 10, 21 13.1 C 21.2 15.5, 21.2 18, 21 20.4 C 15 20.7, 9 20.7, 3.1 20.4 C 2.9 18, 2.9 15.5, 3.1 13.1 Z" />
      <path d="M3.2 13.3 C 6 13.1, 8.6 13.1, 11.1 13.3 C 11.6 14.4, 12.5 15, 13.6 15.5 C 15.6 15.5, 17.9 15.5, 20.9 15.3" />
    </svg>
  );
}
IconInbox.displayName = "NotebookIconInbox";

/* Thông tin — chữ i trong vòng */
export function IconInfo({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.9 C 7.1 2.8, 3 6.8, 3.1 11.7 C 3.2 16.7, 7.3 20.9, 12.2 20.8 C 17.1 20.7, 21 16.5, 20.9 11.6 C 20.8 6.7, 16.9 2.9, 12 2.9 Z" />
      <path d="M12 10.6 C 11.9 13, 11.9 15.4, 12 17.6" />
      <path d="M12 7.2 C 12 7.6, 12 8, 12 8.4" strokeWidth="2.6" />
    </svg>
  );
}
IconInfo.displayName = "NotebookIconInfo";

/* Cảnh báo — tam giác và dấu chấm than */
export function IconAlertTriangle({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3.4 C 13.4 6.5, 15.2 10.2, 17.4 14.4 C 18.5 16.4, 19.7 18.5, 21 20.6 C 15 20.9, 9 20.9, 3 20.6 C 5.6 16.2, 8.9 10.1, 12 3.4 Z" />
      <path d="M12 9.6 C 11.9 11.7, 11.9 13.6, 12 15.6" />
      <path d="M12 18 C 12 18.4, 12 18.8, 12 19.2" strokeWidth="2.6" />
    </svg>
  );
}
IconAlertTriangle.displayName = "NotebookIconAlertTriangle";

/* Thành công — check trong vòng */
export function IconCircleCheck({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.9 C 7 2.8, 2.9 6.9, 3 11.9 C 3.1 16.9, 7.2 21, 12.2 20.9 C 17.1 20.8, 21 16.6, 20.9 11.7 C 20.8 6.8, 16.9 2.9, 12 2.9 Z" />
      <path d="M7.6 12.2 C 9 13.5, 10.3 14.9, 11.5 16.3 C 13.1 13.6, 15 11, 17.2 8.6" />
    </svg>
  );
}
IconCircleCheck.displayName = "NotebookIconCircleCheck";

/* Lỗi — X trong vòng */
export function IconCircleX({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.9 C 7 2.8, 2.9 6.9, 3 11.9 C 3.1 16.9, 7.2 21, 12.2 20.9 C 17.1 20.8, 21 16.6, 20.9 11.7 C 20.8 6.8, 16.9 2.9, 12 2.9 Z" />
      <path d="M9 9.2 C 10.6 10.7, 12.3 12.4, 13.9 14" />
      <path d="M13.9 9.2 C 12.3 10.7, 10.6 12.4, 9.1 14" />
    </svg>
  );
}
IconCircleX.displayName = "NotebookIconCircleX";

/* Đang chờ — vòng đứt nét */
export function IconCircleDashed({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8.4 4.2 C 9.5 3.7, 10.7 3.4, 11.9 3.4" />
      <path d="M15.4 4.3 C 16.5 4.8, 17.5 5.6, 18.3 6.5" />
      <path d="M19.9 9.5 C 20.3 10.6, 20.5 11.8, 20.5 13" />
      <path d="M19.2 16.9 C 18.5 17.9, 17.6 18.8, 16.5 19.4" />
      <path d="M13.3 20.6 C 12.1 20.6, 10.9 20.4, 9.8 20" />
      <path d="M6.3 18.2 C 5.4 17.4, 4.7 16.4, 4.2 15.3" />
      <path d="M3.5 12 C 3.5 10.8, 3.7 9.6, 4.1 8.5" />
      <path d="M6.1 5.5 C 6.5 5.1, 6.9 4.7, 7.4 4.4" />
    </svg>
  );
}
IconCircleDashed.displayName = "NotebookIconCircleDashed";

/* Định hướng — la bàn */
export function IconCompass({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.9 C 7 2.8, 2.9 6.9, 3 11.9 C 3.1 16.9, 7.2 21, 12.2 20.9 C 17.1 20.8, 21 16.6, 20.9 11.7 C 20.8 6.8, 16.9 2.9, 12 2.9 Z" />
      <path d="M15.2 8.5 C 13.9 10.6, 12.3 12.9, 10.4 15.3 C 9.5 13.6, 8.7 11.9, 8.1 10.4 C 9.9 9.5, 11.8 8.8, 15.2 8.5 Z" />
    </svg>
  );
}
IconCompass.displayName = "NotebookIconCompass";

/* Nhánh git */
export function IconGitBranch({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6.4 3.4 C 6.3 8.5, 6.3 13.5, 6.4 18.4" />
      <path d="M6.5 13.4 C 8.9 13.2, 11.1 12.6, 12.8 11.4 C 14.5 10.2, 15.8 8.7, 16.8 7.1" />
      <path d="M17.7 17.6 C 16.4 17.5, 15.1 17.5, 13.9 17.6 C 12.9 16.6, 12.2 15.4, 11.8 14.1" />
      <path d="M6.4 4 C 6.9 3.4, 7.5 3, 8.2 3.1 C 8.1 3.8, 7.7 4.4, 7.2 4.8 C 6.6 4.6, 6.1 4.3, 6.4 4 Z" fill="currentColor" />
      <path d="M6.4 21.3 C 5.7 21.3, 5.1 20.9, 4.8 20.3 C 5.3 19.8, 5.9 19.5, 6.5 19.6 C 6.8 20.1, 6.9 20.8, 6.4 21.3 Z" fill="currentColor" />
      <path d="M17.7 6.2 C 17 6.2, 16.4 5.8, 16.1 5.2 C 16.6 4.7, 17.2 4.4, 17.8 4.5 C 18.1 5, 18.2 5.7, 17.7 6.2 Z" fill="currentColor" />
      <path d="M17.7 21.3 C 17 21.3, 16.4 20.9, 16.1 20.3 C 16.6 19.8, 17.2 19.5, 17.8 19.6 C 18.1 20.1, 18.2 20.8, 17.7 21.3 Z" fill="currentColor" />
    </svg>
  );
}
IconGitBranch.displayName = "NotebookIconGitBranch";

/* Danh sách có check */
export function IconListChecks({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.6 5.2 C 4.1 5.7, 4.6 6.3, 5 6.9 C 5.7 6, 6.5 5.2, 7.4 4.5" />
      <path d="M10.4 6 C 13.6 5.8, 17 5.8, 20.2 6" />
      <path d="M3.7 12.1 C 4.2 12.6, 4.7 13.2, 5.1 13.8 C 5.8 12.9, 6.6 12.1, 7.5 11.4" />
      <path d="M10.4 12.9 C 13.6 12.7, 17 12.7, 20.2 12.9" />
      <path d="M3.6 19 C 4.1 19.5, 4.6 20.1, 5 20.7 C 5.7 19.8, 6.5 19, 7.4 18.3" />
      <path d="M10.4 19.8 C 13.6 19.6, 17 19.6, 20.2 19.8" />
    </svg>
  );
}
IconListChecks.displayName = "NotebookIconListChecks";

/* Ngôi sao bốn cánh */
export function IconStar({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.6 C 12.8 7.2, 14.5 9.6, 17.6 11.1 C 20.4 12.4, 20.6 12.5, 21.4 12.7 C 18.3 13.6, 16 15.2, 14.6 17.9 C 13.6 19.7, 13 21.2, 12.6 22.6 C 11.7 18.5, 10 16.1, 6.9 14.5 C 5.4 13.8, 4 13.4, 2.6 13.2 C 5.6 12.2, 7.9 10.6, 9.4 7.9 C 10.4 6, 11 4.3, 12 2.6 Z" />
    </svg>
  );
}
IconStar.displayName = "NotebookIconStar";

/* Tải lại — hai mũi tên vòng */
export function IconRefreshCw({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20.4 5.3 C 20.5 7.3, 20.5 9.2, 20.4 11.1 C 18.4 11.2, 16.4 11.2, 14.5 11.1" />
      <path d="M19.9 11 C 18.9 8, 16.9 5.9, 14.2 5.1 C 10.6 4, 6.8 5.6, 4.9 8.7" />
      <path d="M3.6 18.7 C 3.5 16.7, 3.5 14.8, 3.6 12.9 C 5.6 12.8, 7.6 12.8, 9.5 12.9" />
      <path d="M4.1 13 C 5.1 16, 7.1 18.1, 9.8 18.9 C 13.4 20, 17.2 18.4, 19.1 15.3" />
    </svg>
  );
}
IconRefreshCw.displayName = "NotebookIconRefreshCw";

/* Xem — con mắt */
export function IconEye({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2.4 12.1 C 5.4 7.5, 8.7 5.2, 12.1 5.2 C 15.5 5.3, 18.7 7.6, 21.6 12.1 C 18.7 16.6, 15.4 18.9, 12 18.8 C 8.6 18.7, 5.4 16.5, 2.4 12.1 Z" />
      <path d="M12 8.9 C 10.1 8.8, 8.6 10.2, 8.7 12.1 C 8.8 14, 10.3 15.5, 12.2 15.4 C 14 15.3, 15.5 13.8, 15.4 12 C 15.3 10.2, 13.9 8.9, 12 8.9 Z" />
    </svg>
  );
}
IconEye.displayName = "NotebookIconEye";

/* Chỉnh sửa — cây bút */
export function IconPenLine({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 20.1 C 4.6 17.8, 5.3 15.6, 6.2 13.6 C 8.6 11.1, 11.2 8.5, 14.2 5.9 C 15.6 5.7, 17.2 5.8, 18.4 6.2 C 18.8 7.4, 18.8 9, 18.6 10.4 C 15.7 13.1, 13.1 15.6, 10.6 18 C 8.5 18.9, 6.3 19.6, 4 20.1 Z" />
      <path d="M14.1 6.1 C 15.4 7.4, 16.7 8.7, 18 10.1" />
      <path d="M3.4 21.9 C 5.8 21.8, 8.1 21.8, 10.4 21.9" />
    </svg>
  );
}
IconPenLine.displayName = "NotebookIconPenLine";

/* Xóa — thùng rác */
export function IconTrash({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.9 6.4 C 9.2 6.1, 14.9 6.1, 20.2 6.4" />
      <path d="M5.2 6.5 C 5.5 11, 5.5 16.3, 5.2 20.5 C 9.7 20.8, 14.5 20.8, 18.9 20.5 C 18.7 16.3, 18.7 11, 18.9 6.6" />
      <path d="M9.4 6.3 C 9.3 5.3, 9.3 4.3, 9.5 3.5 C 11.1 3.3, 12.9 3.3, 14.6 3.5 C 14.7 4.4, 14.7 5.4, 14.6 6.3" />
      <path d="M9.9 10.2 C 9.8 12.5, 9.8 14.9, 9.9 17.2" />
      <path d="M14.2 10.2 C 14.1 12.5, 14.1 14.9, 14.2 17.2" />
    </svg>
  );
}
IconTrash.displayName = "NotebookIconTrash";

/* Tải xuống — mũi tên xuống khay */
export function IconDownload({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3.4 C 11.9 7.5, 11.9 11.5, 12 15.5" />
      <path d="M7.6 11.2 C 9.1 12.6, 10.6 14.1, 12 15.6 C 13.5 14.1, 15 12.7, 16.5 11.3" />
      <path d="M4.1 19.1 C 4 19.6, 4 20.2, 4.1 20.7 C 9.3 21, 14.9 21, 20 20.7 C 20.1 20.2, 20.1 19.6, 20 19.1" />
    </svg>
  );
}
IconDownload.displayName = "NotebookIconDownload";

/* Tải lên — mũi tên lên khỏi khay */
export function IconUpload({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 15.6 C 11.9 11.6, 11.9 7.5, 12 3.5" />
      <path d="M7.6 7.8 C 9.1 6.4, 10.6 5, 12 3.5 C 13.5 5, 15 6.4, 16.5 7.8" />
      <path d="M4.1 19.1 C 4 19.6, 4 20.2, 4.1 20.7 C 9.3 21, 14.9 21, 20 20.7 C 20.1 20.2, 20.1 19.6, 20 19.1" />
    </svg>
  );
}
IconUpload.displayName = "NotebookIconUpload";

/* Liên kết ngoài */
export function IconExternalLink({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M13.9 4.2 C 15.7 4, 17.7 4, 19.7 4.2 C 19.9 6.2, 19.9 8.2, 19.7 10" />
      <path d="M19.5 4.4 C 15.9 7.8, 12.4 11.4, 8.9 15.1" />
      <path d="M9.4 5.1 C 7.5 4.9, 5.4 4.9, 3.6 5.1 C 3.4 9.9, 3.4 15.5, 3.6 20.3 C 8.4 20.5, 13.6 20.5, 18.4 20.3 C 18.6 18.3, 18.6 16.2, 18.5 14.2" />
    </svg>
  );
}
IconExternalLink.displayName = "NotebookIconExternalLink";

/* Lọc — phễu */
export function IconFilter({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.4 4.6 C 9.1 4.3, 15 4.3, 20.6 4.6 C 17.9 8.1, 15.3 11.4, 13 14.6 C 12.8 17.1, 12.8 19.6, 13 21.9 C 11.4 20.6, 9.9 19.4, 8.3 18.4 C 8.1 17.1, 8.1 15.8, 8.3 14.5 C 6.6 11.4, 5 8, 3.4 4.6 Z" />
    </svg>
  );
}
IconFilter.displayName = "NotebookIconFilter";

/* Gửi — giấy máy bay */
export function IconSend({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M21.3 3.2 C 14.9 5.6, 8.4 8.4, 3.4 11.5 C 5.9 12.7, 8.5 13.9, 10.9 15.2 C 13.2 16.9, 15.4 18.8, 17.4 20.8 C 18.6 15, 19.9 9.1, 21.3 3.2 Z" />
      <path d="M21.1 3.5 C 17.5 7.5, 13.9 11.6, 10.8 15.4" />
    </svg>
  );
}
IconSend.displayName = "NotebookIconSend";

/* Kẹp giấy */
export function IconPaperclip({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M18.1 8.4 C 15.7 11.4, 13.2 14.4, 10.7 17.3 C 9.5 18.4, 7.7 18.3, 6.7 17.2 C 5.7 16.1, 5.8 14.4, 6.9 13.3 C 9.5 10.4, 12.1 7.4, 14.8 4.5 C 15.5 3.7, 16.8 3.6, 17.6 4.4 C 18.4 5.2, 18.5 6.4, 17.7 7.3 C 14.9 10.5, 12 13.7, 9.1 16.9" />
    </svg>
  );
}
IconPaperclip.displayName = "NotebookIconPaperclip";

/* Trò chuyện — bong bóng chat */
export function IconMessageSquare({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4.1 4.4 C 9.3 4.1, 15 4.1, 20.1 4.4 C 20.4 9.5, 20.4 14.6, 20.1 19.6 C 16.6 19.8, 13.2 19.8, 10 19.7 C 8.1 20.7, 6.1 21.6, 4 22.4 C 4.6 21, 5.2 19.6, 5.7 18.2 C 5.1 12.3, 4.4 8.1, 4.1 4.4 Z" />
      <path d="M8.3 9.4 C 10.8 9.2, 13.4 9.2, 15.9 9.4" />
      <path d="M8.3 13.4 C 10.4 13.2, 12.6 13.2, 14.7 13.4" />
    </svg>
  );
}
IconMessageSquare.displayName = "NotebookIconMessageSquare";

/* Thêm — ba chấm ngang */
export function IconMoreHorizontal({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5.2 12.1 C 5.2 12.7, 5.2 13.3, 5.2 13.9 C 5.8 13.9, 6.4 13.9, 7 13.9 C 7 13.3, 7 12.7, 7 12.1 C 6.4 12, 5.8 12, 5.2 12.1 Z" fill="currentColor" />
      <path d="M11.5 12 C 11.5 12.6, 11.5 13.2, 11.5 13.8 C 12.1 13.8, 12.7 13.8, 13.3 13.8 C 13.3 13.2, 13.3 12.6, 13.3 12 C 12.7 11.9, 12.1 11.9, 11.5 12 Z" fill="currentColor" />
      <path d="M17.1 12.1 C 17.1 12.7, 17.1 13.3, 17.1 13.9 C 17.7 13.9, 18.3 13.9, 18.9 13.9 C 18.9 13.3, 18.9 12.7, 18.9 12.1 C 18.3 12, 17.7 12, 17.1 12.1 Z" fill="currentColor" />
    </svg>
  );
}
IconMoreHorizontal.displayName = "NotebookIconMoreHorizontal";

/* Tăng trưởng — đường gãy lên mạnh */
export function IconTrendingUp({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.4 17.9 C 5.1 15.6, 6.7 13.3, 8.4 11 C 9.6 12.2, 10.8 13.5, 12 14.8 C 14.4 11.7, 16.9 8.6, 19.6 5.6" />
      <path d="M15 5.4 C 16.5 5.4, 18 5.5, 19.6 5.6 C 19.7 7.1, 19.7 8.6, 19.6 10.1" />
    </svg>
  );
}
IconTrendingUp.displayName = "NotebookIconTrendingUp";

/* Đang thực hiện — chấm mực giữa vòng */
export function IconCircleDot({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.9 C 7 2.8, 2.9 6.9, 3 11.9 C 3.1 16.9, 7.2 21, 12.2 20.9 C 17.1 20.8, 21 16.6, 20.9 11.7 C 20.8 6.8, 16.9 2.9, 12 2.9 Z" />
      <path d="M12 10.2 C 11.2 10.2, 10.6 10.9, 10.7 11.7 C 10.8 12.6, 11.4 13.2, 12.2 13.1 C 13 13, 13.6 12.4, 13.5 11.6 C 13.4 10.8, 12.8 10.2, 12 10.2 Z" fill="currentColor" />
    </svg>
  );
}
IconCircleDot.displayName = "NotebookIconCircleDot";

/* Chờ phản hồi — đồng hồ cát vẽ tay */
export function IconHourglass({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6.4 3.2 C 10.1 3, 13.9 3, 17.6 3.2 C 17.5 6.4, 16.9 9.1, 15.2 11.2 C 13.9 12.8, 12.6 13.6, 12 14.1 C 11.2 13.4, 9.6 12.5, 8.4 10.9 C 6.9 9, 6.4 6.3, 6.4 3.2 Z" />
      <path d="M6.5 20.8 C 10.2 21, 13.9 21, 17.5 20.8 C 17.5 17.6, 16.9 14.9, 15.2 12.8 C 13.9 11.3, 12.6 10.4, 12 9.9 C 11.2 10.6, 9.6 11.5, 8.4 13.1 C 6.9 15, 6.5 17.7, 6.5 20.8 Z" />
      <path d="M8.8 20.7 C 9.9 19.4, 10.9 18.2, 11.9 17.1 C 12.9 18.3, 13.9 19.5, 14.9 20.7" opacity="0.55" />
    </svg>
  );
}
IconHourglass.displayName = "NotebookIconHourglass";

/* Mục tiêu — vòng tròn đồng tâm vẽ tay */
export function IconTarget({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.9 C 7 2.8, 2.9 6.9, 3 11.9 C 3.1 16.9, 7.2 21, 12.2 20.9 C 17.1 20.8, 21 16.6, 20.9 11.7 C 20.8 6.8, 16.9 2.9, 12 2.9 Z" />
      <path d="M12 7.1 C 9.4 7, 7.2 9.1, 7.3 11.7 C 7.4 14.3, 9.5 16.5, 12.1 16.4 C 14.6 16.3, 16.8 14.2, 16.7 11.6 C 16.6 9.1, 14.5 7.1, 12 7.1 Z" />
      <path d="M12 10.4 C 11.3 10.4, 10.7 11, 10.8 11.7 C 10.9 12.4, 11.4 13, 12.1 12.9 C 12.8 12.8, 13.4 12.3, 13.3 11.6 C 13.2 10.9, 12.7 10.4, 12 10.4 Z" fill="currentColor" />
    </svg>
  );
}
IconTarget.displayName = "NotebookIconTarget";

/* Cờ — đánh dấu vướng mắc */
export function IconFlag({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5.4 21.4 C 5.3 15.3, 5.3 9.2, 5.4 3.1" />
      <path d="M5.5 3.9 C 8.9 2.4, 12.2 3.8, 15.4 4.9 C 17.9 5.7, 20 5.2, 20.9 4.1 C 21 7.4, 20.9 10.4, 20.8 13.4 C 19.2 14.8, 17 15, 14.7 14.3 C 11.7 13.4, 8.6 12.2, 5.6 13.5" />
    </svg>
  );
}
IconFlag.displayName = "NotebookIconFlag";

/* Bảo đảm — khiên có dấu check */
export function IconShieldCheck({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.8 C 9.5 4.2, 6.7 5.3, 3.9 5.8 C 3.7 10.1, 4.4 15.2, 6.5 18.3 C 8 20.5, 9.9 21.9, 12.1 22.3 C 14.3 21.9, 16.2 20.4, 17.6 18.2 C 19.7 15.1, 20.3 10, 20.1 5.7 C 17.3 5.2, 14.5 4.2, 12 2.8 Z" />
      <path d="M8.7 11.9 C 9.7 13, 10.7 14.2, 11.6 15.4 C 13 13.5, 14.5 11.7, 16.1 10.1" />
    </svg>
  );
}
IconShieldCheck.displayName = "NotebookIconShieldCheck";

/* Sao chép — hai tờ giấy chồng */
export function IconCopy({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8.8 8.4 C 7.4 8.3, 6.1 8.3, 4.9 8.4 C 4.7 12.1, 4.7 15.9, 4.9 19.6 C 8.4 19.8, 12 19.8, 15.5 19.6 C 15.7 16, 15.7 12.2, 15.5 8.5 C 13.9 8.3, 12.5 8.3, 11.1 8.4" />
      <path d="M11.2 8.4 C 11.1 8.2, 11 8, 10.9 7.9 C 10.8 5.6, 10.8 4.4, 10.9 3.4 C 14.5 3.2, 17.4 3.2, 20.2 3.4 C 20.4 6.9, 20.4 10.5, 20.2 14 C 19.2 14.2, 18.1 14.2, 17 14.1" />
      <path d="M8.9 8.4 C 9.7 6.7, 10.3 5.4, 10.9 4.1" />
    </svg>
  );
}
IconCopy.displayName = "NotebookIconCopy";

/* Giảm — đường gãy xuống */
export function IconTrendingDown({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.4 6.1 C 5.1 8.4, 6.7 10.7, 8.4 13 C 9.6 11.8, 10.8 10.5, 12 9.2 C 14.4 12.3, 16.9 15.4, 19.6 18.4" />
      <path d="M15 18.5 C 16.5 18.5, 18 18.4, 19.6 18.3 C 19.7 16.8, 19.7 15.3, 19.6 13.8" />
    </svg>
  );
}
IconTrendingDown.displayName = "NotebookIconTrendingDown";

/* Khởi động — tên lửa vẽ tay */
export function IconRocket({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2.6 C 14.2 4.6, 15.9 7.6, 16.5 11.2 C 15.4 13.4, 13.9 15.3, 12.1 16.9 C 10.2 15.4, 8.6 13.5, 7.4 11.3 C 8.1 7.7, 9.8 4.6, 12 2.6 Z" />
      <path d="M12 8.6 C 11.1 8.5, 10.4 9.2, 10.5 10.1 C 10.6 11, 11.2 11.7, 12.1 11.6 C 13 11.5, 13.7 10.9, 13.6 10 C 13.5 9.1, 12.9 8.6, 12 8.6 Z" />
      <path d="M7.5 13.2 C 6.3 14.1, 5.5 15.4, 5.2 17 C 6.7 16.9, 8 16.4, 9 15.5" />
      <path d="M16.6 13.3 C 17.7 14.2, 18.5 15.5, 18.8 17.1 C 17.3 17, 16 16.5, 15 15.6" />
      <path d="M10.4 18.6 C 9.9 19.9, 9.1 21, 8 21.9 C 7.6 20.6, 7.5 19.3, 7.7 18" />
      <path d="M13.7 18.6 C 14.2 19.9, 15 21, 16.1 21.9 C 16.5 20.6, 16.6 19.3, 16.4 18" />
    </svg>
  );
}
IconRocket.displayName = "NotebookIconRocket";

/* Thư mục đang mở */
export function IconFolderOpen({ size = 24, strokeWidth = 2, ...props }: NotebookIconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.3 6.2 C 4.9 6, 6.9 6, 8.6 6.2 C 9.5 7, 10.2 7.7, 11 8.4" />
      <path d="M3.1 6.3 C 3 10.8, 3 15.1, 3.1 19.5 C 8 19.8, 16 19.8, 20.9 19.5" />
      <path d="M3.2 19.5 C 5 16.8, 6.9 14.1, 8.9 11.5 C 12.8 11.3, 16.5 11.3, 20.2 11.6 C 18.3 14.2, 16.4 16.9, 14.6 19.6" />
    </svg>
  );
}
IconFolderOpen.displayName = "NotebookIconFolderOpen";
