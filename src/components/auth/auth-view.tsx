"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Moon,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore, type SessionUser } from "@/lib/store";
import { Logo } from "@/components/landing/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FadeIn } from "@/components/landing/reveal";
import { StarDoodle, SparkleDoodle, SquiggleUnderline } from "@/components/landing/doodles";

/* ------------------------------------------------------------------ */
/*  Tài khoản demo — bấm là điền sẵn                                   */
/* ------------------------------------------------------------------ */
const DEMO_ACCOUNTS = [
  {
    label: "Sinh viên",
    email: "intern@v-intern.vn",
    password: "123456",
    hint: "Minh Anh · intern",
  },
  {
    label: "Giảng viên",
    email: "instructor@v-intern.vn",
    password: "123456",
    hint: "ThS. Hùng · instructor",
  },
  {
    label: "Quản trị",
    email: "admin@v-intern.vn",
    password: "123456",
    hint: "Ban quản trị · admin",
  },
];

/* ------------------------------------------------------------------ */
/*  Ô nhập kiểu "viết lên giấy"                                        */
/* ------------------------------------------------------------------ */
function Field({
  id,
  label,
  icon: Icon,
  children,
  hint,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[13px] font-bold text-ink"
      >
        <Icon className="h-3.5 w-3.5 text-blue" aria-hidden="true" />
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="font-hand text-[15px] leading-none text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

const inputSketch =
  "h-12 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium text-ink placeholder:text-ink-faint focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25 transition-colors";

/* ------------------------------------------------------------------ */
/*  Bảng điều khiển theme nhỏ góc trang                                */
/* ------------------------------------------------------------------ */
function MiniThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Chuyển đổi giao diện sáng/tối"
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink/15 bg-raised text-ink transition-all hover:-translate-y-0.5 hover:border-blue hover:text-blue"
    >
      <Moon className="h-5 w-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden h-5 w-5 dark:block" aria-hidden="true" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Form đăng nhập                                                     */
/* ------------------------------------------------------------------ */
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { toast } = useToast();
  const signIn = useAppStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Đăng nhập chưa thành công",
          description: data.error ?? "Có gì đó không ổn.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: `Chào mừng trở lại, ${data.user.name.split(" ").slice(-1)[0]}! 👋`,
        description: "Sổ tay hành trình của bạn đã sẵn sàng.",
      });
      signIn(data.user as SessionUser);
    } catch {
      toast({
        title: "Không kết nối được máy chủ",
        description: "Kiểm tra mạng rồi thử lại giúp mình nhé.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field id="login-email" label="Email" icon={Mail}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="ban@v-intern.vn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputSketch}
          required
        />
      </Field>

      <Field id="login-password" label="Mật khẩu" icon={Lock}>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputSketch} pr-12`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-faint transition-colors hover:text-blue"
          >
            {showPassword ? (
              <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
            ) : (
              <Eye className="h-4.5 w-4.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </Field>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            toast({
              title: "Quên mật khẩu?",
              description:
                "Bản demo này dùng tài khoản demo bên dưới — mật khẩu 123456 nhé!",
            })
          }
          className="text-[13px] font-semibold text-blue underline-squiggle"
        >
          Quên mật khẩu?
        </button>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="group h-[52px] w-full rounded-xl border-2 border-ink bg-royal text-sm font-bold text-white shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-royal-deep hover:shadow-[6px_6px_0_0_var(--ink)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--ink)] disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Đang mở sổ…
          </>
        ) : (
          <>
            Mở sổ tay hành trình
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </>
        )}
      </Button>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-0.5 flex-1 rounded-full bg-ink/10" />
        <span className="font-hand text-[17px] text-ink-faint">hoặc thử nhanh với</span>
        <span className="h-0.5 flex-1 rounded-full bg-ink/10" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.email}
            type="button"
            onClick={() => {
              setEmail(acc.email);
              setPassword(acc.password);
            }}
            title={`${acc.email} · ${acc.hint}`}
            className="group flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-ink/25 bg-raised px-2 py-2 transition-all hover:-translate-y-0.5 hover:border-blue hover:bg-blue-mist"
          >
            <span className="text-xs font-bold text-ink group-hover:text-blue">
              {acc.label}
            </span>
            <span className="font-mono text-[10px] text-ink-faint">123456</span>
          </button>
        ))}
      </div>

      <p className="pt-1 text-center text-sm text-ink-soft">
        Chưa có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-blue underline-squiggle"
        >
          Đăng ký ngay
        </button>
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Form đăng ký                                                       */
/* ------------------------------------------------------------------ */
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { toast } = useToast();
  const signIn = useAppStore((s) => s.signIn);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [role, setRole] = useState("intern");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== confirm) {
      toast({
        title: "Mật khẩu chưa khớp",
        description: "Nhập lại phần xác nhận giúp mình nhé.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, university, major }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Đăng ký chưa thành công",
          description: data.error ?? "Có gì đó không ổn.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: `Chào ${data.user.name.split(" ").slice(-1)[0]}, chào mừng đến V-Intern! ✦`,
        description: "Trang đầu tiên của sổ tay đã được mở.",
      });
      signIn(data.user as SessionUser);
    } catch {
      toast({
        title: "Không kết nối được máy chủ",
        description: "Kiểm tra mạng rồi thử lại giúp mình nhé.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-name" label="Họ và tên" icon={User}>
          <Input
            id="reg-name"
            placeholder="Nguyễn Văn A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputSketch}
            required
          />
        </Field>
        <Field id="reg-email" label="Email" icon={Mail}>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="ban@student.edu.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputSketch}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-university" label="Trường (tùy chọn)" icon={GraduationCap}>
          <Input
            id="reg-university"
            placeholder="Đại học Bách Khoa"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className={inputSketch}
          />
        </Field>
        <Field id="reg-major" label="Chuyên ngành (tùy chọn)" icon={Sparkles}>
          <Input
            id="reg-major"
            placeholder="Khoa học máy tính"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className={inputSketch}
          />
        </Field>
      </div>

      <Field id="reg-role" label="Bạn đến với V-Intern với vai trò" icon={Bot}>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="reg-role" className={`${inputSketch} w-full font-medium`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="intern">Sinh viên thực tập</SelectItem>
            <SelectItem value="instructor">Giảng viên hướng dẫn</SelectItem>
            <SelectItem value="admin">Quản trị nền tảng</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-password" label="Mật khẩu" icon={Lock} hint="tối thiểu 6 ký tự">
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputSketch} pr-12`}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-faint transition-colors hover:text-blue"
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
              ) : (
                <Eye className="h-4.5 w-4.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>
        <Field id="reg-confirm" label="Xác nhận mật khẩu" icon={Lock}>
          <Input
            id="reg-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputSketch}
            required
            minLength={6}
          />
        </Field>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="group h-[52px] w-full rounded-xl border-2 border-ink bg-ink text-sm font-bold text-paper shadow-[4px_4px_0_0_var(--blue)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--blue)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--blue)] disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Đang tạo tài khoản…
          </>
        ) : (
          <>
            Viết trang đầu tiên
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </>
        )}
      </Button>

      <p className="pt-1 text-center text-sm text-ink-soft">
        Đã có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-blue underline-squiggle"
        >
          Đăng nhập ngay
        </button>
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Cột phải — trang bìa xanh royal                                    */
/* ------------------------------------------------------------------ */
function CoverPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden overflow-hidden bg-royal lg:flex lg:w-[42%] xl:w-[45%]"
    >
      <div className="absolute inset-0 bg-dots-chalk" />
      <StarDoodle className="absolute left-[12%] top-16 h-9 w-9 rotate-12 text-white/25" />
      <SparkleDoodle className="absolute bottom-24 left-[16%] h-6 w-6 text-white/20" />
      <StarDoodle className="absolute bottom-14 right-[12%] h-12 w-12 -rotate-6 text-white/20" />
      <SparkleDoodle className="absolute right-[24%] top-20 h-8 w-8 text-white/25" />

      <div className="relative m-auto flex w-full max-w-md flex-col items-center px-10 py-16 text-center">
        <div className="sketch-card-sm rotate-[2deg] overflow-hidden bg-raised p-2">
          <Image
            src="/images/landing/robot-mascot.png"
            alt=""
            width={1024}
            height={1024}
            className="h-40 w-auto xl:h-48"
            priority
          />
        </div>

        <p className="mt-9 font-hand text-[26px] leading-snug text-white">
          mỗi chuyến đi lớn đều bắt đầu
          <br />
          từ một trang sổ trắng…
        </p>

        <h2 className="mt-5 text-[28px] font-extrabold leading-tight tracking-tight text-white xl:text-[32px]">
          Hôm nay bạn sẽ
          <br />
          <span className="relative inline-block">
            viết gì vào đây?
            <SquiggleUnderline className="absolute -bottom-2 left-0 w-full text-white/80" />
          </span>
        </h2>

        <div className="mt-10 grid w-full grid-cols-3 gap-3">
          {[
            { value: "4", label: "sprint hành trình" },
            { value: "16+", label: "nhiệm vụ thật" },
            { value: "1:1", label: "AI Mentor" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border-2 border-white/30 bg-white/10 px-2 py-3 backdrop-blur-sm"
            >
              <p className="text-xl font-extrabold text-white">{stat.value}</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-tight text-white/75">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
          v-intern · nơi kỹ năng được rèn mỗi ngày
        </p>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Khung Auth hoàn chỉnh                                              */
/* ------------------------------------------------------------------ */
export function AuthView() {
  const navigate = useAppStore((s) => s.navigate);
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="flex min-h-screen bg-paper font-sans text-ink">
      {/* Cột form */}
      <div className="relative flex min-h-screen w-full flex-col lg:w-[58%] xl:w-[55%]">
        <div
          aria-hidden="true"
          className="mask-fade-edges pointer-events-none absolute inset-0 bg-grid-paper"
        />

        {/* Thanh trên */}
        <header className="relative z-10 mx-auto flex h-[72px] w-full max-w-xl items-center justify-between px-4 pt-4 md:px-0 lg:px-8 xl:px-10">
          <button
            type="button"
            onClick={() => navigate("landing")}
            className="group inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-ink/15 bg-raised px-4 text-sm font-bold text-ink transition-all hover:-translate-x-0.5 hover:border-blue hover:text-blue"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            Về trang chủ
          </button>
          <MiniThemeToggle />
        </header>

        {/* Thẻ form */}
        <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 md:px-0">
          <FadeIn className="w-full max-w-xl">
            <div className="sketch-card relative p-7 sm:p-9">
              <div className="tape -top-3 left-10 z-20" />

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Logo className="text-lg" />
                <span className="inline-flex -rotate-1 items-center gap-1.5 rounded-full border-2 border-ink bg-blue-mist px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-blue">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {mode === "login" ? "cửa vào sổ tay" : "trang đầu tiên"}
                </span>
              </div>

              <h1 className="mt-6 text-[26px] font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
                {mode === "login" ? (
                  <>
                Mở lại hành trình
                    <br />
                    <span className="marker">của bạn.</span>
                  </>
                ) : (
                  <>
                    Bắt đầu hành trình
                    <br />
                    <span className="marker">thực tập đầu tiên.</span>
                  </>
                )}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {mode === "login"
                  ? "Đăng nhập để tiếp tục nhiệm vụ, sprint và trò chuyện cùng AI Mentor."
                  : "Chỉ mất chưa đến một phút — miễn phí hoàn toàn cho sinh viên."}
              </p>

              {/* Tab chuyển đổi */}
              <div
                role="tablist"
                aria-label="Chọn đăng nhập hoặc đăng ký"
                className="mt-7 grid grid-cols-2 gap-1 rounded-xl border-2 border-ink/15 bg-blue-mist/60 p-1"
              >
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={
                      "min-h-11 rounded-lg text-sm font-bold transition-all " +
                      (mode === m
                        ? "border-2 border-ink bg-raised text-ink shadow-[2px_2px_0_0_var(--hard-shadow)]"
                        : "border-2 border-transparent text-ink-soft hover:text-blue")
                    }
                  >
                    {m === "login" ? "Đăng nhập" : "Đăng ký"}
                  </button>
                ))}
              </div>

              <div className="mt-7">
                {mode === "login" ? (
                  <LoginForm onSwitch={() => setMode("register")} />
                ) : (
                  <RegisterForm onSwitch={() => setMode("login")} />
                )}
              </div>
            </div>

            <p className="mt-6 text-center font-hand text-[17px] text-ink-faint">
              bằng việc tiếp tục, bạn đồng ý cam kết học thật — làm thật ✦
            </p>
          </FadeIn>
        </main>
      </div>

      <CoverPanel />
    </div>
  );
}
