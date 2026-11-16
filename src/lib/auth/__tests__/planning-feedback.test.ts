import { expect, it } from "vitest";
import { ApiError, errorMessage } from "../api-client";

it.each([
  ["GENERATION_ASSIGNEE_REQUIRED", "Chọn người nhận cho từng nhiệm vụ trước khi phát hành kế hoạch."],
  ["GENERATION_ASSIGNEE_INVALID", "Người nhận nhiệm vụ phải là thành viên đang được phân công trong phiên này."],
  ["GENERATION_DUE_OUT_OF_RANGE", "Hạn nhiệm vụ phải nằm trong thời gian của Sprint chứa nhiệm vụ đó."],
])("explains how to resolve planning rejection %s", (code, message) => {
  expect(errorMessage(new ApiError(400, code, "Internal server detail"))).toBe(message);
});

it("explains that new work needs an open Sprint", () => {
  expect(errorMessage(new ApiError(409, "SPRINT_NOT_EDITABLE", "Internal detail")))
    .toBe("Sprint đã hoàn thành hoặc hủy. Hãy chọn Sprint khác để tạo hoặc chuyển nhiệm vụ mới.");
});
