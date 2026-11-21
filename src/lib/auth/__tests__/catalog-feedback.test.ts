import { expect, it } from "vitest";
import { ApiError, errorMessage } from "../api-client";

it.each([
  ["CATALOG_TYPE_TAKEN", "Mã loại danh mục đã tồn tại. Hãy nhập mã khác."],
  ["CATALOG_ITEM_TAKEN", "Mã giá trị đã tồn tại trong loại danh mục này. Hãy nhập mã khác."],
])("explains which catalog code to change for %s", (code, message) => {
  expect(errorMessage(new ApiError(409, code, "Internal server detail"))).toBe(message);
});
