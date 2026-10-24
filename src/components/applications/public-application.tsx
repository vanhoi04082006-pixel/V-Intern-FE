"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/auth/api-client";
import { useResource } from "@/lib/api/use-resource";
import {
  publicRounds,
  submitApplication,
  verifyApplication,
  myApplication,
  requestApplicationAccess,
  supplementCv,
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
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
          Hồ sơ · phiên bản {application.revision}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-navy">
          {application.fullName}
        </h2>
        <p className="mt-2 text-slate-600">
          {applicationLabels[application.status] ?? application.status}
        </p>
      </div>
      {booking && booking.status === "confirmed" && (
        <div className="border-l-4 border-blue-500 bg-blue-50/60 p-5">
          <h3 className="font-semibold">{booking.roleName}</h3>
          <p className="mt-2 text-lg font-medium">
            {new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "full",
              timeStyle: "short",
              timeZone: booking.timezone,
            }).format(new Date(booking.startsAt))}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Múi giờ {booking.timezone} · Lịch lần {booking.version}
          </p>
          <p className="mt-3 text-sm leading-6">
            Email lịch và thông tin đăng nhập được gửi riêng. Đăng nhập bằng tài
            khoản trong email; đổi mật khẩu tạm trước khi phỏng vấn. Đến trễ từ
            15 phút khi chưa bắt đầu: chờ đợt tiếp theo.
          </p>
          {showLoginLink && (
            <Link
              className="mt-4 inline-block font-semibold text-blue-700"
              href="/login"
            >
              Đi tới đăng nhập →
            </Link>
          )}
        </div>
      )}
      <ol className="space-y-0 border-l border-slate-200 pl-5">
        {application.timeline.map((event, i) => (
          <li className="relative pb-5" key={`${event.kind}-${i}`}>
            <span className="absolute -left-[25px] top-2 size-2 rounded-full bg-blue-500" />
            <p className="text-sm leading-6 text-slate-700">{event.message}</p>
            <time className="text-xs text-slate-400">
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
    <main className="min-h-screen bg-[#f5f7fc] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <nav className="flex items-center justify-between text-sm">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-blue-700"
          >
            V-Intern
          </Link>
          <Link href="/login" className="font-medium text-slate-600">
            Đã có tài khoản? Đăng nhập →
          </Link>
        </nav>
        <PageTitle
          title="Khởi đầu hành trình thực tập"
          subtitle="Nộp CV một lần. Agent phân tích năng lực, đề xuất nghề phù hợp và xếp lịch trong các khung giờ được mở."
        />
        {checking ? (
          <LoadingState label="Đang kiểm tra hồ sơ..." />
        ) : initialError ? (
          <ErrorState
            error={initialError}
            onRetry={() => window.location.reload()}
          />
        ) : application ? (
          <div className="space-y-6 bg-white p-6 sm:p-8">
            <ApplicationTimeline application={application} />
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
            {["needs_information", "failed", "waitlisted"].includes(
              application.status,
            ) && (
              <form
                className="space-y-3 border-t border-slate-200 pt-5"
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
                <label className="block text-sm">
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
          <section className="bg-white p-6 sm:p-8">
            {rounds.loading ? (
              <LoadingState />
            ) : rounds.error ? (
              <ErrorState error={rounds.error} onRetry={rounds.reload} />
            ) : !rounds.data?.length ? (
              <Empty
                title="Chưa có đợt đang nhận hồ sơ"
                description="Bạn có thể quay lại khi người phụ trách mở đợt tuyển mới."
              />
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
                <label className="text-sm font-medium sm:col-span-2">
                  Đợt ứng tuyển
                  <select name="roundId" className={inputClass} required>
                    {rounds.data.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} · nhận đến{" "}
                        {new Date(r.closesAt).toLocaleDateString("vi-VN")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
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
                <label className="text-sm font-medium">
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
                <label className="text-sm font-medium sm:col-span-2">
                  CV của bạn
                  <input
                    name="cv"
                    type="file"
                    accept=".pdf,.docx"
                    className={inputClass}
                    required
                  />
                  <span className="mt-2 block font-normal text-slate-500">
                    PDF có văn bản hoặc DOCX · tối đa 5 MB. CV scan cần được
                    xuất lại thành văn bản, hiện chưa có OCR.
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm leading-6 text-slate-600 sm:col-span-2">
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
            <details className="mt-7 border-t border-slate-200 pt-5">
              <summary className="cursor-pointer text-sm font-semibold text-blue-700">
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
                <label className="text-sm">
                  Mã đợt tuyển
                  <input
                    name="round"
                    className={inputClass}
                    required
                    placeholder="Mã đợt trong thông tin tuyển dụng"
                  />
                </label>
                <label className="text-sm">
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
            className="border-l-2 border-emerald-500 pl-4 text-sm leading-6 text-emerald-900"
          >
            {notice}
          </p>
        )}
        {action.error ? <ErrorState error={action.error} /> : null}
        <p className="text-xs leading-6 text-slate-500">
          Hồ sơ có xác minh email riêng, không cần tạo tài khoản trước. Việc lên
          lịch chỉ diễn ra khi nghề đủ điều kiện và còn chỗ trong lịch tuyển.
        </p>
      </div>
    </main>
  );
}
