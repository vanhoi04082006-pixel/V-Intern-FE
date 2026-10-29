"use client";

/**
 * Luồng ứng viên công khai — nộp CV vào đợt tuyển, kiểm tra trạng thái.
 * Dùng cookie vintern_candidate riêng của BE (không cần đăng nhập).
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  FileUp,
  Loader2,
  Mail,
  Paperclip,
  Send,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import {
  fetchPublicRounds,
  fetchMyApplication,
  submitApplication,
  supplementApplicationCv,
  leaveApplicationSession,
  verifyApplicationToken,
  type ApplicationRound,
} from "@/lib/api/recruitment";
import { ApiError, errorMessage } from "@/lib/api/transport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/landing/logo";
import { FadeIn } from "@/components/landing/reveal";
import { SectionCard, StatusBadge, KeyVal } from "@/components/shared/kit";
import { fmtDateTime } from "@/lib/api/client";

function useRounds() {
  return useQuery<ApplicationRound[]>({
    queryKey: ["public-rounds"],
    queryFn: ({ signal }) => fetchPublicRounds(signal),
  });
}

function useMyApplication(enabled: boolean) {
  return useQuery({
    queryKey: ["my-application"],
    queryFn: ({ signal }) => fetchMyApplication(signal),
    enabled,
    retry: false,
  });
}

/* ── Form nộp CV ── */
function ApplyForm({ rounds }: { rounds: ApplicationRound[] }) {
  const { toast } = useToast();
  const [roundId, setRoundId] = useState(rounds[0]?.id ?? "");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !cv) return;
    if (cv.size > 5 * 1024 * 1024) {
      toast({
        title: "Tệp CV quá lớn",
        description: "CV cần là PDF hoặc DOCX, tối đa 5 MB.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await submitApplication(
        { roundId, email, fullName, consentVersion: "cv-consent-v1" },
        cv,
      );
      setDone(true);
      toast({
        title: "Đã nộp hồ sơ ✦",
        description: "Kiểm tra email để nhận link truy cập hồ sơ của bạn.",
      });
    } catch (error) {
      toast({
        title: "Nộp hồ sơ chưa thành công",
        description: errorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SectionCard>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
          <h2 className="text-lg font-extrabold text-ink">Hồ sơ đã được ghi nhận!</h2>
          <p className="max-w-md text-sm leading-relaxed text-ink-soft">
            Hệ thống gửi cho bạn một email chứa <strong>link truy cập hồ sơ</strong>{" "}
            (dạng <code className="rounded bg-paper px-1">…/#/verify?token=…</code>).
            Mở link đó để theo dõi trạng thái và bổ sung CV bất cứ lúc nào.
          </p>
        </div>
      </SectionCard>
    );
  }

  const inputCls =
    "h-12 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium text-ink placeholder:text-ink-faint focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ap-name" className="flex items-center gap-1.5 text-[13px] font-bold">
            <User className="h-3.5 w-3.5 text-blue" aria-hidden="true" /> Họ và tên
          </Label>
          <Input id="ap-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} required placeholder="Nguyễn Văn A" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-email" className="flex items-center gap-1.5 text-[13px] font-bold">
            <Mail className="h-3.5 w-3.5 text-blue" aria-hidden="true" /> Email
          </Label>
          <Input id="ap-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required placeholder="ban@student.edu.vn" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-[13px] font-bold">
          <Paperclip className="h-3.5 w-3.5 text-blue" aria-hidden="true" /> Đợt tuyển
        </Label>
        <div className="flex flex-wrap gap-2">
          {rounds.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoundId(r.id)}
              className={
                "rounded-xl border-2 px-4 py-2.5 text-left text-sm font-bold transition-all " +
                (roundId === r.id
                  ? "border-blue bg-blue-mist text-blue shadow-[2px_2px_0_0_var(--blue)]"
                  : "border-ink/15 bg-raised text-ink-soft hover:border-blue/50 hover:text-blue")
              }
            >
              {r.name}
              <span className="mt-0.5 block font-mono text-[10px] font-medium opacity-70">
                {r.closesAt ? `hết hạn ${fmtDateTime(r.closesAt)}` : "đang mở"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ap-cv" className="flex items-center gap-1.5 text-[13px] font-bold">
          <FileUp className="h-3.5 w-3.5 text-blue" aria-hidden="true" /> Tệp CV (PDF/DOCX, ≤ 5MB)
        </Label>
        <label
          htmlFor="ap-cv"
          className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-ink/25 bg-raised px-4 py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-blue hover:text-blue"
        >
          <FileUp className="h-5 w-5 shrink-0" aria-hidden="true" />
          {cv ? <span className="truncate text-ink">{cv.name} · {(cv.size / 1024).toFixed(0)} KB</span> : "Kéo CV vào đây hoặc bấm để chọn tệp"}
        </label>
        <input
          id="ap-cv"
          type="file"
          accept=".pdf,.docx"
          className="sr-only"
          onChange={(e) => setCv(e.target.files?.[0] ?? null)}
        />
      </div>

      <p className="text-[12px] leading-relaxed text-ink-faint">
        Bằng việc nộp CV, bạn đồng ý cho V-Intern xử lý dữ liệu CV theo chính sách
        consent <strong>cv-consent-v1</strong> — chỉ dùng cho mục đích tuyển thực tập.
      </p>

      <Button
        type="submit"
        disabled={loading || !cv || !roundId || !consent}
        className="group h-[52px] w-full rounded-xl border-2 border-ink bg-royal text-sm font-bold text-white shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-royal-deep hover:shadow-[6px_6px_0_0_var(--ink)] disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang nộp hồ sơ…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" /> Nộp hồ sơ ứng tuyển
          </>
        )}
      </Button>
    </form>
  );
}

