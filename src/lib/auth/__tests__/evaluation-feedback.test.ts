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
