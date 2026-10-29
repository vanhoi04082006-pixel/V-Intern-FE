"use client";

/**
 * Tài khoản — thông tin phiên đăng nhập, vai trò & quyền, đổi mật khẩu.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import { changePassword } from "@/lib/auth/auth-service";
import { ROLE_LABELS } from "@/lib/auth/session";
import { errorMessage } from "@/lib/api/transport";
import { Chip, KeyVal, PageHeader, SectionCard } from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InitialAvatar } from "@/components/workspace/initial-avatar";

function ChangePasswordForm() {
  const { toast } = useToast();
  const signOut = useAppStore((s) => s.signOut);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const mutation = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: async () => {
      toast({
        title: "Đã đổi mật khẩu ✦",
        description: "Đăng nhập lại bằng mật khẩu mới nhé!",
      });
      await signOut();
    },
    onError: (e) =>
      toast({ title: "Đổi mật khẩu chưa thành công", description: errorMessage(e), variant: "destructive" }),
  });

  const inputCls =
    "h-12 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium text-ink placeholder:text-ink-faint focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (newPassword !== confirm) {
          toast({
            title: "Mật khẩu mới chưa khớp",
            description: "Nhập lại phần xác nhận giúp mình nhé.",
            variant: "destructive",
          });
          return;
        }
        mutation.mutate();
      }}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="cp-current" className="flex items-center gap-1.5 text-[13px] font-bold">
          <KeyRound className="h-3.5 w-3.5 text-blue" aria-hidden="true" /> Mật khẩu hiện tại
        </Label>
        <Input
          id="cp-current"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputCls}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cp-new" className="flex items-center gap-1.5 text-[13px] font-bold">
            Mật khẩu mới <span className="font-hand text-[14px] text-ink-faint">(≥ 12 ký tự)</span>
          </Label>
          <div className="relative">
            <Input
              id="cp-new"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${inputCls} pr-12`}
              required
              minLength={12}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-faint transition-colors hover:text-blue"
            >
              {show ? <EyeOff className="h-4.5 w-4.5" aria-hidden="true" /> : <Eye className="h-4.5 w-4.5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-confirm" className="flex items-center gap-1.5 text-[13px] font-bold">
            Xác nhận mật khẩu mới
          </Label>
          <Input
            id="cp-confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            required
            minLength={12}
          />
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-ink-faint">
        Sau khi đổi mật khẩu, hệ thống đăng xuất bạn khỏi mọi thiết bị để bảo mật phiên.
      </p>
      <Button
        type="submit"
        disabled={mutation.isPending}
        className="h-12 rounded-xl border-2 border-ink bg-ink px-6 font-bold text-paper shadow-[4px_4px_0_0_var(--blue)]"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Đổi mật khẩu
      </Button>
    </form>
  );
}

export function AccountSettingsView() {
  const user = useAppStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Tài khoản" description="Thông tin đăng nhập, vai trò và bảo mật của bạn." />

      <SectionCard title="Hồ sơ">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <InitialAvatar name={user.displayName} className="h-20 w-20 text-2xl" />
          <div className="space-y-2">
            <KeyVal label="Tên hiển thị">{user.displayName}</KeyVal>
            <KeyVal label="Email">{user.email}</KeyVal>
            <KeyVal label="Vai trò">
              <span className="flex flex-wrap gap-1.5">
                {user.roles.map((r) => (
                  <Chip key={r} tone="blue">
                    {ROLE_LABELS[r] ?? r}
                  </Chip>
                ))}
              </span>
            </KeyVal>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Quyền của bạn"
        description="Hệ thống phân quyền theo mã quyền — những gì tài khoản của bạn được phép làm."
      >
        <div className="flex flex-wrap gap-1.5">
          {user.permissions.length === 0 ? (
            <p className="text-sm text-ink-soft">Không có quyền đặc biệt nào.</p>
          ) : (
            user.permissions.map((p) => (
              <Chip key={p}>
                <ShieldCheck className="mr-1 inline h-3 w-3 text-emerald-500" aria-hidden="true" />
                {p}
              </Chip>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard title="Đổi mật khẩu">
        <ChangePasswordForm />
      </SectionCard>

      <p className="flex items-center justify-center gap-1.5 text-center font-hand text-[16px] text-ink-faint">
        <User className="h-4 w-4" aria-hidden="true" />
        cần hỗ trợ gấp? liên hệ quản trị viên nhé ✦
      </p>
    </div>
  );
}
