"use client";

/**
 * Cổng nộp CV công khai — route `#/apply` (không cần đăng nhập).
 *
 * Trái: form nộp hồ sơ (đợt đang mở + tên + email + tên tệp CV + đồng ý dữ liệu),
 * kèm xem trước khung giờ còn trống. Phải: tra cứu hồ sơ theo email + đợt —
 * timeline trạng thái 9 mức, đặt/đổi lịch phỏng vấn, bổ sung CV, rút hồ sơ.
 * Cuối trang: các vị trí đang tuyển (career-roles public).
 */

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  FileWarning,
  Hourglass,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, navigate, useRoute } from "@/lib/client/router";
import {
  applyApi,
  type AgentAnalysis,
  type ApplicationStatus,
  type ApplyMePayload,
  type ApplySlot,
  type PublicApplyRound,
  type TimelineEvent,
  type TimelineKind,
} from "@/lib/client/api";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, formatDateTime } from "@/lib/client/labels";
import { Stagger, StaggerItem } from "@/components/shared/view";
import {
  Empty,
  KeyValue,
  Panel,
  PanelHeader,
  ToneBadge,
  UserAvatar,
} from "@/components/shared/primitives";
import { ErrorBlock, InlineSpinner, LoadingBlock } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

/* ==================== Nhãn & bảng tra cứu ==================== */

type Tone = "zinc" | "teal" | "amber" | "orange" | "violet" | "emerald" | "rose" | "brand";

/** 9 trạng thái hồ sơ (theo spec cổng công khai). */
const STATUS_META: Record<ApplicationStatus, { label: string; tone: Tone; hint: string }> = {
  unverified: {
    label: "Chưa xác minh",
    tone: "zinc",
    hint: "Kiểm tra hộp thư (kể cả thư rác) và bấm link xác minh để hồ sơ được xử lý.",
  },
  queued: {
    label: "Đang chờ",
    tone: "teal",
    hint: "Email đã xác minh — hồ sơ đang chờ Agent phân tích CV.",
  },
  analyzing: {
    label: "Đang phân tích",
    tone: "amber",
    hint: "Agent đã đọc xong CV — bạn có thể chọn khung giờ phỏng vấn.",
  },
  needs_information: {
    label: "Chờ bổ sung",
    tone: "orange",
    hint: "CV chưa đủ chi tiết — bổ sung tệp CV để Agent phân tích lại.",
  },
  waitlisted: {
    label: "Danh sách chờ",
    tone: "violet",
    hint: "Bạn đang ở danh sách chờ — chọn khung giờ còn trống để vào lịch.",
  },
  booked: {
    label: "Đã đặt lịch",
    tone: "emerald",
    hint: "Lịch phỏng vấn đã xác nhận — kiểm tra email và chuẩn bị đúng giờ.",
  },
  cancelled: {
    label: "Đã hủy",
    tone: "zinc",
    hint: "Hồ sơ đã hủy. Bạn có thể nộp lại ở đợt tuyển khác.",
  },
  deferred: {
    label: "Tạm hoãn",
    tone: "amber",
    hint: "Hồ sơ được tạm hoãn sang đợt tuyển sau.",
  },
  failed: {
    label: "Thất bại",
    tone: "rose",
    hint: "Hồ sơ chưa đạt — bổ sung CV rồi gửi lại để Agent xem xét lần nữa.",
  },
};

function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "zinc" as Tone, hint: "" };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

const TIMELINE_ICONS: Record<TimelineKind, LucideIcon> = {
  submitted: FileUp,
  email_sent: Mail,
  email_verified: BadgeCheck,
  analysis_completed: Sparkles,
  needs_information: FileWarning,
  cv_updated: FileUp,
  status_changed: RefreshCw,
  waitlisted: Hourglass,
  slot_booked: CalendarCheck,
  slot_rescheduled: CalendarClock,
  slot_released: CalendarX,
  cancelled: XCircle,
  credentials_sent: KeyRound,
  credentials_resent: Send,
  credentials_recovered: KeyRound,
};

/** Trạng thái có thể đặt / đổi lịch phỏng vấn. */
const BOOKABLE_STATUSES: ApplicationStatus[] = ["analyzing", "waitlisted", "booked"];
/** Trạng thái còn đang "sống" — cho phép ứng viên tự rút hồ sơ. */
const LEAVEABLE_STATUSES: ApplicationStatus[] = [
  "queued",
  "analyzing",
  "needs_information",
  "waitlisted",
  "booked",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ==================== Tiện ích dùng chung ==================== */

/** Ô chọn tệp CV — demo chỉ lưu tên tệp, không upload thật. */
function CvFilePicker({
  value,
  onChange,
  compact,
}: {
  value: string;
  onChange: (name: string) => void;
  compact?: boolean;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f.name);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-brand/30 bg-brand/[0.06] px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-xs">
            <FileText className="size-4 shrink-0 icon text-brand-bright" />
            <span className="truncate font-mono text-ink">{value}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Bỏ tệp CV"
            className="shrink-0 text-faint transition-colors hover:text-rose"
          >
            <X className="size-3.5 icon" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={cn(
            "flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-deep/40 text-center transition-colors hover:border-brand/50 hover:bg-panel-2",
            compact ? "px-4 py-3.5" : "px-4 py-5"
          )}
        >
          <UploadCloud className="size-5 icon text-faint" />
          <span className="text-xs font-medium text-ink">Chọn tệp CV (PDF, DOC, DOCX)</span>
          <span className="text-[11px] leading-relaxed text-faint">
            Demo chỉ lưu tên tệp — không tải tệp thật lên máy chủ.
          </span>
        </button>
      )}
    </div>
  );
}

