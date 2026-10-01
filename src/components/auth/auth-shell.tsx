import Image from "next/image";
import { BarChart3, Code, Users } from "lucide-react";

/**
 * AuthShell — layout dùng chung cho toàn bộ auth experience
 * (/login, /register, /forgot-password) bám ảnh thiết kế tham chiếu:
 *
 *  ┌─────────────────────────────────────────────────┐
 *  │ LEFT CONTENT          AUTH CARD                 │
 *  └─────────────────────────────────────────────────┘
 *
 * - Background full viewport: ảnh thiết kế riêng của auth, ưu tiên
 *   giữ laptop/bàn phía trái dưới trên desktop; mobile crop có chủ
 *   đích về vùng sáng để form dễ đọc.
 * - Marketing panel (trái) chỉ hiển thị từ lg trở lên; mobile ưu
 *   tiên form.
 * - KHÔNG có header/footer chrome (theo review): bỏ wordmark brand
 *   và control ngôn ngữ để trang sạch, tập trung vào form và luôn
 *   vừa viewport laptop không cần scroll.
 * - Density: spacing desktop được tính để Login/Register nằm gọn
 *   trong viewport laptop phổ biến (1366×768, 1440×900).
 */

const BENEFITS = [
  {
    icon: Code,
    title: "Dự án thực tế",
    desc: "Làm việc với các project mô phỏng doanh nghiệp.",
  },
  {
    icon: Users,
    title: "Quy trình chuyên nghiệp",
    desc: "Sprint, Task, PR, Review như một team thật.",
  },
  {
    icon: BarChart3,
    title: "Phát triển kỹ năng",
    desc: "Tích lũy kinh nghiệm và nhận đánh giá rõ ràng.",
  },
] as const;

function AuthMarketing() {
  return (
    <section aria-label="Giới thiệu V-Intern" className="max-w-[620px]">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
        Nền tảng thực tập ảo
      </p>
      <h2 className="mt-3 text-[clamp(2.125rem,2.2vw,2.375rem)] font-extrabold leading-[1.2] tracking-tight text-navy">
        Thực tập như một{" "}
        <br className="hidden sm:block" />
        lập trình viên thực thụ.
      </h2>
      <p className="mt-4 max-w-[540px] text-base leading-relaxed text-slate-600">
        Làm việc trên dự án thực tế, nhận task, sử dụng GitHub, làm việc theo
        Sprint và nhận phản hồi trong suốt quá trình.
      </p>

      <ul className="mt-8 flex divide-x divide-slate-200 gap-6">
        {BENEFITS.map((benefit) => (
          <li key={benefit.title} className="flex-1">
            <div className="grid size-10 place-items-center rounded-full bg-[#E7ECF4]">
              <benefit.icon
                className="size-5 text-brand"
                aria-hidden="true"
              />
            </div>
            <h3 className="mt-2 text-sm font-bold tracking-tight text-navy">
              {benefit.title}
            </h3>
            <p className="mt-1.5 text-[13px] leading-snug text-slate-500">
              {benefit.desc}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Ảnh nền thiết kế riêng của auth — purely decorative */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/auth/auth-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[22%_center] md:object-[35%_center] lg:object-center"
        />
      </div>

      <main className="relative z-10 flex flex-1 items-center py-4">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_540px] lg:gap-16 lg:px-10 2xl:max-w-[1360px] 2xl:grid-cols-[minmax(0,1fr)_570px]">
          <div className="hidden lg:block lg:self-start lg:pt-6">
            <AuthMarketing />
          </div>
          <div className="flex justify-center lg:justify-end">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
