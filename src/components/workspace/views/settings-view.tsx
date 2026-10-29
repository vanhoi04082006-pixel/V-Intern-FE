"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AtSign, BookOpen, Loader2, LogOut, Palette, Save, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { useAppStore, type SessionUser } from "@/lib/store";

const inputSketch =
  "h-12 rounded-xl border-2 border-ink/20 bg-paper px-4 text-sm font-medium text-ink placeholder:text-ink-faint focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25 transition-colors";

function Field({
  id,
  label,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} icon={Icon} label={label} />
      {children}
    </div>
  );
}

function Label({
  htmlFor,
  icon: Icon,
  label,
}: {
  htmlFor: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 text-[13px] font-bold text-ink"
    >
      <Icon className="h-3.5 w-3.5 text-blue" aria-hidden="true" />
      {label}
    </label>
  );
}

export function SettingsView() {
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name ?? "");
  const [university, setUniversity] = useState(user?.university ?? "");
  const [major, setMajor] = useState(user?.major ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const currentUserId = user.id;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      toast({
        title: "Thiếu tên hiển thị",
        description: "Tên không được để trống nhé.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, name, university, major, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Chưa lưu được",
          description: data.error ?? "Có gì đó không ổn.",
          variant: "destructive",
        });
        return;
      }
      // cập nhật session local + refetch workspace
      const updated = data.user as SessionUser;
      window.localStorage.setItem("vintern-session", JSON.stringify(updated));
      useAppStore.setState({ user: updated });
      queryClient.invalidateQueries({ queryKey: ["workspace", currentUserId] });
      toast({
        title: "Đã lưu lại trong sổ tay! ✦",
        description: "Thông tin hồ sơ của bạn vừa được cập nhật.",
      });
    } catch {
      toast({
        title: "Không kết nối được máy chủ",
        description: "Thử lại giúp mình nhé.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)]">
      {/* Hồ sơ */}
      <form onSubmit={handleSave} className="sketch-card space-y-5 p-6 sm:p-7">
        <div className="tape -top-2.5 right-10 z-20" />
        <div>
          <h2 className="text-xl font-extrabold text-ink">Trang cá nhân</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Những thông tin này hiển thị với mentor và đồng đội của bạn.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="set-name" label="Họ và tên" icon={User}>
            <input
              id="set-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputSketch} w-full`}
              required
            />
          </Field>
          <Field id="set-email" label="Email (không đổi được)" icon={AtSign}>
            <input
              id="set-email"
              value={user.email}
              disabled
              className={`${inputSketch} w-full cursor-not-allowed opacity-60`}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="set-university" label="Trường" icon={BookOpen}>
            <input
              id="set-university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="Đại học Bách Khoa"
              className={`${inputSketch} w-full`}
            />
          </Field>
          <Field id="set-major" label="Chuyên ngành" icon={BookOpen}>
            <input
              id="set-major"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="Khoa học máy tính"
              className={`${inputSketch} w-full`}
            />
          </Field>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="set-bio"
            className="flex items-center gap-1.5 text-[13px] font-bold text-ink"
          >
            <User className="h-3.5 w-3.5 text-blue" aria-hidden="true" />
            Vài dòng về bạn
          </label>
          <textarea
            id="set-bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="ví dụ: sinh viên năm 3, mê frontend và trà đào…"
            className="w-full resize-none rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 text-sm font-medium text-ink placeholder:text-ink-faint focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
          />
          <p className="font-hand text-[15px] text-ink-faint">
            viết tự nhiên như đang giới thiệu bản thân với mentor nhé
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="group inline-flex h-12 items-center gap-2 rounded-xl border-2 border-ink bg-royal px-6 text-sm font-bold text-white shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-royal-deep hover:shadow-[6px_6px_0_0_var(--ink)] active:translate-x-0 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Đang lưu…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              Lưu thay đổi
            </>
          )}
        </button>
      </form>

      {/* Giao diện & phiên */}
      <div className="space-y-6">
        <section className="rounded-2xl border-2 border-ink/10 bg-raised p-6">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-ink">
            <Palette className="h-4.5 w-4.5 text-blue" aria-hidden="true" />
            Giao diện
          </h3>
          <p className="mt-1.5 text-sm text-ink-soft">
            Sổ tay của bạn có hai "mặt giấy": giấy vở sáng và bảng đen phấn tối.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {(
              [
                { value: "light", label: "Giấy vở", dot: "bg-paper border-ink" },
                { value: "dark", label: "Bảng đen", dot: "bg-coal border-chalk" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                aria-pressed={resolvedTheme === opt.value}
                className={
                  "flex min-h-11 items-center justify-center gap-2.5 rounded-xl border-2 text-[13px] font-bold transition-all " +
                  (resolvedTheme === opt.value
                    ? "border-ink bg-blue-mist text-blue"
                    : "border-ink/15 bg-paper text-ink-soft hover:border-blue hover:text-blue")
                }
              >
                <span
                  className={`h-4 w-4 rounded-full border-2 ${opt.dot}`}
                  aria-hidden="true"
                />
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border-2 border-ink bg-coal p-6 text-chalk">
          <div className="absolute inset-0 bg-dots-chalk" aria-hidden="true" />
          <div className="relative">
            <p className="font-hand text-xl text-blue">phiên làm việc</p>
            <p className="mt-3 text-sm leading-relaxed text-chalk-soft">
              Bạn đang đăng nhập với vai trò{" "}
              <strong className="text-chalk">
                {user.role === "intern"
                  ? "Sinh viên thực tập"
                  : user.role === "instructor"
                    ? "Giảng viên hướng dẫn"
                    : "Quản trị nền tảng"}
              </strong>
              . Dữ liệu của bạn được lưu an toàn và chỉ hiển thị với người liên quan.
            </p>
            <button
              type="button"
              onClick={() => {
                toast({
                  title: "Hẹn gặp lại nhé! 👋",
                  description: "Bạn đã đăng xuất khỏi V-Intern.",
                });
                signOut();
              }}
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl border-2 border-chalk/30 bg-white/5 px-5 text-sm font-bold text-chalk transition-all hover:-translate-y-0.5 hover:border-white/60"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
