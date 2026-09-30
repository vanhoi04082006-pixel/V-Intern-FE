import { Facebook, Github, Linkedin, Youtube } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/v-intern/logo";
import { FadeIn } from "@/components/v-intern/reveal";
import { NewsletterForm } from "@/components/v-intern/newsletter-form";

const SOCIAL_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com", icon: Linkedin },
  { label: "GitHub", href: "https://github.com", icon: Github },
  { label: "YouTube", href: "https://www.youtube.com", icon: Youtube },
  { label: "Facebook", href: "https://www.facebook.com", icon: Facebook },
];

type FooterLink = { label: string; href: string | null };
type FooterColumn = { heading: string; links: FooterLink[] };

/**
 * `href: null` = trang đích chưa tồn tại (backend/trang con chưa có).
 * Chúng được render dạng text tĩnh, không tạo anchor giả `href="#"`.
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
      <h2 className="text-xs font-bold uppercase tracking-widest text-white">
        {column.heading}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {column.links.map((link) =>
          link.href ? (
            <li key={link.label}>
              <a
                href={link.href}
                className="rounded text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {link.label}
              </a>
            </li>
          ) : (
            <li key={link.label}>
              <span
                className="cursor-default text-sm text-slate-500"
                title="Sắp ra mắt"
              >
                {link.label}
              </span>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full bg-navy text-white">
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-[#2060F0] via-[#4D8DFF] to-[#2060F0]"
      />

      <FadeIn y={16} className="mx-auto max-w-7xl px-4 pb-12 pt-14 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.45fr_1fr_1fr_1fr_0.95fr] lg:gap-x-8">
          <div className="col-span-2 lg:col-span-1 lg:pr-4">
            <Logo inverse />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Nền tảng thực tập ảo mô phỏng quy trình làm việc thật, giúp sinh
              viên và giảng viên kết nối với cơ hội nghề nghiệp thực tế.
            </p>

            <div className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white">
                Nhận bản tin
              </h2>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">
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
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 transition-colors hover:border-blue-500 hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
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

      <div className="border-t border-white/10">
        <div
          className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8"
          style={{
            paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
          }}
        >
          <p className="text-sm text-slate-500">
            © {year} V-Intern. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </footer>
  );
}
