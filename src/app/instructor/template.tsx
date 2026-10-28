import type { ReactNode } from "react";

/** Only the page body animates; the instructor shell stays mounted. */
export default function InstructorTemplate({ children }: { children: ReactNode }) {
  return <div className="instructor-route-frame">{children}</div>;
}
