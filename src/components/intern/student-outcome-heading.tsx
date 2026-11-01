"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/product/primitives";
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
  if (pathname.startsWith("/instructor") || pathname.startsWith("/admin")) return <WorkspacePageHeader title={title} description={subtitle} action={action} artwork={artwork} />;
  if (!pathname.startsWith("/intern")) return <PageTitle title={title} subtitle={subtitle} action={action} />;
  return (
    <>
      <StudentHeading
        title={title}
        description={subtitle}
        action={action}
      />
    </>
  );
}
