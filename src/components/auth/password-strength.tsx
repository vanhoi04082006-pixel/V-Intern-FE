import { cn } from "@/lib/utils";

/* --------------------------- thước độ mạnh --------------------------- */

const STRENGTH_LEVELS = [
  { label: "Yếu", color: "var(--danger)" },
  { label: "Trung bình", color: "var(--warning)" },
  { label: "Khá", color: "var(--success)" },
  { label: "Mạnh", color: "var(--success)" },
] as const;

function scorePassword(pw: string): number {
  if (!pw) return 0;
  /* Chưa đủ 8 ký tự thì tối đa chỉ "Yếu" — trùng với ràng buộc tối thiểu. */
  if (pw.length < 8) return 1;
  let s = 1; /* đã đạt tối thiểu 8 ký tự */
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s += 1;
  return Math.min(s, 4);
}

/**
 * PasswordStrength — thước độ mạnh mật khẩu, 4 vạch mực
 * (đỏ → hổ phách → xanh), vẽ tay theo phong cách notebook.
 *
 * Component UI thuần (không gọi API, không ràng buộc logic submit):
 * chỉ nhận chuỗi mật khẩu đang gõ và vẽ lại vạch — dùng kèm
 * PasswordField ở register / đổi mật khẩu.
 *
 * Màu dùng biến CSS toàn cục đã có trong repo:
 * --danger (journey.css), --warning / --success / --ink (tokens.css).
 */
export function PasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);
  const level = STRENGTH_LEVELS[Math.max(0, score - 1)];
  return (
    <div
      className="mt-2"
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-label={`Độ mạnh mật khẩu: ${level.label}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex flex-1 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-[7px] flex-1 rounded-[4px_5px_4px_5px] border-2 transition-colors duration-200",
                i < score
                  ? "border-[var(--ink)]"
                  : "border-dashed border-[color-mix(in_srgb,var(--ink)_35%,transparent)]",
              )}
              style={i < score ? { background: level.color } : undefined}
            />
          ))}
        </div>
        <span
          className="shrink-0 text-[0.7rem] font-bold uppercase tracking-wide"
          style={{ color: level.color }}
        >
          {level.label}
        </span>
      </div>
    </div>
  );
}
