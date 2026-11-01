import type { ReactNode } from "react";

/** Only the page body animates; the instructor shell stays mounted.
 * nb-swap: trang mới vào khung bằng nhịp mực 200ms (tự tắt khi
 * người dùng yêu cầu giảm chuyển động — guard toàn cục trong motion.css). */
export default function InstructorTemplate({ children }: { children: ReactNode }) {
  return <div className="instructor-route-frame nb-swap">{children}</div>;
}
