"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/auth/api-client";
import { useResource } from "@/lib/api/use-resource";
import {
  AsteriskDoodle,
  PaperclipDoodle,
  SparkleDoodle,
  StarDoodle,
  Tape,
} from "@/components/v-intern/doodles";
import {
  publicRounds,
  submitApplication,
  verifyApplication,
  myApplication,
  requestApplicationAccess,
  supplementCv,
  leaveCandidateSession,
  type Application,
  applicationLabels,
} from "@/lib/api/applications";
import {
  buttonClass,
  inputClass,
  PageTitle,
  Empty,
} from "@/components/product/primitives";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { useAction } from "@/components/product/use-action";
export function ApplicationTimeline({
  application,
  showLoginLink = true,
}: {
  application: Application;
  showLoginLink?: boolean;
}) {
  const booking = application.booking;
  return (
    <section className="space-y-5" aria-label="Tiến trình hồ sơ">
      <div>
        <p className="text-caption font-semibold text-primary">
          Hồ sơ, phiên bản {application.revision}
        </p>
        <h2 className="mt-2 text-page font-semibold text-foreground">
          {application.fullName}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {applicationLabels[application.status] ?? application.status}
        </p>
      </div>
      {booking && booking.status === "confirmed" && (
        <div className="border-l-2 border-dashed border-primary bg-info-subtle p-5">
          <h3 className="font-semibold">{booking.roleName}</h3>
          <p className="mt-2 text-section font-medium">
            {new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "full",
              timeStyle: "short",
              timeZone: booking.timezone,
            }).format(new Date(booking.startsAt))}
          </p>
          <p className="mt-1 text-body text-muted-foreground">
            Múi giờ {booking.timezone}, Lịch lần {booking.version}
          </p>
          <p className="mt-3 text-body leading-6">
            Email lịch và thông tin đăng nhập được gửi riêng. Đăng nhập bằng tài
            khoản trong email; đổi mật khẩu tạm trước khi phỏng vấn. Đến trễ từ
            15 phút khi chưa bắt đầu: chờ đợt tiếp theo.
          </p>
          {showLoginLink && (
            <Link
              className="mt-4 inline-block font-semibold text-primary"
              href="/login"
            >
              Đi tới đăng nhập
            </Link>
          )}
        </div>
      )}
      <ol className="space-y-0 border-l-2 border-dashed border-blue/30 pl-5">
        {application.timeline.map((event, i) => (
          <li className="relative pb-5" key={`${event.kind}-${i}`}>
            {/* Chấm mực xanh — nét tròn lệch tay như dấu bút trên trang sổ */}
            <span
              aria-hidden="true"
              className="absolute -left-[27px] top-1.5 size-2.5 rounded-[46%_54%_50%_50%] border border-blue bg-blue/85"
            />
            <p className="text-body leading-6 text-foreground">{event.message}</p>
            <time className="text-caption text-muted-foreground">
              {new Date(event.createdAt).toLocaleString("vi-VN")}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function PublicApplication() {
  const rounds = useResource(
      useCallback((signal: AbortSignal) => publicRounds(signal), []),
    ),
    action = useAction();
  const [application, setApplication] = useState<Application | null>(null),
    [checking, setChecking] = useState(true),
    [initialError, setInitialError] = useState<unknown>(),
    [notice, setNotice] = useState("");
  const verification = useRef<{
    token: string;
    promise: Promise<unknown>;
  } | null>(null);
  useEffect(() => {
    let active = true,
      sequence = 0;
    const load = () => {
      const current = ++sequence;
      const token = new URLSearchParams(window.location.hash.slice(1)).get(
        "verify",
      );
      if (token) {
        window.history.replaceState(null, "", window.location.pathname);
        if (verification.current?.token !== token)
          verification.current = { token, promise: verifyApplication(token) };
      }
      void (verification.current?.promise ?? Promise.resolve())
        .then(myApplication)
        .then((result) => {
          if (active && current === sequence) {
            setInitialError(undefined);
            setApplication(result);
          }
        })
        .catch((error) => {
          if (
            active &&
            current === sequence &&
            !(error instanceof ApiError && error.statusCode === 401)
          )
            setInitialError(error);
        })
        .finally(() => {
          if (active && current === sequence) setChecking(false);
        });
    };
    const onHashChange = () => {
      setChecking(true);
      load();
    };
    window.addEventListener("hashchange", onHashChange);
    load();
    return () => {
      active = false;
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);
  return (
    <main className="app-surface min-h-dvh bg-grid-paper bg-background px-4 py-6 sm:px-8">
      <div className="public-application-layout space-y-8">
        <nav className="flex items-center justify-between text-body">
          <Link
            href="/"
            className="text-section font-bold tracking-tight text-primary"
          >
            V-Intern
          </Link>
          <Link href="/login" className="font-medium text-muted-foreground">
            Đã có tài khoản? Đăng nhập
          </Link>
        </nav>
        <div className="relative">
          <AsteriskDoodle className="pointer-events-none absolute -top-4 right-2 h-4 w-4 text-blue/30 motion-safe:animate-bob" />
          <SparkleDoodle className="pointer-events-none absolute -left-6 top-8 hidden h-4 w-4 text-blue/25 sm:block" />
          <PageTitle
            title="Khởi đầu hành trình thực tập"
            subtitle="Nộp CV một lần. Agent phân tích năng lực, đề xuất nghề phù hợp và xếp lịch trong các khung giờ được mở."
          />
        </div>
        {checking ? (
          <LoadingState label="Đang kiểm tra hồ sơ..." />
        ) : initialError ? (
          <ErrorState
            error={initialError}
            onRetry={() => window.location.reload()}
          />
        ) : application ? (
          <div className="sketch-card group relative space-y-6 p-6 sm:p-8">
            <Tape className="-top-3 left-1/2 ml-[-48px]" rotate={-3} variant="mint" />
            <PaperclipDoodle className="pointer-events-none absolute -right-3.5 -top-5 h-11 w-6 text-ink/30" />
            <StarDoodle className="pointer-events-none absolute right-5 top-4 h-5 w-5 text-ink-faint/70" />
            <ApplicationTimeline application={application} />
            <div className="flex flex-wrap items-center gap-3">
              <button
                className={buttonClass}
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () =>
                    setApplication(await myApplication()),
                  )
                }
              >
                Cập nhật tiến trình
              </button>
              {["cancelled", "deferred"].includes(application.status) && (
                <button
                  className={buttonClass}
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(async () => {
                      await leaveCandidateSession();
                      setApplication(null);
                      setNotice(
                        "Hồ sơ cũ và lịch sử được giữ nguyên. Bạn có thể nộp vào một đợt đang mở khác.",
                      );
                    })
                  }
                >
                  Nộp hồ sơ đợt khác
                </button>
              )}
            </div>
            {["needs_information", "failed", "waitlisted"].includes(
              application.status,
            ) && (
              <form
                className="space-y-3 border-t border-border pt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget),
                    cv = form.get("cv");
                  if (cv instanceof File && cv.size)
                    void action.run(async () =>
                      setApplication(await supplementCv(cv)),
                    );
                }}
              >
                <h3 className="font-semibold">Bổ sung CV</h3>
                <label className="block text-body">
                  CV PDF/DOCX, tối đa 5 MB
                  <input
                    name="cv"
                    type="file"
                    accept=".pdf,.docx"
                    required
                    className={`${inputClass} mt-2`}
                  />
                </label>
                <button className={buttonClass} disabled={action.busy}>
                  Nộp bản bổ sung
                </button>
              </form>
            )}
          </div>
        ) : (
          <section className="p-6 sm:p-8">
            <Tape className="-top-3 left-1/2 ml-[-48px]" rotate={-3} />
            {rounds.loading ? (
              <LoadingState />
            ) : rounds.error ? (
              <ErrorState error={rounds.error} onRetry={rounds.reload} />
            ) : !rounds.data?.length ? (
              <div className="dashed-cut rounded-xl p-4 sm:p-6">
                <Empty
                  title="Chưa có đợt đang nhận hồ sơ"
                  description="Bạn có thể quay lại khi người phụ trách mở đợt tuyển mới."
                />
                <p className="font-hand mt-1 text-center text-body text-ink-soft">
                  ghé lại sau nhé — có đợt mới sẽ dán thông báo ngay ✎
                </p>
              </div>
            ) : (
              <form
                className="grid gap-5 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  void action.run(async () => {
                    await submitApplication(new FormData(form));
                    setNotice(
                      "Đã tiếp nhận yêu cầu. Nếu email hợp lệ, hãy kiểm tra thư xác minh (kể cả thư rác). Bạn chưa được cấp tài khoản cho đến khi xác minh và có lịch.",
                    );
                    form.reset();
                  });
                }}
              >
                <label className="text-body font-medium sm:col-span-2">
                  Đợt ứng tuyển
                  <select name="roundId" className={inputClass} required>
                    {rounds.data.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}, nhận đến{" "}
                        {new Date(r.closesAt).toLocaleDateString("vi-VN")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-body font-medium">
                  Họ và tên
                  <input
                    name="fullName"
                    className={inputClass}
                    minLength={2}
                    maxLength={128}
                    required
                    autoComplete="name"
                  />
                </label>
                <label className="text-body font-medium">
                  Email nhận lịch
                  <input
                    name="email"
                    type="email"
                    className={inputClass}
                    maxLength={320}
                    required
                    autoComplete="email"
                  />
                </label>
                <label className="text-body font-medium sm:col-span-2">
                  CV của bạn
                  <input
                    name="cv"
                    type="file"
                    accept=".pdf,.docx"
                    className={inputClass}
                    required
                  />
                  <span className="mt-2 block font-normal text-muted-foreground">
                    PDF có văn bản hoặc DOCX, tối đa 5 MB. CV scan cần được
                    xuất lại thành văn bản, hiện chưa có OCR.
                  </span>
                </label>
                <label className="flex items-start gap-3 text-body leading-6 text-muted-foreground sm:col-span-2">
                  <input
                    className="mt-1"
                    type="checkbox"
                    name="consentVersion"
                    value="cv-consent-v1"
                    required
                  />
                  Tôi đồng ý V-Intern lưu và xử lý CV qua dịch vụ AI để phân
                  tích kỹ năng, chọn nghề và lên lịch phỏng vấn. Tôi có quyền
                  cung cấp hồ sơ này; không đưa mật khẩu hay thông tin tài chính
                  vào CV.
                </label>
                <div className="sm:col-span-2">
                  <button className={buttonClass} disabled={action.busy}>
                    {action.busy
                      ? "Đang nhận hồ sơ…"
                      : "Nộp CV & nhận email xác minh"}
                  </button>
                </div>
              </form>
            )}
            <details className="dashed-cut mt-7 rounded-xl p-5">
              <summary className="cursor-pointer text-body font-semibold text-primary">
                Đã nộp CV? Nhận lại liên kết theo dõi
              </summary>
              <form
                className="mt-4 grid gap-3 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  void action.run(async () => {
                    await requestApplicationAccess(
                      String(data.get("round")),
                      String(data.get("email")),
                    );
                    setNotice(
                      "Nếu có hồ sơ, email theo dõi sẽ được xếp gửi. Chờ ít nhất 60 giây giữa hai lần yêu cầu.",
                    );
                  });
                }}
              >
                <label className="text-body">
                  Mã đợt tuyển
                  <input
                    name="round"
                    className={inputClass}
                    required
                    placeholder="Mã đợt trong thông tin tuyển dụng"
                  />
                </label>
                <label className="text-body">
                  Email đã nộp
                  <input
                    name="email"
                    className={inputClass}
                    type="email"
                    required
                  />
                </label>
                <button
                  className={`${buttonClass} sm:col-span-2 sm:justify-self-start`}
                  disabled={action.busy}
                >
                  Nhận lại liên kết
                </button>
              </form>
            </details>
          </section>
        )}
        {notice && (
          <p
            role="status"
            className="border-l-2 border-dashed border-success pl-4 text-body leading-6 text-success"
          >
            {notice}
          </p>
        )}
        {action.error ? <ErrorState error={action.error} /> : null}
        <p className="text-caption leading-6 text-muted-foreground">
          Hồ sơ có xác minh email riêng, không cần tạo tài khoản trước. Việc lên
          lịch chỉ diễn ra khi nghề đủ điều kiện và còn chỗ trong lịch tuyển.
        </p>
      </div>
    </main>
  );
}
