"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesCombined, FolderKanban, GraduationCap, UserRound, Workflow, type LucideIcon } from "lucide-react";

type ViewGroup = { label: string; icon: LucideIcon; kind: string; items: [string, string][] };
const student: ViewGroup[] = [
  { label: "Không gian dự án", icon: FolderKanban, kind: "workflow", items: [["work", "Công việc"], ["sprint", "Sprint Board"], ["project", "Dự án"], ["mentor", "AI Mentor"]] },
  { label: "Năng lực & kết quả", icon: ChartNoAxesCombined, kind: "analytics", items: [["evaluations", "Đánh giá"], ["performance", "Hiệu suất"], ["kpi", "KPI"], ["virtual-salary", "Lương ảo"], ["certificates", "Chứng nhận"], ["recommendations", "Phát triển"]] },
  { label: "Tài khoản & kết nối", icon: UserRound, kind: "account", items: [["profile", "Hồ sơ"], ["github", "GitHub"], ["notifications", "Thông báo"]] },
];
const teacher: ViewGroup[] = [
  { label: "Tổ chức thực tập", icon: GraduationCap, kind: "workflow", items: [["sessions", "Phiên thực tập"], ["sprints", "Sprint & Task"], ["projects", "Thư viện dự án"]] },
  { label: "Theo dõi & đánh giá", icon: ChartNoAxesCombined, kind: "analytics", items: [["evaluations", "Đánh giá"], ["performance", "Hiệu suất"], ["reports", "Báo cáo"]] },
  { label: "Cộng tác", icon: Workflow, kind: "account", items: [["sharing", "Chia sẻ dữ liệu"], ["github", "GitHub"]] },
  { label: "Cá nhân", icon: UserRound, kind: "account", items: [["profile", "Hồ sơ"], ["notifications", "Thông báo"]] },
];

export function WorkspaceStage({ role, children, workAvailable = true, resultsAvailable = true }: {
  role: "intern" | "instructor";
  children: ReactNode;
  workAvailable?: boolean;
  resultsAvailable?: boolean;
}) {
  const path = usePathname();
  const parts = path.split("/").filter(Boolean);
  const section = parts[1] ?? "overview";
  const viewSection = role === "instructor" && section === "tasks" ? "sprints" : section;
  const group = (role === "intern" ? student : teacher).find((g) => g.items.some(([key]) => key === viewSection));
  const showViews = group && !(role === "intern" && ((group.kind === "workflow" && !workAvailable) || (group.kind === "analytics" && !resultsAvailable)));
  const Icon = group?.icon ?? BookOpen;
  return (
    <div className="workspace-stage" data-area={section} data-kind={group?.kind ?? "overview"} data-detail={parts.length > 2 ? "true" : undefined}>
      {group && showViews && <div className="workspace-viewbar">
        <span className="workspace-viewbar-context"><Icon size={16} aria-hidden="true" />{group.label}</span>
        <nav aria-label="Các trang trong khu vực" className="workspace-view-links">
          {group.items.filter(([key]) => role !== "intern" || workAvailable || key !== "recommendations").map(([key, label]) => <Link key={key} href={`/${role}/${key}`} aria-current={key === viewSection ? "page" : undefined}>{label}</Link>)}
        </nav>
      </div>}
      <div className="workspace-page-body">{children}</div>
    </div>
  );
}
