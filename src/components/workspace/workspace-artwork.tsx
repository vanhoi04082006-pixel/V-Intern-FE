import { CalendarDays, CodeXml, GraduationCap, ListChecks, Newspaper, NotebookPen, ShoppingBag } from "lucide-react";

export type ProjectArtworkSubject = "notes" | "commerce" | "tasks" | "booking" | "publishing" | "education";
const projectIcons = { notes: NotebookPen, commerce: ShoppingBag, tasks: ListChecks, booking: CalendarDays, publishing: Newspaper, education: GraduationCap };

/** Original, code-native illustrations. Decorative only: no fabricated metrics. */
export function WorkspaceArtwork({ variant = "learn", compact = false, subject }: {
  variant?: "learn" | "teach" | "project" | "connect" | "achievement";
  compact?: boolean;
  subject?: ProjectArtworkSubject;
}) {
  const isConnect = variant === "connect";
  const isAward = variant === "achievement";
  const ProjectIcon = subject ? projectIcons[subject] : CodeXml;
  return (
    <svg className={`workspace-artwork${compact ? " workspace-artwork-compact" : ""}`} viewBox="0 0 240 160" fill="none" aria-hidden="true">
      <path d="M25 132 119 78l96 54-94 25Z" fill="#eaf0fa" />
      <path className="workspace-artwork-path" d="M24 113 68 88l50 29 60-35 38 22" stroke="#a5bbdf" strokeWidth="1.5" strokeDasharray="4 5" />
      <circle cx="24" cy="113" r="4" fill="#215ed6" /><circle cx="216" cy="104" r="4" fill="#087454" />
      {isConnect ? <>
        <path d="M64 64h30c24 0 24 36 0 36H78M176 64h-30c-24 0-24 36 0 36h16" stroke="#215ed6" strokeWidth="13" strokeLinecap="round" />
        <path d="m100 82 40 0" stroke="#0b806d" strokeWidth="8" strokeLinecap="round" />
        <path d="m116 35 6-9 6 9M116 123l6 9 6-9" stroke="#9db7dc" strokeWidth="2" />
      </> : isAward ? <>
        <path d="m105 93-9 43 24-10 20 12-7-45" fill="#c5d7fa" />
        <path d="m120 24 14 7 15 1 6 14 9 12-5 15-1 15-14 7-12 9-15-5-15-1-7-14-9-12 5-15 1-15 14-7Z" fill="#215ed6" />
        <path d="m103 64 12 12 24-27" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </> : <>
        <path d="m58 49 64-20 59 29v69l-65 18-58-28Z" fill="#dce7fa" />
        <path d="m116 74 65-16v69l-65 18Z" fill="#b9cef4" />
        <path d="m58 49 58 25 65-16-59-29Z" fill="#edf3ff" />
        <rect x="71" y="34" width="98" height="85" rx="7" fill="white" stroke="#b7cbee" />
        <path d="M78 52h82" stroke="#dfe7f4" />
        <circle cx="81" cy="44" r="2" fill="#a4b9d8" /><circle cx="88" cy="44" r="2" fill="#a4b9d8" />
        {variant === "project" ? <>
          <ProjectIcon x={95} y={60} width={48} height={34} color="#215ed6" strokeWidth={1.6} />
          <path d="M86 104h50M86 111h32" stroke="#c8d5e8" strokeWidth="2.5" strokeLinecap="round" />
        </> : variant === "teach" ? <>
          <path d="m86 68 3 3 6-7m-9 22 3 3 6-7m-9 22 3 3 6-7" stroke="#087454" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M105 68h47M105 86h37M105 104h44" stroke="#becce0" strokeWidth="3" strokeLinecap="round" />
        </> : <>
          <path d="m98 66-10 10 10 10m44-20 10 10-10 10m-17-23-8 28" stroke="#215ed6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M86 101h50M86 108h32" stroke="#c8d5e8" strokeWidth="2.5" strokeLinecap="round" />
        </>}
        <rect x="153" y="96" width="37" height="32" rx="6" fill="#087454" />
        <path d="m163 112 6 6 12-14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </>}
      <path d="m39 50 4-7 4 7 7 4-7 4-4 7-4-7-7-4Z" fill="#dce8ff" />
      <circle cx="201" cy="42" r="6" stroke="#b5cbed" strokeWidth="2" />
    </svg>
  );
}
