import type { ReactNode, SVGProps } from "react";

export type LearningIconKind = "workflow" | "analytics" | "account" | "project" | "mentor" | "certificate" | "recruitment" | "notifications" | "review" | "system" | "library" | "team";

const drawings: Record<LearningIconKind, ReactNode> = {
  workflow: <><path d="M6 8h20v19H6z" fill="#EAF1FF" /><path d="M6 14h20M11 5v6M21 5v6" /><path d="m11 20 3 3 7-7" stroke="#426CC7" /></>,
  analytics: <><path d="M5 27h23" /><path d="M8 19h4v8H8z" fill="#A9C5F5" /><path d="M15 13h4v14h-4z" fill="#B5A4D7" /><path d="M22 7h4v20h-4z" fill="#7E9FD8" /><path d="m6 12 7-5 5 2 8-6" /></>,
  account: <><circle cx="16" cy="10" r="5" fill="#EAF1FF" /><path d="M6 27v-3a10 10 0 0 1 20 0v3" fill="#EAF1FF" /><path d="m22 20 2 2 4-4" stroke="#426CC7" /></>,
  project: <><path d="M4 11h10l3 4h11v13H4z" fill="#C7D8F5" /><path d="M8 15V5h15v10" fill="#FAFBFE" /><path d="M12 9h7M12 12h5M4 18h24" /></>,
  mentor: <><path d="M4 9q6-3 12 1 6-4 12-1v17q-6-3-12 1-6-4-12-1z" fill="#EAF1FF" /><path d="M16 10v17M8 15h4M8 19h4M21 3v5M18.5 5.5h5" /><path d="m20 17 2 2 3-4" stroke="#54866B" /></>,
  certificate: <><path d="m11 20-2 9 7-3 7 3-2-9" fill="#C7D8F5" /><path d="m16 3 5 3 5 1v6l-2 5-8 5-8-5-2-5V7l5-1z" fill="#EAF1FF" /><path d="m11 13 3 3 7-7" stroke="#426CC7" /></>,
  recruitment: <><path d="M5 7h22v21H5z" fill="#EAF1FF" /><path d="M5 13h22M11 4v6M21 4v6" /><circle cx="17" cy="21" r="5" fill="#FFF5D9" /><path d="M17 18v3l2 1" /></>,
  notifications: <><path d="M7 14a9 9 0 0 1 18 0v6l3 4H4l3-4z" fill="#EAF1FF" /><path d="M12 27q4 5 8 0M16 3v2" /><path d="M21 8q3 2 3 6" stroke="#7E9FD8" /></>,
  review: <><path d="M7 6h18v23H7z" fill="#EAF1FF" /><path d="M12 4h8v5h-8z" fill="#C7D8F5" /><path d="m11 17 3 3 7-7M12 24h8" stroke="#54866B" /></>,
  system: <><path d="M7 5v23M16 5v23M25 5v23" /><path d="M3 10h8v5H3zM12 20h8v5h-8zM21 8h8v5h-8z" fill="#C7D8F5" /></>,
  library: <><path d="M4 5h7v23H4z" fill="#C7D8F5" /><path d="M12 8h7v20h-7z" fill="#EAF1FF" /><path d="m21 7 6-1 4 21-6 1z" fill="#FFF5D9" /><path d="M6 10h3M6 23h3M14 13h3M14 23h3" /></>,
  team: <><circle cx="12" cy="10" r="5" fill="#C7D8F5" /><path d="M3 28v-5a9 9 0 0 1 18 0v5" fill="#EAF1FF" /><path d="M22 6a5 5 0 0 1 0 10M24 19a7 7 0 0 1 5 7v2" /><path d="M8 23h8" stroke="#426CC7" /></>,
};

/** Original V-Intern notebook symbols. Decorative; the adjacent label names the action. */
export function LearningIcon({ kind, ...props }: SVGProps<SVGSVGElement> & {
  kind: LearningIconKind;
}) {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props} aria-hidden="true" focusable="false">
      {drawings[kind]}
    </svg>
  );
}
