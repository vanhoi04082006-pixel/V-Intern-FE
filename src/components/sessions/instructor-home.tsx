import Link from "next/link";
import { PageTitle, Panel, buttonClass } from "@/components/product/primitives";
import { SessionList } from "./session-list";

export function InstructorHome() {
  return <div className="space-y-6">
    <PageTitle title="Workspace giảng viên" subtitle="Chọn dự án mẫu, xây dựng đội hình và quản lý phiên thực tập." action={<Link className={buttonClass} href="/instructor/projects">Khởi tạo phiên từ thư viện</Link>} />
    <Panel title="Quy trình thực tập">
      <ol className="grid gap-3 text-sm sm:grid-cols-3">
        <li><Link className="font-semibold text-blue-700" href="/instructor/projects">1. Chọn Project Template</Link><p className="mt-1 text-slate-500">Xem yêu cầu, vai trò, deliverables và tạo phiên độc lập.</p></li>
        <li><Link className="font-semibold text-blue-700" href="/instructor/sessions">2. Chọn đội hình và Start</Link><p className="mt-1 text-slate-500">Phân công sinh viên đã đạt tuyển dụng, duyệt kế hoạch AI.</p></li>
        <li><Link className="font-semibold text-blue-700" href="/instructor/sprints">3. Quản lý Sprint & Task</Link><p className="mt-1 text-slate-500">Review bài nộp, theo dõi hiệu suất và tạo báo cáo phiên.</p></li>
      </ol>
    </Panel>
    <SessionList embedded />
  </div>;
}
