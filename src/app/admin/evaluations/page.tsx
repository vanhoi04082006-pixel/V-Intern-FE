import type { Metadata } from "next";
import { EvaluationManagement } from "@/components/product/evaluation-management";

/**
 * Kỳ đánh giá cho quản trị (Master prompt V6 — Phase E/P1): BE hỗ trợ
 * POST /evaluations/:id/revisions (spec 14 — hiệu chỉnh chính thức trên đánh
 * giá đã chốt, admin policy) nhưng trước đó chỉ có instructor thấy màn đánh
 * giá (guard /instructor chặn admin) → capability không có đường truy cập.
 * Trang này cho admin: duyệt kỳ đánh giá, xem trạng thái đánh giá và thực thi
 * điều chỉnh điểm đã chốt với lý do bắt buộc (revision row bất biến).
 */
export const metadata: Metadata = {
  title: "Kỳ đánh giá & điều chỉnh điểm | V-Intern",
  description:
    "Quản trị theo dõi kỳ đánh giá và điều chỉnh chính thức điểm đã chốt theo spec 14 — mỗi điều chỉnh lưu lịch sử phiên bản kèm lý do.",
};

export default function Page() {
  return <EvaluationManagement />;
}
