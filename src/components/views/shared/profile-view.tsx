"use client";

import * as React from "react";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { profileApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, formatDateTime } from "@/lib/client/labels";
import { ViewFrame } from "@/components/shared/view";
import { KeyValue, PageHeader, Panel, PanelHeader } from "@/components/shared/primitives";
import { UserAvatar } from "@/components/shared/primitives";
import { RoleBadge } from "@/components/shared/badges";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

/** Trang hồ sơ cá nhân — dùng chung cho cả 3 role (chỉ xem, không chỉnh sửa). */
export function ProfileView() {
  const res = useResource(() => profileApi.me());
  const profile = res.data;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Tài khoản"
        title="Hồ sơ cá nhân"
        description="Thông tin tài khoản của bạn trong hệ thống V-Intern."
      />

      {res.loading ? (
        <LoadingBlock variant="detail" rows={5} />
      ) : res.error ? (
        <ErrorBlock error={res.error} onRetry={res.reload} />
      ) : profile ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <Panel className="relative overflow-hidden p-6 md:p-8">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
            <div className="relative flex flex-col items-center text-center">
              <UserAvatar name={profile.displayName} size={72} className="shadow-lg" />
              <h2 className="mt-4 text-xl font-bold tracking-tight text-ink">
                {profile.displayName}
              </h2>
              <p className="mt-1 text-sm text-dim">{profile.email}</p>
              <div className="mt-3">
                <RoleBadge role={profile.role} />
              </div>
            </div>

            <dl className="relative mt-8 grid gap-x-6 gap-y-5 border-t border-line pt-6 sm:grid-cols-2">
              <KeyValue label="Vai trò">{profile.roleLabel}</KeyValue>
              <KeyValue label="Tham gia">{formatDate(profile.joinedAt)}</KeyValue>
              <KeyValue label="Đăng nhập gần nhất">
                {formatDateTime(profile.lastLoginAt)}
              </KeyValue>
              {profile.role === "intern" && profile.studentId ? (
                <KeyValue label="Mã sinh viên">
                  <span className="font-mono">{profile.studentId}</span>
                </KeyValue>
              ) : null}
              {profile.role === "intern" && profile.university ? (
                <KeyValue label="Trường">{profile.university}</KeyValue>
              ) : null}
            </dl>
          </Panel>

          <Panel>
            <PanelHeader
              icon={<ShieldCheck />}
              title="Bảo mật"
              description="Bảo vệ tài khoản của bạn"
            />
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber/10 text-amber">
                  <KeyRound className="size-4 icon" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">Mật khẩu</p>
                  <p className="mt-0.5 max-w-md text-xs leading-relaxed text-dim">
                    Nên đổi mật khẩu định kỳ và không dùng chung với dịch vụ khác. Ở bản demo này
                    tính năng đang tạm khóa.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="shrink-0 rounded-lg border-line bg-transparent text-faint"
              >
                <KeyRound className="size-3.5 icon" />
                Đổi mật khẩu
              </Button>
            </div>
            <p className="flex items-center gap-1.5 border-t border-line px-5 py-3.5 text-[11px] text-faint">
              <UserRound className="size-3.5 shrink-0 icon" />
              Hồ sơ chỉ hiển thị — dữ liệu tài khoản demo do hệ thống quản lý.
            </p>
          </Panel>
        </div>
      ) : null}
    </ViewFrame>
  );
}
