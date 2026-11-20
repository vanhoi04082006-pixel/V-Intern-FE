"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/product/primitives";
import { InstructorHeading } from "./instructor-ui";

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
  /** v3 additive (chỉ nhánh product PageTitle): dòng mono nhỏ trên tiêu đề. */
  eyebrow?: string;
  /** v3 additive (chỉ nhánh product PageTitle): mộc cạnh tiêu đề. */
  stamp?: string;
  stampTone?: "red" | "blue";
}) {
  const pathname = usePathname();
  return pathname?.startsWith("/instructor") ? (
    <InstructorHeading title={title} description={subtitle} action={action} />
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
