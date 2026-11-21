import type { ReactNode } from "react";
import {
  IconX,
} from "@/components/v-intern/icons";
import { StampMoc } from "@/components/workspace/notebook";
export { TaskDistribution } from "./workspace-charts";

/** One heading contract for both workspaces; safe in server and client trees. */
export function WorkspacePageHeader({
  title,
  description,
  action,
  back,
  eyebrow,
  stamp,
  stampTone = "red",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
  artwork?: "learn" | "teach" | "project" | "connect" | "achievement";
  /** Journey v3 additive: dòng mono nhỏ phía trên tiêu đề (opt-in). */
  eyebrow?: string;
  /** Journey v3 additive: con dấu mực nghiêng cạnh tiêu đề (opt-in). */
  stamp?: string;
  stampTone?: "red" | "blue";
}) {
  return (
    <header className="workspace-page-header">
      {back && <div className="workspace-back">{back}</div>}
      {/* Eyebrow nằm ngoài `.workspace-page-header-row` để không ăn rule
          `p` của hàng tiêu đề (margin/màu) — giữ đúng nét mono của .eyebrow. */}
      {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
      <div className="workspace-page-header-row">
        <div>
          <h1 className="animate-marker-sweep">{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {stamp && (
          <div className="relative shrink-0 pl-2 pt-1">
            <StampMoc tone={stampTone}>{stamp}</StampMoc>
          </div>
        )}
        {action && <div className="workspace-page-actions">{action}</div>}
      </div>
    </header>
  );
}

export function WorkspaceFilterSummary({ shown, total, filtered, onClear, noun = "kết quả" }: {
  shown: number; total: number; filtered: boolean; onClear: () => void; noun?: string;
}) {
  return <div className="workspace-filter-summary" role="status" aria-live="polite">
    <p><strong>{total.toLocaleString('vi-VN')}</strong> {noun}<span> · Đang hiển thị {shown.toLocaleString('vi-VN')}</span>{filtered && <span className="workspace-filter-applied">Có bộ lọc</span>}</p>
    {filtered && <button type="button" onClick={onClear}><IconX size={13} aria-hidden="true" />Đặt lại bộ lọc</button>}
  </div>;
}
