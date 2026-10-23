import type { ReactNode } from "react";
import Image from "next/image";
import { WorkspaceArtwork } from "./workspace-artwork";
import { X } from "lucide-react";
export { TaskDistribution } from "./workspace-charts";

/** One heading contract for both workspaces; safe in server and client trees. */
export function WorkspacePageHeader({
  title,
  description,
  action,
  back,
  artwork,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
  artwork?: "learn" | "teach" | "project" | "connect" | "achievement";
}) {
  return (
    <header className={`workspace-page-header${artwork ? " workspace-page-header-illustrated" : ""}`}>
      {back && <div className="workspace-back">{back}</div>}
      <div className="workspace-page-header-row">
        <div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {action && <div className="workspace-page-actions">{action}</div>}
      </div>
      {artwork && (artwork === "learn" || artwork === "teach" ? (
        <div className="workspace-header-companion" aria-hidden="true">
          <span className="workspace-companion-orbit" />
          <Image src="/images/robot-v2.png" width={116} height={128} alt="" sizes="116px" />
        </div>
      ) : <WorkspaceArtwork variant={artwork} />)}
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
