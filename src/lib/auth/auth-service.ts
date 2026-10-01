/**
 * Ranh giới tích hợp API xác thực (authentication service boundary).
 *
 * Hiện tại CHƯA có backend contract cho auth, nên các hàm dưới đây là
 * adapter "chưa triển khai": chúng luôn trả về kết quả thất bại trung thực
 * với kind = "not-connected" và KHÔNG BAO GIỜ giả vờ thành công.
 *
 * Khi backend ra mắt, chỉ cần thay thân hàm bằng lời gọi API thật
 * (fetch/axios...) và map phản hồi về `AuthResult`. UI form không cần đổi.
 *
 * Quy ước:
 * - KHÔNG invent API URL / request contract / response shape ở đây.
 * - `message` trả về luôn là câu tiếng Việt hiển thị thẳng cho người dùng.
 */

export interface LoginCredentials {
  identifier: string;
  password: string;
  remember: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export type AuthFailureKind = "auth-error" | "system-error" | "not-connected";

export type AuthResult =
  | { ok: true }
  | { ok: false; kind: AuthFailureKind; message: string };

export async function login(_credentials: LoginCredentials): Promise<AuthResult> {
  void _credentials; // sẽ dùng khi nối API thật
  // TODO(auth-backend): gọi API đăng nhập thật khi có contract, ví dụ:
  //   const res = await fetch(`${API_BASE}/auth/login`, {...})
  //   map 401 → auth-error, 5xx/network → system-error.
  return {
    ok: false,
    kind: "not-connected",
    message: "Tính năng đăng nhập chưa được kết nối với hệ thống.",
  };
}

export async function register(_payload: RegisterPayload): Promise<AuthResult> {
  void _payload; // sẽ dùng khi nối API thật
  // TODO(auth-backend): gọi API đăng ký thật khi có contract.
  return {
    ok: false,
    kind: "not-connected",
    message: "Tính năng đăng ký chưa được kết nối với hệ thống.",
  };
}

export async function requestPasswordReset(_email: string): Promise<AuthResult> {
  void _email; // sẽ dùng khi nối API thật
  // TODO(auth-backend): gọi API gửi email đặt lại mật khẩu khi có contract.
  return {
    ok: false,
    kind: "not-connected",
    message:
      "Tính năng đặt lại mật khẩu chưa được kết nối với hệ thống. Vui lòng thử lại sau.",
  };
}
