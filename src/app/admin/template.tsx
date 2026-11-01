import type { ReactNode } from "react";

/**
 * Re-mounts only the page content on navigation. The shell lives in
 * `layout.tsx`, so this subtle enter transition never fades the sidebar or
 * topbar; it also respects the user's reduced-motion preference in CSS.
 */
export default function AdminTemplate({ children }: { children: ReactNode }) {
  return <div className="nb-swap">{children}</div>;
}