/* ── Trạng thái hồ sơ (cookie ứng viên) ── */
function ApplicationStatus() {
  const { data, isLoading, error } = useMyApplication(true);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <SectionCard title="Hồ sơ của bạn">
        <p className="py-6 text-center text-sm text-ink-soft">Đang kiểm tra phiên ứng viên…</p>
      </SectionCard>
    );
  }
  if (error instanceof ApiError && error.statusCode === 401) {
    return (
      <SectionCard title="Hồ sơ của bạn" description="Chưa có phiên truy cập hồ sơ. Nộp CV hoặc mở link xác minh từ email.">
        <p className="font-hand text-[16px] text-ink-faint">một mình một cõi trắng tinh… ✦</p>
      </SectionCard>
    );
  }
  if (!data) return null;

  return (
    <SectionCard
      title="Hồ sơ của bạn"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await leaveApplicationSession();
            window.location.reload();
          }}
        >
          Thoát phiên
        </Button>
      }
    >
      <div className="space-y-3">
        <KeyVal label="Trạng thái">
          <StatusBadge status={data.status} />
        </KeyVal>
        <KeyVal label="Đợt tuyển">{data.roundName ?? "—"}</KeyVal>
        <KeyVal label="Nộp lúc">{fmtDateTime(data.submittedAt)}</KeyVal>
        {data.interviewSlot ? <KeyVal label="Lịch phỏng vấn">{fmtDateTime(data.interviewSlot)}</KeyVal> : null}
      </div>
    </SectionCard>
  );
}

export function ApplyView() {
  const navigate = useAppStore((s) => s.navigate);
  const { data: rounds, isLoading, error } = useRounds();

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <header className="mx-auto flex h-[72px] w-full max-w-3xl items-center justify-between px-4 pt-4">
        <button
          type="button"
          onClick={() => navigate("landing")}
          className="group inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-ink/15 bg-raised px-4 text-sm font-bold text-ink transition-all hover:-translate-x-0.5 hover:border-blue hover:text-blue"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          Về trang chủ
        </button>
        <Logo className="text-lg" />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <FadeIn>
          <div className="sketch-card relative p-7 sm:p-9">
            <div className="tape -top-3 left-10 z-20" />
            <span className="inline-flex -rotate-1 items-center gap-1.5 rounded-full border-2 border-ink bg-blue-mist px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-blue">
              cổng ứng viên · không cần tài khoản
            </span>
            <h1 className="mt-5 text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">
              Ứng tuyển thực tập ảo,
              <br />
              <span className="marker">bắt đầu từ CV của bạn.</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Nộp CV vào đợt tuyển đang mở. Sau khi hồ sơ được duyệt, bạn sẽ nhận
              email mời phỏng vấn AI và mở tài khoản sinh viên.
            </p>

            <div className="mt-7 space-y-6">
              <ApplicationStatus />
              {isLoading ? (
                <p className="py-6 text-center text-sm text-ink-soft">Đang tải đợt tuyển…</p>
              ) : error ? (
                <p className="py-6 text-center text-sm text-rose-600">{errorMessage(error)}</p>
              ) : rounds && rounds.length > 0 ? (
                <ApplyForm rounds={rounds} />
              ) : (
                <p className="py-6 text-center font-hand text-[16px] text-ink-faint">
                  hiện chưa có đợt tuyển nào đang mở — quay lại sau nhé! ✦
                </p>
              )}
            </div>
          </div>
        </FadeIn>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-4 pb-6 text-center font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-ink-faint">
        v-intern · cổng ứng viên công khai
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Xác minh token truy cập ứng viên (#/verify?token=...)             */
/* ------------------------------------------------------------------ */

export function VerifyView() {
  const navigate = useAppStore((s) => s.navigate);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");

  useState(() => {
    // Chạy một lần khi mount.
    const token = new URLSearchParams(window.location.search).get("token")
      ?? window.location.hash.split("token=")[1]?.split("&")[0]
      ?? "";
    if (!token) {
      setVerifying(false);
      setMessage("Không tìm thấy mã truy cập trong liên kết.");
      return;
    }
    verifyApplicationToken(token)
      .then(() => {
        setVerified(true);
        setVerifying(false);
      })
      .catch((error) => {
        setVerifying(false);
        setMessage(errorMessage(error));
      });
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 font-sans text-ink">
      <FadeIn className="w-full max-w-md">
        <div className="sketch-card p-8 text-center">
          <div className="tape -top-3 left-1/2 z-20 -translate-x-1/2" />
          {verifying ? (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue" aria-hidden="true" />
              <h1 className="mt-4 text-xl font-extrabold">Đang xác minh liên kết…</h1>
            </>
          ) : verified ? (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden="true" />
              <h1 className="mt-4 text-xl font-extrabold">Đã xác minh truy cập!</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Phiên ứng viên đã sẵn sàng. Bạn có thể xem trạng thái hồ sơ và
                bổ sung CV ở cổng ứng viên.
              </p>
              <Button onClick={() => navigate("apply")} className="mt-6 h-12 rounded-xl border-2 border-ink bg-royal px-6 font-bold text-white shadow-[4px_4px_0_0_var(--ink)]">
                Mở hồ sơ của tôi
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-extrabold">Liên kết chưa hợp lệ</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{message}</p>
              <Button variant="outline" onClick={() => navigate("landing")} className="mt-6">
                Về trang chủ
              </Button>
            </>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
