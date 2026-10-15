/**
 * Validation client-side cho các form auth.
 * Thông báo lỗi bằng tiếng Việt, hiển thị inline gần từng trường.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_MIN_LENGTH = 8;

export interface LoginValues {
  identifier: string;
  password: string;
}

export interface LoginFieldErrors {
  identifier?: string;
  password?: string;
}

export function validateLogin(values: LoginValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!values.identifier.trim()) {
    errors.identifier = "Vui lòng nhập email.";
  }
  if (!values.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  }

  return errors;
}

export interface RegisterValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export interface RegisterFieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

export function validateRegister(values: RegisterValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Vui lòng nhập họ và tên.";
  } else if (values.fullName.trim().length < 2 || values.fullName.trim().length > 128) {
    errors.fullName = 'Họ tên cần từ 2 đến 128 ký tự.';
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Vui lòng nhập email.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Email không đúng định dạng.";
  }

  if (!values.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`;
  } else if (!values.password.trim()) {
    errors.password = 'Mật khẩu không được chỉ chứa khoảng trắng.';
  } else if (new Blob([values.password]).size > 72) {
    errors.password = 'Mật khẩu quá dài. Vui lòng dùng mật khẩu ngắn hơn.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  if (!values.terms) {
    errors.terms = "Bạn cần đồng ý với điều khoản để tiếp tục.";
  }

  return errors;
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) {
    return "Vui lòng nhập email.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Email không đúng định dạng.";
  }
  return undefined;
}
