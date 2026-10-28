/**
 * Công thức tính điểm tuyển dụng — NGUỒN TRUTH DUY NHẤT cho business rule:
 *
 *   Overall = 70% × Technical + 30% × Soft Skill
 *   >70: đậu; 50..70: AI đề xuất vai trò khác; <50: chưa đạt.
 *
 * Business rule thắng con số hiển thị trong reference image (ảnh tham chiếu
 * ghi "81.2" cho 85/72 — SAI toán học, đúng là 81.1). Vì vậy Overall LUÔN
 * được derive từ cặp điểm gốc bằng `calculateOverallScore` — không bao giờ
 * hardcode Overall độc lập ở bất kỳ screen/mock nào.
 *
 * Làm tròn tới 1 chữ số thập phân (Math.round(x*10)/10) để hiển thị "81.1",
 * "62.2". Không có AI quyết định pass/fail — chỉ phép so sánh ngưỡng.
 */

/** Trọng số điểm Technical trong Overall (70%). */
export const TECHNICAL_WEIGHT = 0.7;

/** Trọng số điểm Soft Skill trong Overall (30%). */
export const SOFT_SKILL_WEIGHT = 0.3;

/** Ngưỡng Overall tối thiểu để trúng tuyển vị trí đã chọn. */
export const PASS_THRESHOLD = 70;

/** Nhãn công thức hiển thị trên UI — phải khớp 2 hằng trọng số trên. */
export const OVERALL_FORMULA_LABEL =
  "Overall = 70% × Technical + 30% × Soft Skill";

/**
 * Tính Overall từ Technical + Soft Skill, làm tròn 1 chữ số thập phân.
 * Hàm thuần, deterministic — dùng chung cho mock data, UI và test.
 */
export function calculateOverallScore(
  technical: number,
  soft: number
): number {
  const overall = technical * TECHNICAL_WEIGHT + soft * SOFT_SKILL_WEIGHT;
  return Math.round(overall * 10) / 10;
}

/** A display helper; live eligibility always uses the backend's persisted decision. */
export function isPassed(overall: number): boolean {
  return overall > PASS_THRESHOLD;
}

/**
 * Format điểm hiển thị: 1 chữ số thập phân khi có lẻ ("81.1", "62.2"),
 * bỏ phần lẻ khi tròn ("72"). Dùng dấu chấm thống nhất toàn bộ Result
 * screen (không trộn "81,1" vi-VN với "81.1").
 */
export function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
