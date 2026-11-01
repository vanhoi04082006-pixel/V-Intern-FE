import type { ReactNode } from "react";

/**
 * Re-mounts only the page content on navigation. The shell lives in
 * `layout.tsx`, so the sidebar or topbar never fade.
 *
 * v6: nhịp enter của route đã chuyển lên root `src/app/template.tsx`
 * (PageTransition — View Transitions API); lớp này chỉ giữ khung
 * `min-width: 0` cho bố cục, bỏ `.nb-swap` để không chồng fade.
 */
export default function StudentTemplate({ children }: { children: ReactNode }) {
  return <div className="student-route-frame">{children}</div>;
}
