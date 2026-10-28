"use client";

/**
 * Shared helpers cho các view ADMIN (Task 5): bảng, dialog, icon theo module,
 * badge hành động, hook debounce. Không trùng functionality shared primitives.
 */
import * as React from "react";
import {
  Activity as ActivityIcon,
  ClipboardCheck,
  Cpu,
  ListChecks,
  Lock,
  LogIn,
  Pencil,
  Plus,
  Presentation,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToneBadge } from "@/components/shared/primitives";
import { useAction } from "@/lib/client/use-resource";
import { ApiError } from "@/lib/client/http";

/* ============================ hooks ============================ */

/** Debounce giá trị lọc (search) để đỡ gọi API từng keystroke. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** useAction + tự toast lỗi (dùng cho mọi mutation trong admin). */
export function useToastAction(onSuccess?: () => void) {
  const action = useAction(onSuccess);
  React.useEffect(() => {
    if (action.error) toast.error(action.error);
  }, [action.error]);
  return action;
}

/** Xử lý 409 VERSION_CONFLICT: toast riêng + reload danh sách. */
export function toastConflict(reload: () => void, message?: string) {
  toast.error(message ?? "Dữ liệu vừa được người khác cập nhật. Đã tải lại bản mới nhất.");
  reload();
}

/** Bắt lỗi mutation — trả về true nếu là xung đột phiên bản (đã xử lý). */
export function handleMutationError(err: unknown, reload: () => void): boolean {
  if (err instanceof ApiError && err.status === 409) {
    toastConflict(reload, `${err.message} Đang tải lại dữ liệu mới nhất.`);
    return true;
  }
  return false;
}

/* ============================ table ============================ */

export function TableShell({
  children,
  minWidth = 780,
}: {
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-deep/50">{children}</thead>;
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-t border-line transition-colors hover:bg-panel-2/60",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3 align-middle text-ink", className)}>{children}</td>;
}

/* ============================ dialog ============================ */

/** Dialog chuẩn admin: p-0, header/body/footer giống ConfirmDialog. */
export function AdminDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "card-surface gap-0 overflow-hidden rounded-2xl border-line bg-panel p-0",
          maxWidth
        )}
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-left text-sm leading-relaxed text-dim">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="px-6 py-5">{children}</div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-deep/40 px-6 py-4">
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================ buttons ============================ */

export function BrandButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn("rounded-lg bg-brand text-on-brand hover:bg-brand-bright", className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function LineButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      className={cn(
        "rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

/* ============================ form field ============================ */

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-dim">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-rose">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-faint">{hint}</span>
      ) : null}
    </label>
  );
}

/* ============================ module meta (activity) ============================ */

export type Tone = "emerald" | "teal" | "amber" | "rose" | "orange" | "zinc" | "brand";

/** Icon + màu + nhãn cho từng module sự kiện. */
export const moduleMeta: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; tone: Tone; label: string }
> = {
  auth: { icon: LogIn, tone: "teal", label: "Xác thực" },
  recruitment: { icon: UserCheck, tone: "brand", label: "Tuyển dụng" },
  session: { icon: Presentation, tone: "amber", label: "Buổi thực tập" },
  task: { icon: ListChecks, tone: "orange", label: "Công việc" },
  evaluation: { icon: ClipboardCheck, tone: "emerald", label: "Đánh giá" },
  system: { icon: Cpu, tone: "zinc", label: "Hệ thống" },
};

export function ModuleIconBadge({ module }: { module: string }) {
  const meta = moduleMeta[module] ?? { ...moduleMeta.system, label: module };
  const Icon = meta.icon;
  const toneBg: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-300",
    teal: "bg-teal-500/10 text-teal-300",
    amber: "bg-amber-500/10 text-amber",
    rose: "bg-rose-500/10 text-rose",
    orange: "bg-orange-500/10 text-orange",
    zinc: "bg-zinc-500/10 text-zinc-300",
    brand: "bg-brand/12 text-brand-bright",
  };
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
        toneBg[meta.tone]
      )}
      aria-hidden
    >
      <Icon className="icon" />
    </span>
  );
}

/* ============================ action meta ============================ */

/** Icon suy ra từ mã hành động (dùng cho feed không có module). */
export function actionIcon(action: string): React.ComponentType<{ className?: string }> {
  const a = action.toUpperCase();
  if (a.includes("LOCKED")) return Lock;
  if (a.includes("LOGIN") || a.includes("REGISTER")) return LogIn;
  if (a.includes("CREATED") || a.includes("CREATE") || a.includes("MEMBER_ADDED"))
    return a.includes("MEMBER") ? UserPlus : Plus;
  if (a.includes("UPDATED") || a.includes("UPDATE") || a.includes("REWORK")) return Pencil;
  if (a.includes("COMPLETED") || a.includes("PASSED") || a.includes("FINALIZED"))
    return ListChecks;
  if (a.includes("MEMBER")) return Users;
  return ActivityIcon;
}

