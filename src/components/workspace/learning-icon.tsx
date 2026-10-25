import type { SVGProps } from "react";

/** Original V-Intern notebook symbols. Decorative; the adjacent label names the action. */
export function LearningIcon({ kind, ...props }: SVGProps<SVGSVGElement> & {
  kind: "workflow" | "analytics" | "account";
}) {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      {kind === "workflow" ? <>
        <path d="M6 7.5h20v19H6z" fill="#EAF1FF" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M6 13h20M11 5v5M21 5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m11 20 3 3 7-7" stroke="#426CC7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </> : kind === "analytics" ? <>
        <path d="M6 26h21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8 18h4v8H8z" fill="#A9C5F5" /><path d="M15 13h4v13h-4z" fill="#8A70C9" /><path d="M22 7h4v19h-4z" fill="#426CC7" />
        <path d="m6 12 7-5 5 2 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </> : <>
        <circle cx="16" cy="11" r="5" fill="#EAF1FF" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 27v-3a10 10 0 0 1 20 0v3" fill="#EAF1FF" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m22 20 2 2 4-4" stroke="#426CC7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>}
    </svg>
  );
}
