import Link from "next/link";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconChartColumn,
  IconCodeXml,
  IconUsers,
} from "@/components/v-intern/icons";
import { MarginNote } from "@/components/workspace/notebook";
import { Logo } from "@/components/v-intern/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const BENEFITS = [
  { icon: IconCodeXml, title: "Dự án thực tế", desc: "Làm việc với các project mô phỏng doanh nghiệp." },
  { icon: IconUsers, title: "Quy trình chuyên nghiệp", desc: "Sprint, Task, PR, Review như một team thật." },
  { icon: IconChartColumn, title: "Phát triển kỹ năng", desc: "Tích lũy kinh nghiệm và nhận đánh giá rõ ràng." },
] as const;

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <div className="app-surface auth-surface">
    <header className="support-header"><Logo /><div className="flex items-center gap-3"><ThemeToggle /><Link href="/" aria-label="Quay lại trang chủ" className="support-back"><IconArrowLeft size={16} aria-hidden />Quay lại</Link></div></header>
    <main className="auth-layout">
      <section className="auth-context" aria-label="Giới thiệu V-Intern">
        <h2>Thực tập như một <span className="marker">lập trình viên thực thụ</span>.</h2>
        <p>Làm việc trên dự án thực tế, nhận task, sử dụng GitHub, làm việc theo Sprint và nhận phản hồi trong suốt quá trình.</p>
        <ul className="auth-benefits">{BENEFITS.map(({ icon: Icon, title, desc }) => <li key={title}><Icon size={20} aria-hidden /><div><h3>{title}</h3><p>{desc}</p></div></li>)}</ul>
        <MarginNote className="mt-4">sổ tay này ghi lại từng bước của bạn ✎</MarginNote>
        <Link href="/apply" className="support-context-link">Ứng tuyển chương trình thực tập<IconArrowUpRight size={16} aria-hidden /></Link>
      </section>
      <div className="auth-form-region">{children}</div>
    </main>
  </div>;
}
