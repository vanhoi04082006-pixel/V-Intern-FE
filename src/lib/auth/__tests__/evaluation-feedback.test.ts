import { expect, it } from "vitest";
import { ApiError, errorMessage } from "../api-client";

it("explains how to correct evaluation weights before opening or finalizing", () => {
  expect(errorMessage(new ApiError(409, "EVALUATION_WEIGHT_INVALID", "Internal detail")))
    .toBe("Tổng trọng số tiêu chí phải bằng 100%. Hãy chỉnh và lưu trọng số trước khi mở kỳ hoặc chốt đánh giá.");
});

it("keeps the date-range rejection distinct from the weight conflict", () => {
  expect(errorMessage(new ApiError(400, "EVALUATION_WEIGHT_INVALID", "Internal detail")))
    .toBe("Ngày kết thúc kỳ đánh giá phải sau ngày bắt đầu. Hãy kiểm tra lại hai mốc thời gian.");
});

it("asks for saved scores when required criteria are missing", () => {
  expect(errorMessage(new ApiError(409, "EVALUATION_CRITERIA_INCOMPLETE", "Internal detail", { missingCriteria: ["quality"] })))
    .toBe("Chấm và lưu đủ điểm cho tất cả tiêu chí bắt buộc trước khi nộp hoặc chốt đánh giá.");
});

it("asks for a criterion set when the cycle cannot open without criteria", () => {
  expect(errorMessage(new ApiError(409, "EVALUATION_CRITERIA_INCOMPLETE", "Internal detail")))
    .toBe("Kỳ chưa có tiêu chí đánh giá. Hãy bổ sung tiêu chí và trọng số trước khi mở kỳ.");
});
