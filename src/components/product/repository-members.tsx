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
    tone: "text-amber-700 bg-amber-50",
  },
  accepted: {
    label: "Đã có quyền",
    icon: CheckCircle2,
    tone: "text-emerald-700 bg-emerald-50",
  },
  expired: {
    label: "Lời mời hết hạn",
    icon: Clock3,
    tone: "text-slate-600 bg-slate-100",
  },
  failed: {
    label: "Cần kiểm tra",
    icon: TriangleAlert,
    tone: "text-rose-700 bg-rose-50",
  },
  not_connected: {
    label: "Chưa liên kết",
    icon: Link2,
    tone: "text-slate-600 bg-slate-100",
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
      className="border-t border-slate-200/70 pt-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">
          {manage ? "Thành viên & lời mời" : "Quyền truy cập của bạn"}
        </h3>
        {!manage && (
          <button
            disabled={busy}
            onClick={onCheck}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Kiểm tra quyền GitHub của tôi
          </button>
        )}
      </div>
      {!members.length && (
        <p className="py-2 text-sm text-slate-500">
          Chưa ghi nhận lời mời. Liên kết GitHub và chờ hệ thống đồng bộ thành
          viên của phiên.
        </p>
      )}
      <ul className="divide-y divide-slate-100">
        {members.map((member) => {
          const state = states[member.status],
            Icon = state.icon;
          return (
            <li
              key={member.userId}
              className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-3"
            >
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate font-medium text-slate-800">
                  {manage ? member.displayName : "Tài khoản đã liên kết"}
                  {member.login && (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      @{member.login}
                    </span>
                  )}
                </p>
                {member.status === "not_connected" ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Liên kết GitHub để nhận lời mời.
                  </p>
                ) : member.status === "failed" ? (
                  <p className="mt-1 text-xs text-rose-700">
                    {member.errorCode === "GITHUB_IDENTITY_CHANGED"
                      ? "Danh tính GitHub đã đổi. Nhờ Admin đối chiếu quyền cũ trước khi mời tiếp."
                      : "Chưa xác minh được quyền. Kiểm tra kết nối hoặc nhờ giảng viên mời lại."}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    {member.status === "pending"
                      ? `Hạn lời mời: ${date(member.expiresAt) ?? "đang đối chiếu"}`
                      : member.status === "accepted"
                        ? "Đã đối chiếu quyền cộng tác trên GitHub."
                        : "Nhờ giảng viên gửi lại lời mời."}
                  </p>
                )}
                {member.lastCheckedAt && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Kiểm tra: {date(member.lastCheckedAt)}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${state.tone}`}
              >
                <Icon size={13} aria-hidden="true" />
                {state.label}
              </span>
              {!manage && member.status === "pending" && (
                <a
                  href={`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/invitations`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
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
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
                  >
                    Mời lại
                  </button>
                )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Lời mời GitHub thường có hạn 7 ngày. Gửi lời mời chưa đồng nghĩa có
        quyền; sau khi chấp nhận, kiểm tra lại tại đây. Thông báo V-Intern và
        email mời gốc của GitHub được gửi riêng.
      </p>
    </section>
  );
}
