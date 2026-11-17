import { expect, it } from "vitest";
import { ApiError, errorMessage } from "../api-client";

it("explains that a current successful KPI calculation is required before finalization", () => {
  expect(errorMessage(new ApiError(409, "KPI_CALCULATION_REQUIRED", "Internal detail")))
    .toBe("Tính KPI thành công cho kỳ hiện tại trước khi chốt. Nếu vừa đổi khoảng ngày hoặc lượt tính bị lỗi, hãy tính lại rồi kiểm tra kết quả.");
});
it("points to the invalid KPI date range", () => {
  expect(errorMessage(new ApiError(400, "KPI_PERIOD_INVALID_DATES", "Internal detail")))
    .toBe("Ngày kết thúc kỳ KPI phải sau ngày bắt đầu. Khoảng tính theo UTC và không bao gồm ngày kết thúc.");
});
