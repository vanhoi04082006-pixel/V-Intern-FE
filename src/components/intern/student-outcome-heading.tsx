"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/product/primitives";
import { StampMoc } from "@/components/notebook/ui";
import { StudentHeading } from "./student-ui";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

/** Trang trí đầu trang theo tab outcome — cùng loại artwork cho nhóm nội dung
 * tương tự (thành tích / kết nối / học tập / sổ sách). */
const artworkByTab: Record<
  string,
  "learn" | "teach" | "project" | "connect" | "achievement"
> = {
  certificates: "achievement",
  evaluations: "achievement",
  kpi: "achievement",
  github: "connect",
  recommendations: "learn",
  performance: "learn",
  "virtual-salary": "project",
};

export function StudentOutcomeHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const pathname = usePathname();
  const current = pathname.split("/")[2];
  const artwork = artworkByTab[current];
  /* Dấu mộc xanh "SỔ TAY" đi kèm mọi tiêu đề outcome (kpi / đánh giá / chứng
     nhận / hiệu suất / lương ảo) — tem nhỏ nghiêng đặt inline trong hàng tiêu
     đề, trang trí thuần: không tương tác, ẩn với screen reader, hiện đều ở
     mọi ngữ cảnh trang dùng heading này. */
  const stampedAction = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none inline-flex shrink-0 self-center"
      >
        <StampMoc
          tone="blue"
          rotate={-6}
          className="!px-2 !py-0.5 !text-[0.58rem]"
        >
          SỔ TAY
        </StampMoc>
      </span>
      {action}
    </>
  );
  if (pathname.startsWith("/instructor") || pathname.startsWith("/admin")) return <WorkspacePageHeader title={title} description={subtitle} action={stampedAction} artwork={artwork} />;
  if (!pathname.startsWith("/intern")) return <PageTitle title={title} subtitle={subtitle} action={stampedAction} />;
  return (
    <>
      <StudentHeading
        title={title}
        description={subtitle}
        action={stampedAction}
      />
    </>
  );
}
