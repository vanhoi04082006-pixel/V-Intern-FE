/** Raw Nest transport. The configured base already includes /api/v1. */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
}
export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}
export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  responseType?: "json" | "blob";
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export async function apiFetch(
  path: string,
  {
    method = "GET",
    body,
    token,
    signal,
    responseType = "json",
  }: ApiFetchOptions = {},
): Promise<unknown> {
  const base = getApiBaseUrl();
  if (!base)
    throw new ApiError(
      0,
      "API_CONFIG_MISSING",
      "Chưa cấu hình NEXT_PUBLIC_API_BASE_URL.",
    );
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      signal,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (isRecord(error) && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Không thể kết nối đến hệ thống.");
  }
  if (response.status === 204 && response.ok) return null;
  if (response.ok && responseType === "blob") {
    if (!response.headers.get("content-type")?.startsWith("application/pdf"))
      throw new ApiError(0, "INVALID_RESPONSE", "Expected a PDF response.");
    return response.blob();
  }
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    /* Invalid successful JSON is rejected by the response parser. */
  }
  if (!response.ok) {
    const err = isRecord(data) ? data : {};
    const message =
      typeof err.message === "string"
        ? err.message
        : Array.isArray(err.message)
          ? err.message.filter((x) => typeof x === "string").join("; ")
          : response.statusText;
    throw new ApiError(
      response.status,
      typeof err.code === "string" ? err.code : "HTTP_ERROR",
      message,
      err.details ?? err.errors,
    );
  }
  return data;
}
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return "Không thể xử lý dữ liệu. Vui lòng thử lại.";
  if (error.code === "API_CONFIG_MISSING") return error.message;
  if (error.code === "INVALID_RESPONSE")
    return "Dữ liệu hệ thống trả về chưa hợp lệ. Vui lòng tải lại hoặc liên hệ hỗ trợ.";
  switch (error.statusCode) {
    case 0:
      return "Không thể kết nối đến hệ thống. Vui lòng kiểm tra kết nối và thử lại.";
    case 400:
    case 422:
      return "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập.";
    case 401:
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    case 403:
      return "Bạn không có quyền thực hiện thao tác này.";
    case 404:
      return "Không tìm thấy dữ liệu hoặc dữ liệu không còn khả dụng.";
    case 409:
      return "Trạng thái đã thay đổi hoặc thao tác chưa được phép. Vui lòng tải lại để xem trạng thái mới nhất.";
    case 429:
      return "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.";
    case 503:
      return "Dịch vụ tạm thời chưa khả dụng. Vui lòng thử lại sau.";
    default:
      return "Hệ thống đang gặp lỗi. Vui lòng thử lại sau.";
  }
}
