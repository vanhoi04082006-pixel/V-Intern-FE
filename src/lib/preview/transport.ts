/**
 * TRANSPORT PREVIEW — hiện thực hợp đồng apiFetch cho môi trường mock.
 * Áp scenario lên MỌI request trước khi tới router:
 *   loading-slow / error / unauthorized / forbidden / validation / network.
 * Endpoint auth cốt lõi (login/refresh/me/logout) được giữ nguyên để người
 * dùng vẫn đăng nhập được khi muốn demo các trạng thái lỗi dữ liệu.
 */
import { ApiError } from "@/lib/auth/api-client";
import { handlePreviewRequest } from "./router";
import { currentScenario, type PreviewScenario } from "./store";

const AUTH_KEEP = ["/auth/login", "/auth/refresh", "/auth/me", "/auth/logout"];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function previewFetch(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    formData?: FormData;
    token?: string | null;
    signal?: AbortSignal;
    responseType?: string;
  } = {},
): Promise<unknown> {
  const scenario: PreviewScenario = currentScenario();
  const method = (options.method ?? "GET").toUpperCase();
  const cleanPath = (path.split("?")[0] ?? path).replace(/\/+$/, "") || "/";

  // Kịch bản độ trễ: mọi request chậm để thấy skeleton/loading state thật.
  if (scenario === "loading-slow") await delay(2400);
  if (options.signal?.aborted) throw new DOMException("Cancelled", "AbortError");

  // Mất kết nối: ném như khi fetch thật gãy (ApiError 0 NETWORK_ERROR).
  if (scenario === "network") {
    throw new ApiError(0, "NETWORK_ERROR", "Không thể kết nối đến hệ thống.");
  }

  // 500 cho mọi request ngoài nhóm auth cốt lõi.
  if (scenario === "error" && !AUTH_KEEP.includes(cleanPath)) {
    throw new ApiError(
      500,
      "PREVIEW_FORCED_ERROR",
      "Lỗi mô phỏng từ chế độ Preview (scenario: error).",
    );
  }

  // Hết phiên: 401 mọi request API (kể cả refresh → app clearSession và
  // đưa về /login đúng luồng thật).
  if (scenario === "unauthorized" && cleanPath !== "/auth/login") {
    throw new ApiError(401, "UNAUTHORIZED", "Phiên đăng nhập đã hết hạn.");
  }

  // Không quyền: 403 mọi request API sau đăng nhập.
  if (scenario === "forbidden" && !AUTH_KEEP.includes(cleanPath)) {
    throw new ApiError(403, "FORBIDDEN", "Tài khoản không có quyền thực hiện thao tác.");
  }

  // Validation: GET giữ dữ liệu; mọi mutation trả 422 với details cụ thể.
  const mutating = method !== "GET" && method !== "HEAD";
  if (scenario === "validation" && mutating && cleanPath !== "/auth/login") {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      "Dữ liệu chưa hợp lệ (kịch bản Preview: validation).",
      [
        "Trường bắt buộc chưa điền giá trị",
        "Ngày kết thúc phải sau ngày bắt đầu",
        "Giá trị vượt giới hạn cho phép",
      ],
    );
  }

  const result = handlePreviewRequest(path, {
    method,
    body: options.body ?? (options.formData ? undefined : undefined),
    token: options.token,
  });
  if ("error" in result) throw result.error;
  return result.data;
}
