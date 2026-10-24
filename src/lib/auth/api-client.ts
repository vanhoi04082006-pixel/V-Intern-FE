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
  formData?: FormData;
  token?: string | null;
  signal?: AbortSignal;
  responseType?: "json" | "blob" | "xlsx" | "cv";
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export async function apiFetch(
  path: string,
  {
    method = "GET",
    body,
    formData,
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
        ...(formData || body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(formData ? { body: formData } : body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (isRecord(error) && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Không thể kết nối đến hệ thống.");
  }
  if (response.status === 204 && response.ok) return null;
  if (response.ok && (responseType === "blob" || responseType === "xlsx" || responseType === 'cv')) {
    const expected = responseType === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : responseType === 'cv' ? 'application/octet-stream' : "application/pdf";
    if (response.headers.get("content-type")?.split(';')[0].trim().toLowerCase() !== expected)
      throw new ApiError(0, "INVALID_RESPONSE", "Unexpected download response type.");
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
  const workflowErrors: Record<string, string> = {
    PARTICIPATION_PENALTY_CONFIRM_REQUIRED: 'Xem điểm rubric gốc, điểm trừ do nộp trễ và điểm cuối. Xác nhận mức trừ trước khi lưu kết quả.',
    PARTICIPATION_VERSION_CONFLICT: 'Chính sách hoặc bằng chứng đã thay đổi. Tải lại trước khi xử lý.',
    GITHUB_RECONNECT_REQUIRED: 'Cần Admin kết nối lại tài khoản GitHub tạo repository chung tại Cài đặt. Sau đó kiểm tra lại quyền truy cập.',
    GITHUB_INVITATION_COOLDOWN: 'Vừa kiểm tra thành viên này. Vui lòng đợi một phút trước khi thử lại.',
    GITHUB_RATE_OR_PERMISSION: 'GitHub đang giới hạn yêu cầu hoặc tài khoản thiếu quyền. Nhờ Admin kiểm tra kết nối và quyền repository.',
    GITHUB_IDENTITY_CHANGED: 'Danh tính GitHub đã thay đổi. Nhờ Admin đối chiếu quyền cũ trước khi mời tiếp.',
    CV_FILE_INVALID: 'CV cần là PDF hoặc DOCX đúng định dạng, tối đa 5 MB.',
    CV_EXTRACTION_FAILED: 'Không đọc được CV trong giới hạn an toàn. Hãy xuất lại PDF có văn bản hoặc DOCX.',
    VERIFICATION_INVALID: 'Liên kết đã hết hạn hoặc đã dùng. Tải lại trang và chọn nhận lại liên kết theo dõi.',
    APPLICATIONS_CLOSED: 'Đợt tuyển chưa mở hoặc vừa đóng. Hãy chọn đợt đang nhận hồ sơ.',
    MAIL_NOT_CONFIGURED: 'Email chưa được cấu hình ở máy chủ. Liên hệ người phụ trách trước khi nộp CV.',
    CAREER_NOT_READY: 'Nghề cần đang tuyển, có 6 câu chuyên môn, 2 giới thiệu và 2 tiếng Anh trước khi mở lịch.',
    SLOT_INVALID: 'Chọn khung giờ trong tương lai, có múi giờ, còn đủ thời gian chuẩn bị và sức chứa hợp lệ.',
    PASSWORD_CHANGE_REQUIRED: 'Bạn cần đổi mật khẩu tạm trước khi dùng hệ thống.',
    TEMPORARY_PASSWORD_EXPIRED: 'Mật khẩu tạm đã hết hạn. Liên hệ người phụ trách để được hỗ trợ.',
    MAIL_RESEND_UNAVAILABLE: 'Email đang xử lý, còn trong thời gian chờ, đã hết hạn hoặc chứa dữ liệu được bảo vệ. Không tự thay mật khẩu khi gửi lại.',
    INTERVIEW_ROLE_MISMATCH: "Vai trò phân công phải khớp vai trò đã đạt phỏng vấn.",
    INTERN_NOT_RECRUITED: "Sinh viên phải đang hoạt động và đạt tuyển dụng cho vai trò được phân công.",
    ASSIGNMENT_CONFLICT: "Sinh viên đang có phân công hoạt động. Hãy chọn sinh viên còn trống.",
    ROLE_SLOT_FULL: "Vai trò này đã đủ thành viên. Vui lòng tải lại đội hình.",
    SESSION_TEAM_INCOMPLETE: "Chưa đủ thành viên cho các vai trò bắt buộc.",
    SESSION_SNAPSHOT_INVALID: "Bản chụp dự án không hợp lệ. Cần sửa dữ liệu phiên trước khi Start.",
    PLAN_ALREADY_PUBLISHED: "Phiên này đã có kế hoạch được publish. Vui lòng tải lại.",
    GENERATION_DESCRIPTION_REQUIRED: "Bổ sung mô tả cho từng Task trong bản nháp trước khi publish.",
    GENERATION_ACCEPTANCE_CRITERIA_REQUIRED: "Bổ sung tiêu chí chấp nhận cho từng Task trước khi publish.",
    TASK_NOT_OWNED: "Bạn chỉ có thể cập nhật nhiệm vụ được giao cho mình.",
    TASK_ACCESS_DENIED: "Bạn không có quyền cập nhật nhiệm vụ này.",
    SUBMISSION_PENDING_REVIEW: "Bài nộp đang chờ giảng viên duyệt. Vui lòng chờ kết quả.",
    SPRINT_HAS_OPEN_TASKS: "Sprint còn nhiệm vụ chưa hoàn thành. Hãy xử lý hết trước khi kết thúc Sprint.",
    SPRINT_ACTIVE_EXISTS: "Đang có một Sprint khác hoạt động. Hoàn thành hoặc hủy Sprint đó trước.",
    AI_RECOMMENDATION_NOT_AVAILABLE: "Chưa có khuyến nghị nào. Bấm “Cập nhật khuyến nghị” để tạo từ chỉ số hiện tại.",
    AI_PROVIDER_RATE_LIMITED: "Dịch vụ AI đang quá tải. Vui lòng thử lại sau ít phút.",
    AI_PROVIDER_TIMEOUT: "Dịch vụ AI phản hồi quá lâu. Vui lòng thử lại.",
    AI_PROVIDER_UNAVAILABLE: "Dịch vụ AI chưa khả dụng. Vui lòng thử lại sau.",
  };
  if (error.code === "TASK_DEPENDENCIES_PENDING") {
    const blocked =
      isRecord(error.details) && Array.isArray(error.details.blockedBy)
        ? error.details.blockedBy.filter((x): x is string => typeof x === "string")
        : [];
    return blocked.length
      ? `Chưa thể bắt đầu: nhiệm vụ ${blocked.join(", ")} cần được giảng viên xác nhận hoàn thành trước.`
      : "Các nhiệm vụ phụ thuộc cần được giảng viên xác nhận hoàn thành trước.";
  }
  if (workflowErrors[error.code]) return workflowErrors[error.code];
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
