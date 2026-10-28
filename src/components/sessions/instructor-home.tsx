import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";
import { SessionList } from "./session-list";

const steps = [
  {
    href: "/instructor/projects",
    title: "Chọn mẫu dự án",
    text: "Đối chiếu yêu cầu, vai trò và sản phẩm bàn giao trước khi tạo phiên.",
  },
  {
    href: "/instructor/sessions",
    title: "Chuẩn bị đội hình",
    text: "Phân công sinh viên, duyệt kế hoạch AI và kích hoạt Sprint.",
  },
  {
    href: "/instructor/sprints",
    title: "Theo dõi và phản hồi",
    text: "Kiểm tra bài nộp, phản hồi theo tiêu chí và ghi nhận kết quả.",
  },
];

export function InstructorHome() {
  return (
    <div className="instructor-home space-y-10">
      <WorkspacePageHeader
        title="Tổng quan giảng dạy"
        description="Theo dõi phiên, phản hồi bài nộp và đồng hành cùng sinh viên."
        action={
          <Link href="/instructor/projects" className="instructor-hero-cta">
            Khởi tạo phiên từ thư viện
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        }
      />
      <SessionList embedded />
      <details className="ins-workflow">
        <summary id="teaching-workflow">
          Bắt đầu một phiên thực tập
        </summary>
        <ol className="instructor-steps">
          {steps.map((step) => (
            <li key={step.href}>
              <Link href={step.href} className="instructor-step">
                <strong className="instructor-step-title">{step.title}</strong>
                <span className="instructor-step-text">{step.text}</span>
                <span className="instructor-step-link">
                  Mở hướng dẫn
                  <ArrowUpRight size={14} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
