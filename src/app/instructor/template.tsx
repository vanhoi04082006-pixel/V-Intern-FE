import type { ReactNode } from "react";

/** Only the page body remounts on navigation; the instructor shell stays
 * mounted (lives in `layout.tsx`).
 *
 * v6: nhịp enter của route đã chuyển lên root `src/app/template.tsx`
 * (PageTransition — View Transitions API); lớp này giữ lại khung
 * `min-width: 0` cho bố cục nhưng bỏ `.nb-swap` để không chồng fade. */
export default function InstructorTemplate({ children }: { children: ReactNode }) {
  return <div className="instructor-route-frame">{children}</div>;
}