/** Timeline dọc — mỗi sự kiện: message + thời gian (mới nhất nổi bật). */
function ApplicationTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-faint">Chưa có sự kiện nào được ghi lại.</p>;
  }
  return (
    <Stagger className="space-y-0" gap={0.04}>
      {events.map((ev, i) => {
        const Icon = TIMELINE_ICONS[ev.kind] ?? Clock;
        const isLast = i === events.length - 1;
        return (
          <StaggerItem key={ev.id} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast ? (
              <span
                className="absolute bottom-0 left-[13px] top-7 w-px bg-line"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border",
                isLast
                  ? "border-brand/40 bg-brand/10 text-brand-bright"
                  : "border-line bg-panel-2 text-dim"
              )}
            >
              <Icon className="size-3.5 icon" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-xs leading-relaxed",
                  isLast ? "font-semibold text-ink" : "text-dim"
                )}
              >
                {ev.message}
              </p>
              <p className="mt-0.5 text-[11px] text-faint">
                {formatDateTime(ev.at)}
                {ev.actor ? ` · ${ev.actor}` : ""}
              </p>
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

/** Thẻ phân tích CV của Agent (gọn). */
function AnalysisCard({ analysis }: { analysis: AgentAnalysis }) {
  return (
    <div className="rounded-xl border border-line bg-deep/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-dim">
          <Sparkles className="size-4 icon text-brand-bright" />
          Agent gợi ý vai trò
        </div>
        <div className="flex items-center gap-1.5">
          <ToneBadge tone="brand">{analysis.matchedRoleLabel}</ToneBadge>
          <span className="font-mono text-xs font-semibold text-ink">
            {analysis.confidence}%
          </span>
        </div>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-dim">{analysis.summary}</p>
      {analysis.facts.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {analysis.facts.slice(0, 3).map((f) => (
            <li key={f.skill} className="flex items-start gap-2 text-[11px] leading-relaxed">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 icon text-teal" />
              <span className="min-w-0">
                <span className="font-semibold text-ink">{f.skill}</span>
                <span className="text-faint"> — {f.evidence}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {analysis.missing.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-faint">Cần bổ sung:</span>
          {analysis.missing.map((s) => (
            <ToneBadge key={s} tone="amber">
              {s}
            </ToneBadge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Danh sách khung giờ khả dụng + nút đặt / đổi lịch. */
function SlotPicker({
  me,
  onBooked,
}: {
  me: ApplyMePayload;
  onBooked: () => void;
}) {
  const email = me.application.email;
  const roundId = me.application.roundId;
  const isRebook = me.application.status === "booked";
  const slots = me.availableSlots ?? [];
  const policy = me.rebookingPolicy;
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const book = async (slot: ApplySlot) => {
    if (busyId) return;
    setBusyId(slot.id);
    try {
      const res = await applyApi.book({ email, roundId, slotId: slot.id });
      toast.success(isRebook ? "Đã đổi lịch phỏng vấn" : "Đã đặt lịch phỏng vấn", {
        description: `${formatDate(res.booking.startsAt)} · ${res.booking.location}`,
      });
      onBooked();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đặt lịch thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  if (slots.length === 0) {
    return (
      <p className="text-xs leading-relaxed text-dim">
        Hiện chưa có khung giờ trống phù hợp với vai trò được gợi ý. Vui lòng quay lại sau
        hoặc liên hệ giảng viên để được hỗ trợ.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
        {isRebook ? (
          <>
            <span>
              Còn <span className="font-semibold text-dim">{policy.attemptsRemaining}</span> lượt
              đổi lịch (đã dùng {policy.attemptsUsed}).
            </span>
            {!policy.canRebook && policy.nextEligibleAt ? (
              <span>Chờ đến {formatDateTime(policy.nextEligibleAt)} để đổi tiếp.</span>
            ) : null}
          </>
        ) : (
          <span>Sau khi đặt, bạn vẫn có thể đổi lịch (tối đa 2 lần, cách nhau 30 phút).</span>
        )}
      </div>
      <Stagger className="space-y-2" gap={0.05}>
        {slots.map((s) => {
          const busy = busyId === s.id;
          const full = s.remaining <= 0;
          return (
            <StaggerItem
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-deep/40 p-3.5 transition-colors hover:border-line-strong"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <ToneBadge tone="brand">{s.roleLabel}</ToneBadge>
                  <span className="font-mono text-xs text-dim">
                    {formatDateTime(s.startsAt)} →{" "}
                    {new Date(s.endsAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-faint">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3 icon" /> {s.location}
                  </span>
                  <span>
                    còn {s.remaining}/{s.capacity} chỗ
                  </span>
                </p>
              </div>
              <Button
                size="sm"
                disabled={busy || full || !!busyId}
                onClick={() => void book(s)}
                className={cn(
                  "rounded-lg font-semibold",
                  full
                    ? "border-line bg-panel-2 text-faint"
                    : "bg-brand text-on-brand hover:bg-brand-bright active:scale-[0.98]"
                )}
              >
                {busy ? <Loader2 className="size-3.5 animate-spin icon" /> : null}
                {full ? "Hết chỗ" : isRebook ? "Đổi lịch" : "Đặt lịch"}
              </Button>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}

/* ==================== Panel trái: nộp hồ sơ ==================== */

function SubmitPanel({
  rounds,
  prefill,
  slotsTick,
  onPrefillConsumed,
  onVerified,
}: {
  rounds: PublicApplyRound[];
  prefill: { fullName: string; email: string } | null;
  /** Tăng khi hồ sơ bên phải thay đổi đặt chỗ → nạp lại khung giờ còn trống. */
  slotsTick: number;
  onPrefillConsumed: () => void;
  onVerified: (email: string, roundId: string) => void;
}) {
  const [form, setForm] = React.useState({ roundId: "", fullName: "", email: "" });
  const [cvFileName, setCvFileName] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitResult, setSubmitResult] = React.useState<{
    verifyToken: string;
    message: string;
    email: string;
    roundId: string;
  } | null>(null);
  const [verifyBusy, setVerifyBusy] = React.useState(false);
  const [notifyEmail, setNotifyEmail] = React.useState("");
  const [notifyBusy, setNotifyBusy] = React.useState(false);

  // Chọn sẵn đợt mở đầu tiên
  React.useEffect(() => {
    if (!form.roundId && rounds.length > 0) {
      setForm((f) => ({ ...f, roundId: rounds[0].id }));
    }
  }, [rounds, form.roundId]);

  // Nhận prefills từ hành động "Nộp hồ sơ đợt khác"
  React.useEffect(() => {
    if (!prefill) return;
    setForm((f) => ({ ...f, fullName: prefill.fullName, email: prefill.email }));
    setSubmitResult(null);
    setError(null);
    onPrefillConsumed();
  }, [prefill, onPrefillConsumed]);

  const slotsRes = useResource(
    () =>
      form.roundId
        ? applyApi.slots(form.roundId)
        : Promise.resolve({ data: [] as ApplySlot[] }),
    [form.roundId, slotsTick]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!form.roundId) {
      setError("Vui lòng chọn đợt tuyển.");
      return;
    }
    if (form.fullName.trim().length < 2) {
      setError("Vui lòng nhập họ và tên (tối thiểu 2 ký tự).");
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError("Email không hợp lệ — kiểm tra lại địa chỉ bạn nhập.");
      return;
    }
    if (!consent) {
      setError("Bạn cần đồng ý với chính sách xử lý dữ liệu để nộp hồ sơ.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await applyApi.create({
        roundId: form.roundId,
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        cvFileName: cvFileName.trim() || undefined,
        consent: true,
      });
      setSubmitResult({
        verifyToken: res.verifyToken,
        message: res.message,
        email: form.email.trim().toLowerCase(),
        roundId: form.roundId,
      });
      toast.success("Đã ghi nhận hồ sơ", {
        description: "Kiểm tra email (kể cả hộp thư rác) để xác minh địa chỉ của bạn.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nộp hồ sơ thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const demoVerify = async () => {
    if (!submitResult || verifyBusy) return;
    setVerifyBusy(true);
    try {
      const res = await applyApi.verify(submitResult.verifyToken);
      toast.success("Xác minh email thành công", {
        description: res.analysis
          ? `Agent khớp ${res.analysis.confidence}% với vai trò ${res.analysis.matchedRoleLabel}.`
          : "Hồ sơ đã vào hàng đợi phân tích.",
      });
      onVerified(submitResult.email, submitResult.roundId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xác minh thất bại.");
      // Đã xác minh từ trước (409) → vẫn mở được hồ sơ
      if (err instanceof ApiError && err.status === 409) {
        onVerified(submitResult.email, submitResult.roundId);
      }
    } finally {
      setVerifyBusy(false);
    }
  };

  const registerNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notifyBusy) return;
    if (!EMAIL_RE.test(notifyEmail.trim())) {
      toast.error("Email không hợp lệ — kiểm tra lại địa chỉ bạn nhập.");
      return;
    }
    setNotifyBusy(true);
    // Mock: không gọi API — chỉ xác nhận đã ghi nhận (demo).
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Đã đăng ký nhận thông báo", {
      description: `Chúng tôi sẽ email tới ${notifyEmail.trim()} khi mở đợt tuyển mới (demo).`,
    });
    setNotifyEmail("");
    setNotifyBusy(false);
  };

  /* ----- Chưa có đợt mở → Empty + đăng ký nhận thông báo ----- */
  if (rounds.length === 0) {
    return (
      <Panel>
        <PanelHeader
          icon={<FileUp className="size-4 icon" />}
          title="Nộp hồ sơ ứng tuyển"
          description="Gửi CV — Agent đối chiếu và gợi ý vị trí phù hợp nhất."
        />
        <Empty
          icon={<Bell className="size-5 icon" />}
          title="Chưa có đợt tuyển nào đang mở"
          description="Đội ngũ V-Intern đang chuẩn bị đợt tiếp theo. Để lại email — chúng tôi sẽ báo bạn ngay khi mở đơn."
        />
        <form onSubmit={registerNotify} className="space-y-2.5 px-5 pb-5">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 icon text-faint" />
            <Input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="ban@email.vn"
              className="h-10 rounded-lg border-line bg-deep pl-10 pr-3 text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={notifyBusy}
            className="glow-brand h-10 w-full rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright active:scale-[0.99]"
          >
            {notifyBusy ? (
              <Loader2 className="size-4 animate-spin icon" />
            ) : (
              <Bell className="size-4 icon" />
            )}
            {notifyBusy ? "Đang đăng ký…" : "Đăng ký nhận thông báo"}
          </Button>
        </form>
      </Panel>
    );
  }

  /* ----- Có đợt mở → form / màn "đã gửi email xác minh" ----- */
  return (
    <Panel>
      <PanelHeader
        icon={<FileUp className="size-4 icon" />}
        title="Nộp hồ sơ ứng tuyển"
        description="Gửi CV — Agent đối chiếu và gợi ý vị trí phù hợp nhất."
      />
      <div className="space-y-5 px-5 py-5">
        {submitResult ? (
          <div className="rounded-xl border border-brand/30 bg-brand/[0.06] p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-brand/25 bg-brand/10 text-brand-bright">
                <Mail className="size-4 icon" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Đã gửi email xác minh</p>
                <p className="mt-1 text-xs leading-relaxed text-dim">{submitResult.message}</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-line bg-panel/70 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-faint">
                Mã xác minh (demo hiển thị sẵn)
              </p>
              <p className="mt-0.5 truncate font-mono text-xs text-ink">
                {submitResult.verifyToken}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => void demoVerify()}
                disabled={verifyBusy}
                className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright active:scale-[0.98]"
              >
                {verifyBusy ? (
                  <Loader2 className="size-3.5 animate-spin icon" />
                ) : (
                  <BadgeCheck className="size-3.5 icon" />
                )}
                Mô phỏng bấm link trong email (demo)
              </Button>
              <button
                type="button"
                onClick={() => setSubmitResult(null)}
                className="text-[11px] font-medium text-faint underline-offset-2 transition-colors hover:text-ink hover:underline"
              >
                Đổi thông tin và nộp lại
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-3 text-xs leading-relaxed text-rose"
              >
                <XCircle className="mt-0.5 size-4 shrink-0 icon" />
                {error}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-dim">Đợt tuyển</Label>
              <Select
                value={form.roundId}
                onValueChange={(v) => setForm((f) => ({ ...f, roundId: v }))}
              >
                <SelectTrigger className="h-10 rounded-lg border-line bg-deep text-sm text-ink">
                  <SelectValue placeholder="Chọn đợt tuyển" />
                </SelectTrigger>
                <SelectContent className="border-line bg-panel-2 text-ink">
                  {rounds.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} · {r.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-dim">Họ và tên</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Nguyễn Văn A"
                  className="h-10 rounded-lg border-line bg-deep text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-dim">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="ban@email.vn"
                  className="h-10 rounded-lg border-line bg-deep text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-dim">CV (khuyến nghị)</Label>
              <CvFilePicker value={cvFileName} onChange={setCvFileName} />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-deep/40 px-3.5 py-3">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5 data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-on-brand"
              />
              <span className="text-xs leading-relaxed text-dim">
                Tôi đồng ý với việc V-Intern xử lý thông tin và CV tôi cung cấp cho mục đích
                tuyển dụng, đúng theo chính sách dữ liệu của chương trình.
              </span>
            </label>

            <Button
              type="submit"
              disabled={busy}
              className="glow-brand h-11 w-full rounded-lg bg-brand text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin icon" /> : <FileUp className="size-4 icon" />}
              {busy ? "Đang gửi…" : "Nộp hồ sơ"}
            </Button>
          </form>
        )}

        {/* Xem trước khung giờ còn trống của đợt đang chọn */}
        <div>
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
            Khung giờ còn trống của đợt
          </p>
          {slotsRes.loading ? (
            <div className="flex items-center gap-2 px-1 py-2 text-xs text-faint">
              <InlineSpinner className="size-3.5" /> Đang tải khung giờ…
            </div>
          ) : slotsRes.error ? (
            <p className="px-1 py-2 text-xs text-faint">
              Không tải được khung giờ.{" "}
              <button
                type="button"
                className="font-semibold text-brand-bright hover:underline"
                onClick={slotsRes.reload}
              >
                Thử lại
              </button>
            </p>
          ) : (slotsRes.data?.data ?? []).length === 0 ? (
            <p className="px-1 py-2 text-xs text-faint">Đợt này chưa mở khung giờ phỏng vấn.</p>
          ) : (
            <Stagger className="space-y-1.5" gap={0.04}>
              {(slotsRes.data?.data ?? []).map((s) => (
                <StaggerItem
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-deep/40 px-3 py-2 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Clock className="size-3.5 shrink-0 icon text-faint" />
                    <span className="truncate text-dim">
                      <span className="font-semibold text-ink">{s.roleLabel}</span>
                      {" · "}
                      {formatDateTime(s.startsAt)}
                    </span>
                  </span>
                  <span className={cn("font-mono", s.remaining > 0 ? "text-teal" : "text-rose")}>
                    {s.remaining > 0 ? `còn ${s.remaining} chỗ` : "hết chỗ"}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
      <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-faint">
        Sau khi nộp, một email xác minh sẽ được gửi tới địa chỉ của bạn. Hồ sơ chỉ được
        Agent phân tích sau khi email được xác minh.
      </p>
    </Panel>
  );
}

/* ==================== Panel phải: tra cứu hồ sơ ==================== */

function UpdateCvForm({
  email,
  roundId,
  currentCv,
  onUpdated,
}: {
  email: string;
  roundId: string;
  currentCv: string | null;
  onUpdated: () => void;
}) {
  const [cvFileName, setCvFileName] = React.useState(currentCv ?? "");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!cvFileName.trim()) {
      toast.error("Hãy chọn tệp CV mới trước khi gửi.");
      return;
    }
    setBusy(true);
    try {
      const res = await applyApi.updateCv({ email, roundId, cvFileName: cvFileName.trim() });
      toast.success("Đã gửi CV mới", {
        description: `Agent phân tích lại: khớp ${res.analysis.confidence}% với vai trò ${res.analysis.matchedRoleLabel}.`,
      });
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi CV thất bại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-orange/30 bg-orange/[0.06] p-4"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-orange/25 bg-orange/10 text-orange">
          <FileWarning className="size-4 icon" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Bổ sung CV</p>
          <p className="mt-1 text-xs leading-relaxed text-dim">
            CV hiện tại chưa đủ chi tiết để Agent đánh giá. Chọn tệp CV đầy đủ hơn (dự án,
            kinh nghiệm, kỹ năng) rồi gửi lại.
          </p>
        </div>
      </div>
      <CvFilePicker value={cvFileName} onChange={setCvFileName} compact />
      <Button
        type="submit"
        disabled={busy}
        className="h-10 w-full rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin icon" /> : <Send className="size-4 icon" />}
        {busy ? "Đang gửi…" : "Gửi CV mới"}
      </Button>
    </form>
  );
}

function LookupPanel({
  rounds,
  lookup,
  meRes,
  onOpen,
  onClear,
  onProfileChanged,
  onApplyAgain,
}: {
  rounds: PublicApplyRound[];
  lookup: { email: string; roundId: string } | null;
  meRes: {
    data: ApplyMePayload | null;
    loading: boolean;
    error: unknown;
    reload: () => void;
  };
  onOpen: (email: string, roundId: string) => void;
  onClear: () => void;
  /** Gọi khi hồ sơ thay đổi (đặt/đổi lịch, bổ sung CV, rút hồ sơ). */
  onProfileChanged: () => void;
  onApplyAgain: (fullName: string, email: string) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [roundId, setRoundId] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [accessBusy, setAccessBusy] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [leaveBusy, setLeaveBusy] = React.useState(false);

  React.useEffect(() => {
    if (!roundId && rounds.length > 0) setRoundId(rounds[0].id);
  }, [rounds, roundId]);

  // Đồng bộ ô email/đợt với hồ sơ đang mở (vd. sau khi xác minh link)
  React.useEffect(() => {
    if (lookup) {
      setEmail(lookup.email);
      setRoundId(lookup.roundId);
    }
  }, [lookup]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundId) {
      setFormError("Vui lòng chọn đợt tuyển.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setFormError("Email không hợp lệ — kiểm tra lại địa chỉ bạn nhập.");
      return;
    }
    setFormError(null);
    onOpen(email.trim().toLowerCase(), roundId);
  };

  const sendAccess = async () => {
    if (!lookup || accessBusy) return;
    setAccessBusy(true);
    try {
      const res = await applyApi.requestAccess({
        roundId: lookup.roundId,
        email: lookup.email,
      });
      toast.success("Đã gửi yêu cầu truy cập", { description: res.message });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi yêu cầu thất bại.");
    } finally {
      setAccessBusy(false);
    }
  };

  const leave = async () => {
    if (!lookup || leaveBusy) return;
    setLeaveBusy(true);
    try {
      await applyApi.leave({ email: lookup.email, roundId: lookup.roundId });
      toast.success("Đã rút hồ sơ", {
        description: "Bạn có thể nộp lại hồ sơ ở đợt tuyển khác.",
      });
      setLeaveOpen(false);
      onProfileChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rút hồ sơ thất bại.");
    } finally {
      setLeaveBusy(false);
    }
  };

  const me = meRes.data;

  return (
    <Panel>
      <PanelHeader
        icon={<Search className="size-4 icon" />}
        title="Tra cứu hồ sơ của bạn"
        description="Nhập email đã dùng khi nộp — theo dõi trạng thái và lịch phỏng vấn."
      />
      <div className="space-y-4 px-5 py-5">
        <form onSubmit={search} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-dim">Email ứng tuyển</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@email.vn"
              className="h-10 rounded-lg border-line bg-deep text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-dim">Đợt tuyển</Label>
            <Select value={roundId} onValueChange={setRoundId}>
              <SelectTrigger className="h-10 rounded-lg border-line bg-deep text-sm text-ink">
                <SelectValue placeholder="Chọn đợt" />
              </SelectTrigger>
              <SelectContent className="border-line bg-panel-2 text-ink">
                {rounds.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} · {r.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              className="h-10 w-full rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright active:scale-[0.98] sm:w-auto sm:px-5"
            >
              <Search className="size-4 icon" /> Tra cứu
            </Button>
          </div>
        </form>
        {formError ? <p className="text-xs leading-relaxed text-rose">{formError}</p> : null}

        {rounds.length === 0 ? (
          <Empty
            icon={<Search className="size-5 icon" />}
            title="Chưa thể tra cứu"
            description="Khi có đợt tuyển mở, bạn có thể tra cứu hồ sơ ứng tuyển tại đây."
          />
        ) : !lookup ? (
          <div className="rounded-xl border border-line bg-deep/40 p-4 text-xs leading-relaxed text-dim">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Sparkles className="size-4 icon text-brand-bright" /> Luồng xử lý hồ sơ
            </p>
            <ol className="mt-2.5 space-y-1.5">
              <li>1. Nộp hồ sơ và xác minh email qua link được gửi tới hộp thư.</li>
              <li>2. Agent phân tích CV và gợi ý vị trí phù hợp nhất.</li>
              <li>3. Chọn khung giờ phỏng vấn — email xác nhận đến ngay sau đó.</li>
            </ol>
          </div>
        ) : meRes.loading ? (
          <LoadingBlock rows={4} className="border-0 shadow-none" />
        ) : meRes.error ? (
          meRes.error instanceof ApiError && meRes.error.status === 404 ? (
            <Empty
              icon={<Search className="size-5 icon" />}
              title="Không tìm thấy hồ sơ"
              description="Kiểm tra lại email và đợt tuyển — email phải trùng với địa chỉ bạn đã dùng khi nộp hồ sơ."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  disabled={accessBusy}
                  onClick={() => void sendAccess()}
                  className="rounded-lg border-line text-dim hover:border-line-strong hover:bg-panel-2 hover:text-ink"
                >
                  {accessBusy ? (
                    <Loader2 className="size-3.5 animate-spin icon" />
                  ) : (
                    <Send className="size-3.5 icon" />
                  )}
                  Gửi lại hướng dẫn truy cập
                </Button>
              }
            />
          ) : (
            <ErrorBlock error={meRes.error} onRetry={meRes.reload} className="border-0 shadow-none" />
          )
        ) : me ? (
          <ProfileBody
            me={me}
            onProfileChanged={onProfileChanged}
            onClear={onClear}
            onApplyAgain={onApplyAgain}
            leaveProps={{
              open: leaveOpen,
              setOpen: setLeaveOpen,
              busy: leaveBusy,
              onConfirm: () => void leave(),
            }}
          />
        ) : null}
      </div>
    </Panel>
  );
}

/* ==================== Thân hồ sơ (đã tra cứu) ==================== */

function ProfileBody({
  me,
  onProfileChanged,
  onClear,
  onApplyAgain,
  leaveProps,
}: {
  me: ApplyMePayload;
  onProfileChanged: () => void;
  onClear: () => void;
  onApplyAgain: (fullName: string, email: string) => void;
  leaveProps: {
    open: boolean;
    setOpen: (v: boolean) => void;
    busy: boolean;
    onConfirm: () => void;
  };
}) {
  const app = me.application;
  const status = app.status;
  const meta = STATUS_META[status];
  const booking = me.booking;
  const bookedSlot = booking
    ? (me.availableSlots ?? []).find((s) => s.id === booking.slotId) ?? null
    : null;
  const showSlots =
    BOOKABLE_STATUSES.includes(status) && (me.availableSlots ?? []).length > 0;

  return (
    <Stagger className="space-y-4" gap={0.05}>
      {/* Tiêu đề hồ sơ */}
      <StaggerItem className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <UserAvatar name={app.fullName} size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{app.fullName}</p>
            <p className="truncate text-xs text-dim">{app.email}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-faint">
              <FileText className="size-3 icon" />
              {app.cvFileName ? (
                <span className="truncate font-mono">{app.cvFileName}</span>
              ) : (
                <span>Chưa có tệp CV</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <ApplicationStatusBadge status={status} />
          <span className="text-[11px] text-faint">Nộp lúc {formatDateTime(app.createdAt)}</span>
        </div>
      </StaggerItem>

      <StaggerItem>
        <p className="rounded-lg border border-line bg-deep/40 px-3.5 py-2.5 text-xs leading-relaxed text-dim">
          {meta.hint}
        </p>
      </StaggerItem>

      {/* Thông tin đợt */}
      {me.round ? (
        <StaggerItem className="grid grid-cols-2 gap-3">
          <KeyValue label="Đợt tuyển">
            {me.round.name} <span className="font-mono text-dim">({me.round.code})</span>
          </KeyValue>
          <KeyValue label="Nhận hồ sơ đến">{formatDate(me.round.closesAt)}</KeyValue>
        </StaggerItem>
      ) : null}

      {/* Phân tích Agent */}
      {me.analysis ? (
        <StaggerItem>
          <AnalysisCard analysis={me.analysis} />
        </StaggerItem>
      ) : null}

      {/* Đã đặt lịch → thẻ nổi bật */}
      {booking ? (
        <StaggerItem>
          <div className="relative overflow-hidden rounded-xl border border-brand/30 bg-brand/[0.07] p-4">
            <div
              className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-brand/10 blur-2xl"
              aria-hidden
            />
            <div className="relative">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-bright">
                <CalendarCheck className="size-4 icon" /> Lịch phỏng vấn của bạn
              </div>
              <p className="mt-2.5 text-sm font-semibold text-ink">
                {me.analysis?.matchedRoleLabel ?? booking.roleCode}
              </p>
              <p className="mt-1 font-mono text-xs text-dim">
                {formatDateTime(booking.startsAt)} →{" "}
                {new Date(booking.endsAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-dim">
                <MapPin className="size-3.5 icon text-faint" /> {booking.location}
              </p>
              <div className="mt-3 rounded-lg border border-line bg-panel/70 px-3 py-2 text-xs leading-relaxed text-dim">
                <span className="font-semibold text-ink">Chuẩn bị:</span> có mặt trước{" "}
                {bookedSlot?.minimumPreparationMinutes ?? 60} phút — kiểm tra mic, webcam và
                môi trường lập trình.
              </div>
              <Link
                to="/login"
                className="glow-brand mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.98]"
              >
                Đăng nhập để bắt đầu <ArrowRight className="size-3.5 icon" />
              </Link>
            </div>
          </div>
        </StaggerItem>
      ) : null}

      {/* Chờ bổ sung / thất bại → form bổ sung CV */}
      {status === "needs_information" || status === "failed" ? (
        <StaggerItem>
          <UpdateCvForm
            email={app.email}
            roundId={app.roundId}
            currentCv={app.cvFileName}
            onUpdated={onProfileChanged}
          />
        </StaggerItem>
      ) : null}

      {/* Đặt / đổi lịch */}
      {showSlots ? (
        <StaggerItem>
          <div className="rounded-xl border border-line bg-deep/40 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink">
              <CalendarClock className="size-4 icon text-brand-bright" />
              {booking ? "Đổi khung giờ phỏng vấn" : "Chọn khung giờ phỏng vấn"}
            </p>
            <SlotPicker me={me} onBooked={onProfileChanged} />
          </div>
        </StaggerItem>
      ) : null}

      {/* Đã hủy / tạm hoãn → nộp đợt khác */}
      {status === "cancelled" || status === "deferred" ? (
        <StaggerItem>
          <div className="rounded-xl border border-line bg-deep/40 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink">
              <RefreshCw className="size-4 icon text-faint" /> Sẵn sàng thử lại
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-dim">
              Hồ sơ này đã kết thúc ở đợt hiện tại. Bạn có thể nộp mới ở đợt tuyển khác —
              thông tin bên dưới được điền sẵn.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => onApplyAgain(app.fullName, app.email)}
                className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright active:scale-[0.98]"
              >
                <FileUp className="size-3.5 icon" /> Nộp hồ sơ đợt khác
              </Button>
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] font-medium text-faint underline-offset-2 transition-colors hover:text-ink hover:underline"
              >
                Tra cứu hồ sơ khác
              </button>
            </div>
          </div>
        </StaggerItem>
      ) : null}

      {/* Timeline */}
      <StaggerItem>
        <div className="rounded-xl border border-line bg-deep/40 p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink">
            <Clock className="size-4 icon text-faint" /> Diễn biến hồ sơ
          </p>
          <ApplicationTimeline events={me.timeline} />
        </div>
      </StaggerItem>

      {/* Rút hồ sơ */}
      {LEAVEABLE_STATUSES.includes(status) ? (
        <StaggerItem className="flex justify-end">
          <button
            type="button"
            onClick={() => leaveProps.setOpen(true)}
            className="text-[11px] font-medium text-faint underline-offset-2 transition-colors hover:text-rose hover:underline"
          >
            Rút hồ sơ ứng tuyển
          </button>
        </StaggerItem>
      ) : null}

      <ConfirmDialog
        open={leaveProps.open}
        onOpenChange={leaveProps.setOpen}
        title="Rút hồ sơ ứng tuyển?"
        description="Hồ sơ sẽ chuyển sang trạng thái đã hủy và khung giờ phỏng vấn (nếu có) được giải phóng. Bạn vẫn có thể nộp lại ở đợt tuyển khác."
        confirmLabel="Rút hồ sơ"
        destructive
        busy={leaveProps.busy}
        onConfirm={leaveProps.onConfirm}
      />
    </Stagger>
  );
}

/* ==================== Section vị trí đang tuyển ==================== */

function RolesSection() {
  const res = useResource(() => applyApi.roles());
  const roles = res.data?.data ?? [];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-dim">
          Vị trí đang tuyển
        </h2>
        <span className="text-[11px] text-faint">
          {roles.length > 0 ? `${roles.length} vị trí` : ""}
        </span>
      </div>
      {res.loading ? (
        <LoadingBlock variant="cards" rows={3} />
      ) : res.error ? (
        <ErrorBlock error={res.error} onRetry={res.reload} />
      ) : roles.length === 0 ? (
        <Panel>
          <Empty
            icon={<Sparkles className="size-5 icon" />}
            title="Chưa có vị trí nào đang mở"
            description="Danh sách vị trí sẽ xuất hiện khi đợt tuyển mới được công bố."
          />
        </Panel>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
          {roles.map((r) => (
            <StaggerItem key={r.code}>
              <Panel hoverable className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">{r.name}</h3>
                    <p className="mt-0.5 text-[11px] text-faint">
                      {r.level === "intern" ? "Thực tập sinh" : "Junior"} ·{" "}
                      {r.language === "vi" ? "Tiếng Việt" : "English"}
                    </p>
                  </div>
                  <ToneBadge tone="brand" dot>
                    Đang nhận
                  </ToneBadge>
                </div>
                <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-dim">
                  {r.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.requiredSkills.map((s) => (
                    <span
                      key={s.skill}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-panel-2 px-2.5 py-0.5 text-[11px] font-medium text-dim"
                    >
                      {s.skill}
                      <span className="font-mono text-[10px] text-faint">{s.weight}%</span>
                    </span>
                  ))}
                </div>
                {r.optionalSkills.length > 0 ? (
                  <p className="mt-2.5 text-[11px] text-faint">
                    Điểm cộng: {r.optionalSkills.slice(0, 4).join(" · ")}
                    {r.optionalSkills.length > 4 ? " …" : ""}
                  </p>
                ) : null}
              </Panel>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}

/* ==================== View chính ==================== */

export function ApplyView() {
  const { search } = useRoute();

  const roundsRes = useResource(() => applyApi.rounds());
  const rounds = roundsRes.data?.data ?? [];

  const [lookup, setLookup] = React.useState<{ email: string; roundId: string } | null>(null);
  const [prefill, setPrefill] = React.useState<{ fullName: string; email: string } | null>(null);
  const [slotsTick, setSlotsTick] = React.useState(0);
  const formSectionRef = React.useRef<HTMLDivElement>(null);

  const meRes = useResource(
    () =>
      lookup
        ? applyApi.me(lookup.email, lookup.roundId)
        : Promise.resolve(null as ApplyMePayload | null),
    [lookup?.email, lookup?.roundId]
  );

  /** Mở hồ sơ theo email + đợt (dùng cho tra cứu + sau xác minh). */
  const openProfile = React.useCallback(
    (email: string, roundId: string) => {
      setLookup((prev) =>
        prev?.email === email && prev?.roundId === roundId ? prev : { email, roundId }
      );
      meRes.reload();
    },
    [meRes]
  );

  /** Hồ sơ thay đổi (đặt/đổi lịch, bổ sung CV, rút hồ sơ) → nạp lại cả 2 panel. */
  const profileChanged = React.useCallback(() => {
    meRes.reload();
    setSlotsTick((t) => t + 1);
  }, [meRes]);

  const clearLookup = React.useCallback(() => setLookup(null), []);
  const consumePrefill = React.useCallback(() => setPrefill(null), []);

  const applyAgain = React.useCallback((fullName: string, email: string) => {
    setPrefill({ fullName, email });
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.info("Điền lại form bên trái để nộp đợt mới", {
      description: "Thông tin cũ đã được mang sang — bạn chỉ cần chọn đợt và gửi.",
    });
  }, []);

  // Link email xác minh: #/apply?verify=<token> → tự xác minh + mở hồ sơ
  const verifyParam = search.get("verify");
  const handledTokenRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const token = verifyParam?.trim();
    if (!token || handledTokenRef.current === token) return;
    handledTokenRef.current = token;
    let cancelled = false;
    void (async () => {
      try {
        const res = await applyApi.verify(token);
        if (cancelled) return;
        toast.success("Xác minh email thành công", {
          description: res.analysis
            ? `Agent khớp ${res.analysis.confidence}% với vai trò ${res.analysis.matchedRoleLabel}.`
            : "Hồ sơ đã vào hàng đợi phân tích.",
        });
        openProfile(res.application.email, res.application.roundId);
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Xác minh thất bại.");
      } finally {
        if (!cancelled) navigate("/apply", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [verifyParam, openProfile]);

  return (
    <div className="relative min-h-screen bg-canvas">
      <div
        className="dot-bg pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
        {/* Thanh đầu trang */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" aria-label="Về trang chủ" className="py-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-dim transition-colors hover:text-ink"
            >
              Về trang chủ
            </Link>
            <Link
              to="/login"
              className="glow-brand inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-4 text-xs font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.98]"
            >
              <LogIn className="size-3.5 icon" /> Đăng nhập
            </Link>
          </div>
        </header>

        {/* Giới thiệu */}
        <div className="mb-7 mt-8 max-w-2xl">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-bright">
            Cổng tuyển dụng công khai
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-[28px]">
            Nộp hồ sơ thực tập cùng V-Intern
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-dim">
            Chọn đợt tuyển, gửi CV và để Agent đối chiếu CV của bạn với vị trí phù hợp —
            đặt lịch phỏng vấn chỉ trong vài phút, không cần đăng nhập.
          </p>
        </div>

        {/* Nội dung chính */}
        {roundsRes.loading ? (
          <div className="space-y-5">
            <LoadingBlock variant="detail" rows={2} />
            <LoadingBlock rows={3} />
          </div>
        ) : roundsRes.error ? (
          <ErrorBlock error={roundsRes.error} onRetry={roundsRes.reload} />
        ) : (
          <>
            <div
              ref={formSectionRef}
              className="grid scroll-mt-6 items-start gap-5 lg:grid-cols-2"
            >
              <SubmitPanel
                rounds={rounds}
                prefill={prefill}
                slotsTick={slotsTick}
                onPrefillConsumed={consumePrefill}
                onVerified={openProfile}
              />
              <LookupPanel
                rounds={rounds}
                lookup={lookup}
                meRes={meRes}
                onOpen={openProfile}
                onClear={clearLookup}
                onProfileChanged={profileChanged}
                onApplyAgain={applyAgain}
              />
            </div>
            <div className="mt-8">
              <RolesSection />
            </div>
          </>
        )}

        {/* Chân trang gọn */}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-[11px] text-faint">
          <span>V-Intern — thực tập ảo cùng AI, dự án thật.</span>
          <span className="font-mono">© 2026 V-Intern Labs</span>
        </footer>
      </div>
    </div>
  );
}