/** Nhãn tiếng Việt + màu badge cho mã hành động (fallback: mã gốc). */
const actionMeta: Record<string, { label: string; tone: Tone }> = {
  LOGIN: { label: "Đăng nhập", tone: "teal" },
  REGISTER: { label: "Đăng ký", tone: "teal" },
  USER_CREATED: { label: "Tạo người dùng", tone: "emerald" },
  ACCOUNT_LOCKED: { label: "Khoá tài khoản", tone: "rose" },
  ACCOUNT_STATUS: { label: "Đổi trạng thái", tone: "zinc" },
  PLAN_CONFIRMED: { label: "Duyệt kế hoạch AI", tone: "amber" },
  MEMBER_ADDED: { label: "Thêm thành viên", tone: "teal" },
  TASK_COMPLETED: { label: "Hoàn thành task", tone: "emerald" },
  SUBMISSION_REWORK: { label: "Yêu cầu làm lại", tone: "amber" },
  INTERVIEW_PASSED: { label: "Phỏng vấn đạt", tone: "emerald" },
  INTERVIEW_FAILED: { label: "Phỏng vấn chưa đạt", tone: "rose" },
  EVALUATION_FINALIZED: { label: "Chốt đánh giá", tone: "emerald" },
  SESSION_CREATED: { label: "Tạo phiên thực tập", tone: "emerald" },
  CYCLE_CREATED: { label: "Tạo chu kỳ đánh giá", tone: "emerald" },
  SETTING_UPDATED: { label: "Cập nhật cấu hình", tone: "amber" },
  AI_RUN: { label: "AI hoạt động", tone: "zinc" },
};

export function actionTone(action: string): Tone {
  const exact = actionMeta[action];
  if (exact) return exact.tone;
  const a = action.toUpperCase();
  if (a.includes("FAILED") || a.includes("LOCKED") || a.includes("DELETE")) return "rose";
  if (a.includes("PASSED") || a.includes("COMPLETED") || a.includes("CREATED")) return "emerald";
  if (a.includes("UPDATED") || a.includes("REWORK")) return "amber";
  return "zinc";
}

export function ActionBadge({ action }: { action: string }) {
  const meta = actionMeta[action];
  return (
    <ToneBadge tone={meta?.tone ?? actionTone(action)} className="font-mono">
      {meta?.label ?? action}
    </ToneBadge>
  );
}

/* ============================ form controls ============================ */

const controlClass =
  "h-10 rounded-lg border-line bg-deep px-3 text-sm text-ink transition-colors placeholder:text-faint focus-visible:border-line-strong focus-visible:ring-0";

export function FormInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input className={cn(controlClass, className)} {...props} />;
}

export function FormTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      className={cn(
        "min-h-24 rounded-lg border-line bg-deep px-3 py-2 text-sm text-ink transition-colors placeholder:text-faint focus-visible:border-line-strong focus-visible:ring-0",
        className
      )}
      {...props}
    />
  );
}

export function FormSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(controlClass, "w-full text-dim hover:border-line-strong", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-line bg-panel-2 text-ink">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ============================ nhãn dùng chung admin ============================ */

export const userStatusMeta: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Hoạt động", tone: "emerald" },
  pending: { label: "Chờ kích hoạt", tone: "amber" },
  locked: { label: "Đã khoá", tone: "rose" },
};

export const phaseMeta: Record<string, { label: string; tone: Tone }> = {
  introduction: { label: "Giới thiệu", tone: "zinc" },
  technical: { label: "Kỹ thuật", tone: "brand" },
  english: { label: "Tiếng Anh", tone: "amber" },
  communication: { label: "Giao tiếp", tone: "teal" },
};

export const difficultyMeta: Record<string, { label: string; tone: Tone }> = {
  easy: { label: "Dễ", tone: "emerald" },
  medium: { label: "Trung bình", tone: "amber" },
  hard: { label: "Khó", tone: "rose" },
};

export const templateDifficultyMeta: Record<string, { label: string; tone: Tone }> = {
  beginner: { label: "Cơ bản", tone: "emerald" },
  intermediate: { label: "Trung cấp", tone: "amber" },
  advanced: { label: "Nâng cao", tone: "rose" },
};

export const templateStatusMeta: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Đang dùng", tone: "emerald" },
  draft: { label: "Bản nháp", tone: "amber" },
  archived: { label: "Đã lưu trữ", tone: "zinc" },
};

export const auditActionMeta: Record<string, { label: string; tone: Tone }> = {
  LOGIN: { label: "Đăng nhập", tone: "teal" },
  CREATE: { label: "Tạo mới", tone: "emerald" },
  UPDATE: { label: "Cập nhật", tone: "amber" },
  DELETE: { label: "Xóa", tone: "rose" },
  STATUS_CHANGE: { label: "Đổi trạng thái", tone: "zinc" },
};
