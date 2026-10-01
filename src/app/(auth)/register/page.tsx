import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { RegisterForm } from "@/components/auth/register-form";
import type { RegisterFormPreviewState } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Đăng ký | V-Intern",
  description:
    "Tạo tài khoản V-Intern cho sinh viên và giảng viên để bắt đầu hành trình thực tập.",
};

const PREVIEW_STATES: readonly RegisterFormPreviewState[] = [
  "auth-error",
  "system-error",
  "not-connected",
  "success",
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Dev-only preview (?_preview=...) — xem phần giải thích ở login/page.tsx.
  let previewState: RegisterFormPreviewState | undefined;
  if (
    process.env.NODE_ENV === "development" &&
    typeof params._preview === "string" &&
    PREVIEW_STATES.includes(params._preview as RegisterFormPreviewState)
  ) {
    previewState = params._preview as RegisterFormPreviewState;
  }

  return (
    <AuthCard tabs={<AuthTabs active="register" />}>
      <RegisterForm previewState={previewState} />
    </AuthCard>
  );
}
