"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { Badge, Empty, PageTitle, Pager, Panel, inputClass } from "@/components/product/primitives";
import { useResource } from "@/lib/api/use-resource";
import { listSessionOverview, type SessionListQuery } from "@/lib/api/sessions";
import { academicStatuses } from "@/lib/api/academic";

const sortOptions = [
  { sortBy: 'startDate', sortDirection: 'desc', label: 'Bắt đầu mới nhất' },
  { sortBy: 'startDate', sortDirection: 'asc', label: 'Bắt đầu cũ nhất' },
  { sortBy: 'endDate', sortDirection: 'asc', label: 'Kết thúc sớm nhất' },
  { sortBy: 'endDate', sortDirection: 'desc', label: 'Kết thúc muộn nhất' },
  { sortBy: 'name', sortDirection: 'asc', label: 'Tên A → Z' },
  { sortBy: 'name', sortDirection: 'desc', label: 'Tên Z → A' },
  { sortBy: 'progress', sortDirection: 'asc', label: 'Tiến độ thấp nhất' },
  { sortBy: 'progress', sortDirection: 'desc', label: 'Tiến độ cao nhất' },
] as const;

/**
 * Session management list (M6): every session of the instructor with project,
 * members and delivery progress from ONE aggregated endpoint. Server-side
 * search/status/pagination; each row links to setup (upcoming) or detail.
 */
export function SessionList({
  list = listSessionOverview,
  embedded = false,
  basePath = '/instructor',
  onManage,
  refreshKey,
}: {
  list?: (q: SessionListQuery, signal?: AbortSignal) => ReturnType<typeof listSessionOverview>;
  embedded?: boolean;
  basePath?: '/instructor' | '/admin';
  onManage?: (id: string) => void;
  refreshKey?: number;
}) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<(typeof sortOptions)[number]>(sortOptions[0]);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const data = useResource(
    useCallback(
      (signal: AbortSignal) =>
        list({ page, pageSize: 10, q: debounced || undefined, status: status || undefined, sortBy: sort.sortBy, sortDirection: sort.sortDirection }, signal),
      [list, page, debounced, status, sort],
    ),
    refreshKey,
  );

  return (
    <div className="space-y-4">
      {embedded ? <h2 className="text-xl font-semibold">Phiên thực tập của bạn</h2> : <PageTitle
        title="Phiên thực tập"
        subtitle={basePath === '/admin' ? 'Các phiên trong hệ thống, đội hình và tiến độ được lưu tại backend' : 'Tất cả phiên của bạn — quản lý từ Project Library tới báo cáo'}
      />}
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="Tìm phiên"
          placeholder="Tìm theo mã, tên phiên hoặc dự án..."
          className={`${inputClass} min-w-52 flex-1`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Lọc theo trạng thái"
          className={inputClass}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">Mọi trạng thái</option>
          {academicStatuses.sessions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select aria-label="Sắp xếp phiên" className={inputClass} value={`${sort.sortBy}:${sort.sortDirection}`}
          onChange={(e) => { setSort(sortOptions.find(s => `${s.sortBy}:${s.sortDirection}` === e.target.value) ?? sortOptions[0]); setPage(1); }}>
          {sortOptions.map(s => <option key={`${s.sortBy}:${s.sortDirection}`} value={`${s.sortBy}:${s.sortDirection}`}>{s.label}</option>)}
        </select>
      </div>
      {data.loading ? (
        <p role="status" className="p-4 text-sm text-slate-500">Đang tải phiên...</p>
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : !data.data || data.data.items.length === 0 ? (
        <Empty>Chưa có phiên thực tập{debounced ? ` phù hợp với "${debounced}"` : " — hãy bắt đầu từ Thư viện dự án"}.</Empty>
      ) : (
        <>
          <ul className="space-y-2">
            {data.data.items.map((s) => (
              <li key={s.id}>
                <Panel title={s.name} action={<Badge>{s.status}</Badge>}>
                  <p className="font-mono text-[11px] text-slate-400">
                    {s.code} · {s.startDate.slice(0, 10)} → {s.endDate.slice(0, 10)}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">Sprint đang chạy: {s.currentSprint?.name ?? 'Chưa có Sprint đang chạy'}</p>
                  {s.alerts && <div className="mt-2 flex flex-wrap gap-2 text-xs" aria-label="Cảnh báo tiến độ">
                    {s.alerts.overdueTasks > 0 && <span className="rounded bg-red-50 px-2 py-1 text-red-700">{s.alerts.overdueTasks} task quá hạn</span>}
                    {s.alerts.pendingReview > 0 && <span className="rounded bg-amber-50 px-2 py-1 text-amber-800">{s.alerts.pendingReview} task chờ duyệt</span>}
                    {s.alerts.sessionOverdue && <span className="rounded bg-red-50 px-2 py-1 text-red-700">Phiên đã quá ngày kết thúc</span>}
                  </div>}
                  <p className="mt-1 text-xs text-slate-500">
                    Project: {s.project?.name ?? "—"}
                    {s.project?.templateVersion !== null && s.project?.templateVersion !== undefined
                      ? ` · template v${s.project.templateVersion}`
                      : ""}
                    {" · "}{s.memberCount} thành viên · {s.sprintCount} sprints · {s.taskDone}/{s.taskTotal} tasks ({s.taskPercent}%)
                  </p>
                  <div className="mt-2 flex gap-3 text-xs font-semibold">
                    <Link className="text-blue-600 hover:underline" href={`${basePath}/sessions/${s.id}`}>
                      Chi tiết →
                    </Link>
                    {onManage && <button className="text-blue-600 hover:underline" onClick={() => onManage(s.id)}>Quản trị thông tin</button>}
                    {basePath === '/instructor' && s.status === "upcoming" && s.project && (
                      <Link className="text-emerald-600 hover:underline" href={`/instructor/sessions/${s.id}/setup?project=${s.project.id}`}>
                        Setup →
                      </Link>
                    )}
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
          <Pager page={data.data.page} totalPages={data.data.totalPages} total={data.data.total} onChange={(p: number) => setPage(p)} />
        </>
      )}
    </div>
  );
}
