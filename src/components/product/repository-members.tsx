"use client";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Link2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import type { RepositoryMember } from "@/lib/api/github";
const states = {
  pending: {
    label: "Chờ chấp nhận",
    icon: Clock3,
    tone: "text-warning bg-warning-subtle",
  },
  accepted: {
    label: "Đã có quyền",
    icon: CheckCircle2,
    tone: "text-success bg-success-subtle",
  },
  expired: {
    label: "Lời mời hết hạn",
    icon: Clock3,
    tone: "text-muted-foreground bg-muted",
  },
  failed: {
    label: "Cần kiểm tra",
    icon: TriangleAlert,
    tone: "text-destructive bg-destructive-subtle",
  },
  not_connected: {
    label: "Chưa liên kết",
    icon: Link2,
    tone: "text-muted-foreground bg-muted",
  },
};
const date = (value: string | null) =>
  value ? new Date(value).toLocaleString("vi-VN") : null;
export function RepositoryMembers({
  members,
  owner,
  repoName,
  manage,
  busy,
  onInvite,
  onCheck,
}: {
  members: RepositoryMember[];
  owner: string;
  repoName: string;
  manage: boolean;
  busy: boolean;
  onInvite: (userId: string) => void;
  onCheck: () => void;
}) {
  return (
    <section
      aria-label="Quyền truy cập repository"
      className="border-t border-border/70 pt-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground">
          {manage ? "Thành viên & lời mời" : "Quyền truy cập của bạn"}
        </h3>
        {!manage && (
          <button
            disabled={busy}
            onClick={onCheck}
            className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-caption font-medium text-primary transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Kiểm tra quyền GitHub của tôi
          </button>
        )}
      </div>
      {!members.length && (
        <p className="py-2 text-body text-muted-foreground">
          Chưa ghi nhận lời mời. Liên kết GitHub và chờ hệ thống đồng bộ thành
          viên của phiên.
        </p>
      )}
      <ul className="divide-y divide-border">
        {members.map((member) => {
          const state = states[member.status],
            Icon = state.icon;
          return (
            <li
              key={member.userId}
              className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-3"
            >
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate font-medium text-foreground">
                  {manage ? member.displayName : "Tài khoản đã liên kết"}
                  {member.login && (
                    <span className="ml-2 text-caption font-normal text-muted-foreground">
                      @{member.login}
                    </span>
                  )}
                </p>
                {member.status === "not_connected" ? (
                  <p className="mt-1 text-caption text-muted-foreground">
                    Liên kết GitHub để nhận lời mời.
                  </p>
                ) : member.status === "failed" ? (
                  <p className="mt-1 text-caption text-destructive">
                    {member.errorCode === "GITHUB_IDENTITY_CHANGED"
                      ? "Danh tính GitHub đã đổi. Nhờ Admin đối chiếu quyền cũ trước khi mời tiếp."
                      : "Chưa xác minh được quyền. Kiểm tra kết nối hoặc nhờ giảng viên mời lại."}
                  </p>
                ) : (
                  <p className="mt-1 text-caption text-muted-foreground">
                    {member.status === "pending"
                      ? `Hạn lời mời: ${date(member.expiresAt) ?? "đang đối chiếu"}`
                      : member.status === "accepted"
                        ? "Đã đối chiếu quyền cộng tác trên GitHub."
                        : "Nhờ giảng viên gửi lại lời mời."}
                  </p>
                )}
                {member.lastCheckedAt && (
                  <p className="mt-1 text-caption text-muted-foreground">
                    Kiểm tra: {date(member.lastCheckedAt)}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-caption font-medium ${state.tone}`}
              >
                <Icon size={13} aria-hidden="true" />
                {state.label}
              </span>
              {!manage && member.status === "pending" && (
                <a
                  href={`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/invitations`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-caption font-semibold text-primary hover:underline"
                >
                  Mở lời mời GitHub
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              )}
              {manage &&
                ["expired", "failed"].includes(member.status) &&
                member.errorCode !== "GITHUB_IDENTITY_CHANGED" && (
                  <button
                    disabled={busy}
                    aria-label={`Mời lại cho ${member.displayName}`}
                    onClick={() => onInvite(member.userId)}
                    className="rounded-md border border-border px-3 py-2 text-caption font-medium text-primary transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                  >
                    Mời lại
                  </button>
                )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-caption leading-5 text-muted-foreground">
        Lời mời GitHub thường có hạn 7 ngày. Gửi lời mời chưa đồng nghĩa có
        quyền; sau khi chấp nhận, kiểm tra lại tại đây. Thông báo V-Intern và
        email mời gốc của GitHub được gửi riêng.
      </p>
    </section>
  );
}
