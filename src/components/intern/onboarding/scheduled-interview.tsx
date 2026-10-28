"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Clock3 } from "lucide-react";
import { useRecruitmentFlow } from "./recruitment-provider";

function time(value: string | null, timezone: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Chưa có lịch";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      timeZone: timezone ?? "Asia/Ho_Chi_Minh",
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return new Date(value).toISOString();
  }
}
const duration = (milliseconds: number) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 3600) > 0 ? `${Math.floor(seconds / 3600)} giờ ` : ""}${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};
export function ScheduledInterview() {
  const { profile, interview, busy, notice, start, reload } =
    useRecruitmentFlow();
  const schedule = profile.interviewSchedule;
  const [tick, setTick] = useState({ key: "", elapsed: 0 });
  useEffect(() => {
    if (!schedule) return;
    const key = schedule.serverNow,
      began = performance.now();
    const timer = setInterval(
      () => setTick({ key, elapsed: performance.now() - began }),
      1000,
    );
    return () => clearInterval(timer);
  }, [schedule]);
  if (!schedule) return null;
  const now =
    Date.parse(schedule.serverNow) +
    (tick.key === schedule.serverNow ? tick.elapsed : 0);
  const opens = Date.parse(schedule.startsAt ?? ""),
    closes = Date.parse(schedule.deadlineAt ?? "");
  const valid =
    Number.isFinite(now) && Number.isFinite(opens) && Number.isFinite(closes);
  const phase =
    valid && ["waiting", "ready"].includes(schedule.phase)
      ? now < opens
        ? "waiting"
        : now >= closes
          ? "no_show"
          : "ready"
      : schedule.phase;
  const cooling =
    profile.nextEligibleAt && Date.parse(profile.nextEligibleAt) > now;
  const canStart =
    valid &&
    phase === "ready" &&
    profile.attemptsRemaining > 0 &&
    !cooling &&
    !busy;
  const active =
    phase === "started" &&
    ["in_progress", "created"].includes(interview?.session.status ?? "");
  const status = {
    waiting: "Phòng chờ đang mở. Buổi phỏng vấn sẽ bắt đầu đúng giờ hẹn.",
    ready: "Đã đến giờ phỏng vấn. Bạn có thể bắt đầu ngay.",
    no_show:
      "Hồ sơ chờ đợt tiếp theo. Bạn chưa bắt đầu trong 15 phút từ giờ hẹn; lịch sử và số lượt được giữ nguyên.",
    cancelled:
      "Lịch hiện tại không còn hiệu lực. Liên hệ giảng viên để được hướng dẫn.",
    started: active
      ? "Phiên phỏng vấn của bạn đang được lưu. Tiếp tục cùng phiên, không tạo thêm lượt."
      : "Lịch này đã được sử dụng. Lần phỏng vấn tiếp theo cần giảng viên xếp lịch mới.",
  }[phase];
  return (
    <section className="mx-auto max-w-4xl space-y-7">
      <header className="space-y-3">
        <p className="flex items-center gap-2 text-caption font-bold  text-primary">
          <CalendarClock size={17} aria-hidden="true" />
          Lịch phỏng vấn của bạn
        </p>
        <h1 className="text-page font-bold tracking-tight text-foreground">
          Sẵn sàng cho bước tiếp theo
        </h1>
        <p className="max-w-2xl leading-7 text-muted-foreground">
          Vị trí được xếp từ CV và khung giờ giảng viên đã mở. Bạn không cần
          chọn lại nghề hoặc tạo tài khoản khác.
        </p>
      </header>
      <div className="grid gap-6 border-y border-border py-6 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-caption font-semibold  text-muted-foreground">
            Vị trí được xếp
          </p>
          <h2 className="mt-2 text-page font-bold text-foreground">
            {schedule.roleName ?? "Đang chờ lịch hợp lệ"}
          </h2>
          <p className="mt-3 text-body text-muted-foreground">
            {time(schedule.startsAt, schedule.timezone)}
          </p>
          <p className="mt-1 text-caption text-muted-foreground">
            Múi giờ: {schedule.timezone ?? "Chưa xác định"}
          </p>
        </div>
        {valid && ["waiting", "ready"].includes(phase) && (
          <div className="sm:border-l sm:border-border sm:pl-8">
            <p className="flex items-center gap-2 text-body text-muted-foreground">
              <Clock3 size={15} aria-hidden="true" />
              {phase === "waiting"
                ? "Mở phòng sau"
                : "Còn thời gian để bắt đầu"}
            </p>
            <p
              className="mt-2 font-mono text-page font-semibold tabular-nums text-foreground"
              aria-label="Thời gian chờ"
            >
              {duration((phase === "waiting" ? opens : closes) - now)}
            </p>
            <p className="mt-2 text-caption text-muted-foreground">
              Hạn bắt đầu: {time(schedule.deadlineAt, schedule.timezone)}
            </p>
          </div>
        )}
      </div>
      <p
        role="status"
        className={`max-w-3xl text-body leading-7 ${phase === "no_show" || phase === "cancelled" ? "text-warning" : "text-foreground"}`}
      >
        {status}
      </p>
      <dl className="flex flex-wrap gap-x-10 gap-y-4 text-body">
        <div>
          <dt className="text-muted-foreground">Lượt đã dùng</dt>
          <dd className="mt-1 text-section font-semibold tabular-nums text-foreground">
            {profile.attemptNumber}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Lượt còn lại</dt>
          <dd className="mt-1 text-section font-semibold tabular-nums text-foreground">
            {profile.attemptsRemaining}
          </dd>
        </div>
      </dl>
      {profile.attemptsRemaining <= 0 && (
        <p className="text-body text-warning">
          Bạn đã dùng hết số lượt cho phép. Đổi nghề hoặc tải lại trang không
          tạo thêm lượt.
        </p>
      )}
      {cooling && (
        <p className="text-body text-warning">
          Có thể phỏng vấn lại từ{" "}
          {time(profile.nextEligibleAt, schedule.timezone)}.
        </p>
      )}
      {notice && (
        <p role="alert" className="text-body text-destructive">
          {notice}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <button
          className="student-action"
          disabled={!canStart}
          onClick={async () => {
            if (!(await start())) await reload();
          }}
        >
          Bắt đầu phỏng vấn
        </button>
        {active && (
          <Link className="student-link" href="/intern/onboarding/interview">
            Tiếp tục phiên phỏng vấn
          </Link>
        )}
        <button
          className="student-link"
          disabled={busy}
          onClick={() => void reload()}
        >
          Cập nhật lịch
        </button>
        {phase === "no_show" || phase === "cancelled" ? (
          <Link className="student-link" href="/apply">
            Xem hồ sơ CV
          </Link>
        ) : null}
      </div>
      <p className="text-caption leading-6 text-muted-foreground">
        Đồng hồ trên màn hình giúp bạn theo dõi. Máy chủ xác nhận giờ và quyền
        bắt đầu; phiên đã bắt đầu được tiếp tục theo thời hạn bài phỏng vấn
        riêng.
      </p>
    </section>
  );
}
