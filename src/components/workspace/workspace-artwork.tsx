import { CalendarDays, CodeXml, GraduationCap, ListChecks, Newspaper, NotebookPen, ShoppingBag } from "lucide-react";
import { NotebookCompanion } from "./notebook-companion";

export type ProjectArtworkSubject = "notes" | "commerce" | "tasks" | "booking" | "publishing" | "education";
const projectIcons = { notes: NotebookPen, commerce: ShoppingBag, tasks: ListChecks, booking: CalendarDays, publishing: Newspaper, education: GraduationCap };

/** Original, code-native illustrations. Decorative only: no fabricated metrics. */
export function WorkspaceArtwork({ variant = "learn", compact = false, subject }: {
  variant?: "learn" | "teach" | "project" | "connect" | "achievement";
  compact?: boolean;
  subject?: ProjectArtworkSubject;
}) {
  if (variant === "learn" || variant === "teach") {
    return <NotebookCompanion teaching={variant === "teach"} compact={compact} />;
  }
  const isConnect = variant === "connect";
  const isAward = variant === "achievement";
  const ProjectIcon = subject ? projectIcons[subject] : CodeXml;
  return (
    <svg className={`workspace-artwork${compact ? " workspace-artwork-compact" : ""}`} viewBox="0 0 240 160" fill="none" aria-hidden="true">
      <path d="M25 132 119 78l96 54-94 25Z" fill="var(--accent)" />
      <path className="workspace-artwork-path" d="M24 113 68 88l50 29 60-35 38 22" stroke="var(--app-primary-300)" strokeWidth="1.5" strokeDasharray="4 5" />
      <circle cx="24" cy="113" r="4" fill="var(--primary)" /><circle cx="216" cy="104" r="4" fill="var(--success)" />
      {isConnect ? <>
        <path d="M64 64h30c24 0 24 36 0 36H78M176 64h-30c-24 0-24 36 0 36h16" stroke="var(--primary)" strokeWidth="13" strokeLinecap="round" />
        <path d="m100 82 40 0" stroke="var(--success)" strokeWidth="8" strokeLinecap="round" />
        <path d="m116 35 6-9 6 9M116 123l6 9 6-9" stroke="var(--app-primary-300)" strokeWidth="2" />
      </> : isAward ? <>
        <path d="m105 93-9 43 24-10 20 12-7-45" fill="var(--app-primary-200)" />
        <path d="m120 24 14 7 15 1 6 14 9 12-5 15-1 15-14 7-12 9-15-5-15-1-7-14-9-12 5-15 1-15 14-7Z" fill="var(--primary)" />
        <path d="m103 64 12 12 24-27" stroke="var(--primary-foreground)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </> : <>
        <path d="m58 49 64-20 59 29v69l-65 18-58-28Z" fill="var(--app-primary-100)" />
        <path d="m116 74 65-16v69l-65 18Z" fill="var(--app-primary-200)" />
        <path d="m58 49 58 25 65-16-59-29Z" fill="var(--accent)" />
        <rect x="71" y="34" width="98" height="85" rx="7" fill="var(--primary-foreground)" stroke="var(--input)" />
        <path d="M78 52h82" stroke="var(--border)" />
        <circle cx="81" cy="44" r="2" fill="var(--app-primary-300)" /><circle cx="88" cy="44" r="2" fill="var(--app-primary-300)" />
        {variant === "project" ? <>
          <ProjectIcon x={95} y={60} width={48} height={34} color="var(--primary)" strokeWidth={1.6} />
          <path d="M86 104h50M86 111h32" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" />
        </> : variant === "teach" ? <>
          <path d="m86 68 3 3 6-7m-9 22 3 3 6-7m-9 22 3 3 6-7" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M105 68h47M105 86h37M105 104h44" stroke="var(--input)" strokeWidth="3" strokeLinecap="round" />
        </> : <>
          <path d="m98 66-10 10 10 10m44-20 10 10-10 10m-17-23-8 28" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M86 101h50M86 108h32" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" />
        </>}
        <rect x="153" y="96" width="37" height="32" rx="6" fill="var(--success)" />
        <path d="m163 112 6 6 12-14" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </>}
      <path d="m39 50 4-7 4 7 7 4-7 4-4 7-4-7-7-4Z" fill="var(--app-primary-100)" />
      <circle cx="201" cy="42" r="6" stroke="var(--app-primary-200)" strokeWidth="2" />
    </svg>
  );
}
