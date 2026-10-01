import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { LoginForm } from "@/components/auth/login-form";
import type { LoginFormPreviewState } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập | V-Intern",
  description:
    "Đăng nhập vào V-Intern để tiếp tục hành trình thực tập của bạn.",
};

const PREVIEW_STATES: readonly LoginFormPreviewState[] = [
  "auth-error",
  "system-error",
  "not-connected",
  "success",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // Dev-only preview (?_preview=auth-error|system-error|not-connected|success):
  // phục vụ review trực quan các trạng thái. Production build (NODE_ENV
  // khác "development") không bao giờ nhận preview → không có fake state.
  let previewState: LoginFormPreviewState | undefined;
  if (
    process.env.NODE_ENV === "development" &&
    typeof params._preview === "string" &&
    PREVIEW_STATES.includes(params._preview as LoginFormPreviewState)
  ) {
    previewState = params._preview as LoginFormPreviewState;
  }

  return (
    <AuthCard tabs={<AuthTabs active="login" />}>
      <LoginForm previewState={previewState} />
    </AuthCard>
  );
}
