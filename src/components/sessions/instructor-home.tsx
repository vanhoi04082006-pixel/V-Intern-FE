import Link from "next/link";
import { FolderKanban, KanbanSquare, UserCheck } from "lucide-react";
import { PageTitle, Panel, buttonClass } from "@/components/product/primitives";
import { SessionList } from "./session-list";

const steps = [
  {
    n: 1,
    icon: FolderKanban,
    href: "/instructor/projects",
    title: "Chọn Project Template",
    text: "Xem yêu cầu, vai trò, deliverables và tạo phiên độc lập.",
  },
  {
    n: 2,
    icon: UserCheck,
    href: "/instructor/sessions",
    title: "Chọn đội hình và Start",
    text: "Phân công sinh viên đã đạt tuyển dụng, duyệt kế hoạch AI.",
  },
  {
    n: 3,
    icon: KanbanSquare,
    href: "/instructor/sprints",
    title: "Quản lý Sprint & Task",
    text: "Review bài nộp, theo dõi hiệu suất và tạo báo cáo phiên.",
  },
];

export function InstructorHome() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Workspace giảng viên"
        subtitle="Chọn dự án mẫu, xây dựng đội hình và quản lý phiên thực tập."
        action={
          <Link className={buttonClass} href="/instructor/projects">
            Khởi tạo phiên từ thư viện
          </Link>
        }
      />
      <Panel
        title="Quy trình thực tập"
        description="Ba bước từ thư viện dự án đến vận hành sprint — mỗi bước đều có thể quay lại chỉnh sửa trước khi Start."
      >
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map(({ n, icon: Icon, href, title, text }) => (
            <li key={n}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
              >
                <span className="flex items-center justify-between">
                  <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 transition-colors group-hover:bg-white">
                    {n}
                  </span>
                  <Icon size={18} className="text-slate-400" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-navy">{title}</span>
                <span className="text-xs leading-5 text-slate-500">{text}</span>
              </Link>
            </li>
          ))}
        </ol>
      </Panel>
      <SessionList embedded />
    </div>
  );
}
