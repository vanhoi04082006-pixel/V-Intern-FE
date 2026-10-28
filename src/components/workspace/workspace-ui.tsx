import type { ReactNode } from "react";
import { X } from "lucide-react";
export { TaskDistribution } from "./workspace-charts";

/** One heading contract for both workspaces; safe in server and client trees. */
export function WorkspacePageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
  artwork?: "learn" | "teach" | "project" | "connect" | "achievement";
}) {
  return (
    <header className="workspace-page-header">
      {back && <div className="workspace-back">{back}</div>}
      <div className="workspace-page-header-row">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
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
    {filtered && <button type="button" onClick={onClear}><X size={13} aria-hidden="true" />Đặt lại bộ lọc</button>}
  </div>;
}
