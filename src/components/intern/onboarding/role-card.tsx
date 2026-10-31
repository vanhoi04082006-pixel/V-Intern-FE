"use client";

import type { RecruitmentRole } from "./recruitment-presentation";

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
          ? "student-role-option flex min-w-0 cursor-pointer flex-col rounded-panel border border-primary bg-accent p-4 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring"
          : "student-role-option flex min-w-0 cursor-pointer flex-col rounded-panel border border-border bg-card p-4 transition-colors hover:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring"
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
          className="grid size-11 shrink-0 place-items-center rounded-panel bg-muted"
        >
          <Icon className="size-5 text-foreground" />
        </span>
        {checked ? (
          <span className="rounded-full bg-primary px-2 py-1 text-caption font-bold text-primary-foreground">
            Đang chọn
          </span>
        ) : null}
      </span>
      <span className="mt-3 text-body font-bold text-foreground">{role.label}</span>
      <span className="mt-1 text-small leading-relaxed text-muted-foreground">
        {role.tagline}
      </span>
      <span className="font-hand mt-3 text-[15px] leading-snug text-muted-foreground">
        {role.tags.join(", ")}
      </span>
    </label>
  );
}
