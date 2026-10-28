"use client";

import { Github, Linkedin, Twitter } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { scrollToSection, scrollTop } from "./landing-ui";

const PRODUCT_LINKS = [
  { label: "Tính năng", action: () => scrollToSection("features") },
  { label: "Quy trình", action: () => scrollToSection("how") },
  { label: "Câu hỏi", action: () => scrollToSection("faq") },
  { label: "Bảng giá", action: () => scrollTop() },
];

const RESOURCE_LINKS = [
  { label: "Blog", action: () => scrollTop() },
  { label: "Tài liệu", action: () => scrollTop() },
  { label: "API", action: () => scrollTop() },
];

const LEGAL_LINKS = [
  { label: "Điều khoản", action: () => scrollTop() },
  { label: "Bảo mật", action: () => scrollTop() },
];

const SOCIALS = [
  { icon: Github, label: "GitHub" },
  { icon: Twitter, label: "Twitter" },
  { icon: Linkedin, label: "LinkedIn" },
];

function FooterLinks({ title, links }: { title: string; links: { label: string; action: () => void }[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <button
              type="button"
              onClick={link.action}
              className="text-sm text-dim transition-colors hover:text-ink"
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-deep">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-[13px] leading-relaxed text-dim">
              Nền tảng thực tập ảo với AI — nơi sinh viên trải nghiệm quy trình làm việc phần
              mềm thật trước ngày đi làm thật.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  aria-label={s.label}
                  onClick={scrollTop}
                  className="grid size-10 place-items-center rounded-lg border border-line text-dim transition-all hover:border-brand/40 hover:text-brand-bright"
                >
                  <s.icon className="size-4 icon" />
                </button>
              ))}
            </div>
          </div>
          <FooterLinks title="Sản phẩm" links={PRODUCT_LINKS} />
          <FooterLinks title="Tài nguyên" links={RESOURCE_LINKS} />
          <FooterLinks title="Pháp lý" links={LEGAL_LINKS} />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-faint md:flex-row md:items-center md:justify-between">
          <p>© 2025 V-Intern. Dự án giáo dục — demo cho mục đích học tập.</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Tài khoản demo:</span>
            <span className="font-mono text-dim">an.nguyen@student.edu.vn</span>
            <span>/</span>
            <span className="font-mono text-dim">demo1234</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
