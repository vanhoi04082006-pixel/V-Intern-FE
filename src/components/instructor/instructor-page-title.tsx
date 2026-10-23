"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/product/primitives";
import { InstructorHeading } from "./instructor-ui";

export function InstructorPageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const pathname = usePathname();
  return pathname?.startsWith("/instructor") ? (
    <InstructorHeading title={title} description={subtitle} action={action} />
  ) : (
    <PageTitle title={title} subtitle={subtitle} action={action} />
  );
}
