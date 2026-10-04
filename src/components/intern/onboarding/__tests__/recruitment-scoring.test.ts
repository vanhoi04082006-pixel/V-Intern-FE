import { describe, expect, it } from "vitest";

import {
  RECRUITMENT_RESULT_FAIL,
  RECRUITMENT_RESULT_PASS,
  buildRecruitmentResult,
  getSuggestedRoleId,
  resolveRecruitmentResult,
} from "@/components/intern/onboarding/data/recruitment-mock-data";
import {
  OVERALL_FORMULA_LABEL,
  PASS_THRESHOLD,
  calculateOverallScore,
  formatScore,
  isPassed,
} from "@/components/intern/onboarding/recruitment-scoring";

/**
 * Test business rule tính điểm tuyển dụng — NGUỒN TRUTH của toàn flow:
 *   Overall = 70% × Technical + 30% × Soft Skill, đậu khi Overall >= 70.
 * Overall PHẢI derive (không hardcode): mock dataset pass (85/72) phải ra
 * 81.1 — KHÔNG phải 81.2 như reference image ghi sai toán học.
 */
describe("recruitment-scoring — công thức Overall 70/30", () => {
  it("calculateOverallScore(85, 72) = 81.1 (mock pass dataset)", () => {
    expect(calculateOverallScore(85, 72)).toBe(81.1);
  });

  it("calculateOverallScore(58, 72) = 62.2 (mock fail dataset)", () => {
    expect(calculateOverallScore(58, 72)).toBe(62.2);
  });

  it("làm tròn đúng 1 chữ số thập phân", () => {
    // 0.7*83 + 0.3*71 = 58.1 + 21.3 = 79.4
    expect(calculateOverallScore(83, 71)).toBe(79.4);
    // Trường hợp tròn số: 0.7*70 + 0.3*70 = 70
    expect(calculateOverallScore(70, 70)).toBe(70);
  });

  it("ngưỡng pass: >= 70 đậu, < 70 trượt, biên 70 đậu", () => {
    expect(isPassed(81.1)).toBe(true);
    expect(isPassed(62.2)).toBe(false);
    expect(isPassed(PASS_THRESHOLD)).toBe(true);
    expect(isPassed(69.9)).toBe(false);
  });

  it("hằng số công thức khớp nhãn hiển thị", () => {
    expect(PASS_THRESHOLD).toBe(70);
    expect(OVERALL_FORMULA_LABEL).toBe(
      "Overall = 70% × Technical + 30% × Soft Skill"
    );
  });

  it("formatScore: 1 chữ số khi lẻ, bỏ .0 khi tròn", () => {
    expect(formatScore(81.1)).toBe("81.1");
    expect(formatScore(62.2)).toBe("62.2");
    expect(formatScore(72)).toBe("72");
  });
});

describe("recruitment result datasets — Overall luôn derive", () => {
  it("PASS mock: Frontend Developer, 85/72 → Overall 81.1, Đạt, không có đề xuất", () => {
    const result = RECRUITMENT_RESULT_PASS;

    expect(result.status).toBe("pass");
    expect(result.appliedRoleLabel).toBe("Frontend Developer");
    expect(result.scores).toEqual({ technical: 85, soft: 72 });
    expect(result.overall).toBe(81.1);
    expect(result.passed).toBe(true);
    expect(result.suggestedRole).toBeNull();
    expect(result.headline).toBe("Chúc mừng bạn!");
  });

  it("FAIL mock: Frontend Developer, 58/72 → Overall 62.2, Chưa đạt, đề xuất QA / Tester", () => {
    const result = RECRUITMENT_RESULT_FAIL;

    expect(result.status).toBe("fail");
    expect(result.appliedRoleLabel).toBe("Frontend Developer");
    expect(result.scores).toEqual({ technical: 58, soft: 72 });
    expect(result.overall).toBe(62.2);
    expect(result.passed).toBe(false);
    expect(result.suggestedRole?.id).toBe("qa-tester");
    expect(result.suggestedRole?.label).toBe("QA / Tester");
    expect(result.suggestedRole?.reasons.length).toBeGreaterThan(0);
  });

  it("buildRecruitmentResult derive Overall từ bất kỳ cặp điểm nào", () => {
    const result = buildRecruitmentResult({ technical: 70, soft: 70 });

    expect(result.overall).toBe(70);
    expect(result.passed).toBe(true);
  });

  it("resolveRecruitmentResult: preview fail → fail, preview pass/null → pass", () => {
    expect(resolveRecruitmentResult("fail").status).toBe("fail");
    expect(resolveRecruitmentResult("pass").status).toBe("pass");
    expect(resolveRecruitmentResult(null).status).toBe("pass");
  });

  it("getSuggestedRoleId: không tự đề xuất chính vị trí vừa trượt", () => {
    expect(getSuggestedRoleId("frontend-developer")).toBe("qa-tester");
    expect(getSuggestedRoleId("backend-developer")).toBe("qa-tester");
    expect(getSuggestedRoleId("business-analyst")).toBe("qa-tester");
    expect(getSuggestedRoleId("qa-tester")).toBe("business-analyst");
  });
});
