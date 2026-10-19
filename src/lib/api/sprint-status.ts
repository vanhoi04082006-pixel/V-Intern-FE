/**
 * Nhãn hiển thị tiếng Việt cho trạng thái Sprint ở tầng UI.
 * Giá trị gốc của backend (`planned`/`active`/`completed`/`cancelled`) vẫn là
 * nguồn dữ liệu và vẫn được dùng trong bộ lọc/URL; chỉ đổi phần hiển thị.
 */
export type SprintStatusTone = "blue" | "amber" | "green" | "gray" | "red";

const labels: Record<string, { label: string; tone: SprintStatusTone }> = {
  planned: { label: "Đã lên kế hoạch", tone: "gray" },
  active: { label: "Đang chạy", tone: "blue" },
  completed: { label: "Đã hoàn thành", tone: "green" },
  cancelled: { label: "Đã hủy", tone: "red" },
};

export function sprintStatusLabel(status: string): {
  label: string;
  tone: SprintStatusTone;
} {
  return labels[status] ?? { label: status, tone: "gray" };
}
