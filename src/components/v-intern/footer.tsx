"use client";

import {
  IconFacebook,
  IconGithub,
  IconLinkedin,
  IconYoutube,
  type IconComponent,
} from "@/components/v-intern/icons";
import { Logo } from "@/components/v-intern/logo";
import { FadeIn } from "@/components/v-intern/reveal";
import { NewsletterForm } from "@/components/v-intern/newsletter-form";
import { SparkleDoodle } from "@/components/v-intern/doodles";

const SOCIAL_LINKS: { label: string; href: string; icon: IconComponent }[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com", icon: IconLinkedin },
  { label: "GitHub", href: "https://github.com", icon: IconGithub },
  { label: "YouTube", href: "https://www.youtube.com", icon: IconYoutube },
  { label: "Facebook", href: "https://www.facebook.com", icon: IconFacebook },
];

type FooterLink = { label: string; href: string | null };
type FooterColumn = { heading: string; links: FooterLink[] };

/**
 * `href: null` = trang đích chưa tồn tại (backend/trang con chưa có).
 * Render dạng text tĩnh kèm ghi chú "sắp ra mắt", không tạo anchor giả.
 */
const LINK_COLUMNS: FooterColumn[] = [
  {
    heading: "Sản phẩm",
    links: [
      { label: "Nền tảng V-Intern", href: "#platform" },
      { label: "Phỏng vấn AI", href: "#how-it-works" },
      { label: "Dự án thực tế", href: "#workflow" },
      { label: "AI Mentor & Đánh giá", href: "#how-it-works" },
      { label: "Chứng nhận", href: "#workflow" },
      { label: "Bảng giá", href: null },
    ],
  },
  {
    heading: "Đối tượng",
    links: [
      { label: "Dành cho sinh viên", href: "#for-students" },
      { label: "Dành cho giảng viên", href: "#for-instructors" },
      { label: "Dành cho doanh nghiệp", href: null },
      { label: "Trường đào tạo", href: null },
      { label: "Trung tâm đào tạo", href: null },
      { label: "Tìm việc làm", href: null },
    ],
  },
  {
    heading: "Tài nguyên",
    links: [
      { label: "Blog", href: null },
      { label: "Tài liệu hướng dẫn", href: "#how-it-works" },
      { label: "Cộng đồng", href: null },
      { label: "Hỏi đáp thường gặp", href: null },
      { label: "Bài tập thực hành", href: "#workflow" },
      { label: "Mẫu hồ sơ", href: null },
    ],
  },
  {
    heading: "Công ty",
    links: [
      { label: "Về chúng tôi", href: null },
      { label: "Tuyển dụng", href: null },
      { label: "Liên hệ", href: null },
      { label: "Trung tâm trợ giúp", href: null },
    ],
  },
];

function FooterColumnNav({ column }: { column: FooterColumn }) {
  return (
    <nav aria-label={column.heading}>
      <h2 className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-chalk">
        {column.heading}
        <SparkleDoodle className="h-3 w-3 text-[#7d97ff]/80" />
      </h2>
      <ul className="mt-4 space-y-2.5">
        {column.links.map((link) =>
          link.href ? (
            <li key={link.label}>
              <a
                href={link.href}
                className="rounded text-sm text-chalk-soft transition-colors hover:text-[#7d97ff]"
              >
                {link.label}
              </a>
            </li>
          ) : (
            <li key={link.label}>
              <span
                className="cursor-default text-sm text-chalk-soft"
                title="Sắp ra mắt"
              >
                {link.label}
              </span>
              <span className="ml-1.5 font-hand text-[13px] text-[#7d97ff]/80">
                (sắp ra mắt)
              </span>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="paper-deckle-top mt-auto w-full bg-coal text-chalk">
      <FadeIn y={16} className="mx-auto max-w-7xl px-4 pb-12 pt-14 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.45fr_1fr_1fr_1fr_0.95fr] lg:gap-x-8">
          <div className="col-span-2 lg:col-span-1 lg:pr-4">
            <Logo inverse />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-chalk-soft">
              Nền tảng thực tập ảo mô phỏng quy trình làm việc thật, giúp sinh
              viên và giảng viên kết nối với cơ hội nghề nghiệp thực tế.
            </p>

            <div className="mt-8">
              <h2 className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-chalk">
                Nhận bản tin
                <SparkleDoodle className="h-3 w-3 text-[#7d97ff]/80" />
              </h2>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-chalk-soft">
                Nhập email nghề nghiệp và nhận bản tin ngành mới mỗi tuần.
              </p>
              <NewsletterForm />
            </div>

            <ul className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-chalk/20 bg-chalk/5 text-chalk-soft transition-all hover:-translate-y-0.5 hover:border-royal hover:bg-royal hover:text-white"
                  >
                    <span className="sr-only">{social.label}</span>
                    <social.icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {LINK_COLUMNS.map((column) => (
            <FooterColumnNav key={column.heading} column={column} />
          ))}
        </div>
      </FadeIn>

      <div className="border-t-2 border-chalk/12">
        <div
          className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 sm:flex-row sm:items-center md:px-6 lg:px-8"
          style={{
            paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
          }}
        >
          <p className="text-sm text-chalk-soft">
            © {year} V-Intern. Bảo lưu mọi quyền.
          </p>
          <p className="font-hand text-[15px] text-[#7d97ff]">
            làm bằng cả trái tim ở Việt Nam ✎
          </p>
        </div>
      </div>
    </footer>
  );
}
