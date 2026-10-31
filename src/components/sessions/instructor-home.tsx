import Link from "next/link";
import Image from "next/image";
import {
  IconArrowUpRight,
} from "@/components/v-intern/icons";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";
import { Tape } from "@/components/v-intern/doodles";
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

/** Tấm polaroid giảng viên đứng trước bảng — dán góc phải dải hero (chỉ ≥xl). */
function InstructorPolaroid() {
  return (
    <figure className="ins-hero-polaroid" aria-hidden="true">
      <Tape className="-top-2.5 left-7" rotate={-5} variant="warm" />
      <div className="sketch-card-sm bg-raised p-1.5 dog-ear">
        <Image
          src="/images/characters/instructor-figure.png"
          alt=""
          width={132}
          height={132}
          sizes="132px"
          className="w-full rounded-lg border-2 border-ink/10"
        />
        <figcaption className="px-0.5 pb-0.5 pt-1 font-hand text-[13px] leading-tight text-ink-soft">
          bảng của thầy, sổ của trò ✎
        </figcaption>
      </div>
    </figure>
  );
}

export function InstructorHome() {
  return (
    <div className="instructor-home space-y-10">
      <div className="ins-home-hero">
        <WorkspacePageHeader
          title="Tổng quan giảng dạy"
          description="Theo dõi phiên, phản hồi bài nộp và đồng hành cùng sinh viên."
          action={
            <Link href="/instructor/projects" className="instructor-hero-cta">
              Khởi tạo phiên từ thư viện
              <IconArrowUpRight size={16} aria-hidden="true" />
            </Link>
          }
        />
        <InstructorPolaroid />
      </div>
      <SessionList embedded />
      <details className="ins-workflow">
        <summary id="teaching-workflow">
          Bắt đầu một phiên thực tập
        </summary>
        <ol className="instructor-steps">
          {steps.map((step, index) => (
            <li key={step.href}>
              <Link href={step.href} className="instructor-step">
                {index === 1 && (
                  <Tape className="-top-2.5 left-9" rotate={-6} variant="mint" />
                )}
                <span className="instructor-step-no font-hand" aria-hidden="true">
                  {index + 1}
                </span>
                <strong className="instructor-step-title">{step.title}</strong>
                <span className="instructor-step-text">{step.text}</span>
                <span className="instructor-step-link">
                  Mở hướng dẫn
                  <IconArrowUpRight size={14} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
