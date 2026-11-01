import type { ReactNode } from "react";

/**
 * Re-mounts only the page content on navigation. The shell lives in
 * `layout.tsx` so the sidebar/topbar never fade.
 *
 * v6: enter transition của route đã chuyển lên root `src/app/template.tsx`
 * (PageTransition — View Transitions API); template này về pass-through
 * để không chồng 2 lớp fade trên cùng một lần điều hướng.
 */
export default function AdminTemplate({ children }: { children: ReactNode }) {
  return <div className="admin-route-frame">{children}</div>;
}
