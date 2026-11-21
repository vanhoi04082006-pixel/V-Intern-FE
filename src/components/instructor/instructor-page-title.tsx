"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/product/primitives";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

export function InstructorPageTitle({
  title,
  subtitle,
  action,
  eyebrow,
  stamp,
  stampTone = "blue",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** v3 additive: dòng mono nhỏ trên tiêu đề — dùng trên cả hai nhánh. */
  eyebrow?: string;
  /** v3 additive: mộc cạnh tiêu đề — dùng trên cả hai nhánh. */
  stamp?: string;
  stampTone?: "red" | "blue";
}) {
  const pathname = usePathname();
  return pathname?.startsWith("/instructor") ? (
    /* Journey v3: nhánh giảng viên giờ trả lại eyebrow + mộc nghiêng như
     * sandbox StaffPageHeader (marker sweep trên H1 vẫn giữ nguyên).
     * Call sites đã truyền eyebrow/stamp; thiếu thì dùng nhãn mặc định
     * "Sổ tay hành trình · Giảng viên" đúng like sandbox. */
    <WorkspacePageHeader
      title={title}
      description={subtitle}
      action={action}
      eyebrow={eyebrow ?? "Sổ tay hành trình · Giảng viên"}
      stamp={stamp}
      stampTone={stampTone}
    />
  ) : (
    <PageTitle
      title={title}
      subtitle={subtitle}
      action={action}
      eyebrow={eyebrow}
      stamp={stamp}
      stampTone={stampTone}
    />
  );
}
