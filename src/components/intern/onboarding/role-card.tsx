"use client";

import type { RecruitmentRole } from "./data/recruitment-mock-data";
import { TagPill } from "./onboarding-primitives";

/**
 * Card lựa chọn vai trò ứng tuyển — pattern radio thuần (input sr-only bên
 * trong label): chọn bằng click/keyboard đều hoạt động native, trạng thái
 * chọn đọc được qua radio semantics + viền/nền nổi bật (không chỉ màu).
 */
export function RoleCard({
  role,
  checked,
  onChange,
}: {
  role: RecruitmentRole;
  checked: boolean;
  onChange: (id: RecruitmentRole["id"]) => void;
}) {
  const Icon = role.icon;

  return (
    <label
      className={
        checked
          ? "flex min-w-0 cursor-pointer flex-col rounded-xl border-2 border-brand bg-blue-50/50 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-brand/40"
          : "flex min-w-0 cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-colors hover:border-brand/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand/40"
      }
    >
      <input
        type="radio"
        name="recruitment-role"
        value={role.id}
        checked={checked}
        onChange={() => onChange(role.id)}
        className="sr-only"
      />
      <span className="flex items-start justify-between gap-2">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100"
        >
          <Icon className="size-5 text-navy" />
        </span>
        {checked ? (
          <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
            Đang chọn
          </span>
        ) : null}
      </span>
      <span className="mt-3 text-[15px] font-bold text-navy">{role.label}</span>
      <span className="mt-1 text-[13px] leading-relaxed text-slate-600">
        {role.tagline}
      </span>
      <span className="mt-3 flex flex-wrap gap-1.5">
        {role.tags.map((tag) => (
          <TagPill key={tag} tone={role.tone}>
            {tag}
          </TagPill>
        ))}
      </span>
    </label>
  );
}
