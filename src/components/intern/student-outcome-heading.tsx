"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/product/primitives";
import { StudentHeading } from "./student-ui";
import { WorkspacePageHeader } from "@/components/workspace/workspace-ui";

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
  const artwork = current === "certificates" || (pathname.startsWith("/intern") && current === "evaluations") ? "achievement" : current === "github" ? "connect" : pathname.startsWith("/intern") && current === "recommendations" ? "learn" : undefined;
  if (pathname.startsWith("/instructor")) return <WorkspacePageHeader title={title} description={subtitle} action={action} artwork={artwork} />;
  if (!pathname.startsWith("/intern")) return <PageTitle title={title} subtitle={subtitle} action={action} />;
  return (
    <>
      <StudentHeading
        title={title}
        description={subtitle}
        artwork={artwork}
        action={action}
      />
    </>
  );
}
