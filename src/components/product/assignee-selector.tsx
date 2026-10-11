"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { listCandidates as defaultList } from "@/lib/api/academic";
import { errorMessage } from "@/lib/auth/api-client";
import { inputClass } from "./primitives";

export interface AssigneeCandidate {
  userId: string;
  displayName: string | null;
  email: string | null;
  status: string;
}

type ListFn = (
  page: number,
  signal?: AbortSignal,
) => Promise<{
  items: AssigneeCandidate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>;

const PAGE_CAP = 10;
const SEARCH_DEBOUNCE_MS = 150;

const statusLabels: Record<string, string> = {
  passed: "Đạt tuyển dụng",
  failed: "Chưa đạt",
  evaluation_pending: "Đang chấm",
  interview_in_progress: "Đang phỏng vấn",
  role_selected: "Đã chọn vị trí",
  recruitment_required: "Chờ tuyển dụng",
};

function norm(value: string | null): string {
  return (value ?? "").toLocaleLowerCase("vi");
}

function matches(c: AssigneeCandidate, q: string): boolean {
  if (!q) return true;
  return norm(c.displayName).includes(q) || norm(c.email).includes(q);
}

export function AssigneeSelector({
  value,
  onChange,
  multiple = false,
  listCandidates = defaultList,
  label = "Chọn sinh viên",
  onSelectionChange,
}: {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  listCandidates?: ListFn;
  label?: string;
  /** Optional display-name lookup for the current selection. */
  onSelectionChange?: (selected: { userId: string; name: string }[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState<AssigneeCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [pagesLeft, setPagesLeft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [active, setActive] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [nextPage, setNextPage] = useState(2);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Sync guard: state updates don't flush between two clicks in the same tick.
  const loadingMoreRef = useRef(false);

  // Debounce search input so typing never hammers render/filter churn;
  // the input stays immediate, only the applied filter lags slightly.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLocaleLowerCase("vi")), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const q = debouncedQuery;
  // Load once on open (progressively up to the cap); typing only filters
  // client-side through a short debounce, so searching never hammers the
  // server or needs paging UI.
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setLoadingMore(false);
      setError(null);
      try {
        let page = 1;
        let acc: AssigneeCandidate[] = [];
        let totalPages = 1;
        let grand = 0;
        for (;;) {
          const r = await listCandidates(page, ctrl.signal);
          if (cancelled) return;
          totalPages = r.totalPages;
          grand = r.total;
          acc = [...acc, ...r.items];
          setLoaded([...acc]);
          setTotal(grand);
          if (page >= totalPages || page >= PAGE_CAP) {
            // PAGE_CAP only bounds the automatic progressive load;
            // explicit "Tải thêm" clicks may continue past it.
            setPagesLeft(page < totalPages);
            setNextPage(page + 1);
            break;
          }
          page += 1;
          setLoadingMore(true);
        }
      } catch (e) {
        if (!cancelled && (e as Error)?.name !== "AbortError") setError(e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  async function loadMore() {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const r = await listCandidates(nextPage);
      setLoaded((old) => {
        const seen = new Set(old.map((x) => x.userId));
        return [...old, ...r.items.filter((x) => !seen.has(x.userId))];
      });
      setTotal(r.total);
      setPagesLeft(nextPage < r.totalPages);
      setNextPage((p) => p + 1);
    } catch (e) {
      setError(e);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  const results = loaded.filter((c) => matches(c, q));
  const selected: string[] = Array.isArray(value) ? value : value ? [value] : [];

  function pick(id: string) {
    if (multiple) {
      const next = selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id];
      onChange(next);
      onSelectionChange?.(next.map((userId) => {
        const c = loaded.find((x) => x.userId === userId);
        return { userId, name: c?.displayName ?? c?.email ?? userId.slice(0, 8) };
      }));
    } else {
      onChange(id);
      const c = loaded.find((x) => x.userId === id);
      onSelectionChange?.([{ userId: id, name: c?.displayName ?? c?.email ?? id.slice(0, 8) }]);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(0, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      const hit = results[active];
      if (hit && document.activeElement?.tagName !== "BUTTON") {
        e.preventDefault();
        pick(hit.userId);
      }
    } else if (e.key === "Escape") {
      setQuery("");
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
        <span className="relative mt-1 block">
          <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Tìm theo tên hoặc email"
            placeholder="Tìm theo tên hoặc email..."
            className={`${inputClass} pl-9 pr-9`}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="assignee-results"
            aria-activedescendant={results[active] ? `assignee-${results[active].userId}` : undefined}
          />
          {query && (
            <button
              type="button"
              aria-label="Xóa tìm kiếm"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-navy"
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          )}
        </span>
      </label>
      {multiple && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Đã chọn">
          {selected.map((id) => {
            const c = loaded.find((x) => x.userId === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                {c?.displayName ?? id.slice(0, 8)}
                <button type="button" aria-label={`Bỏ chọn ${c?.displayName ?? id}`} className="rounded-full hover:bg-blue-200" onClick={() => pick(id)}>
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}
      {loading ? (
        <p role="status" className="flex items-center gap-2 p-3 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Đang tải danh sách ứng viên…
        </p>
      ) : error ? (
        <p role="alert" className="p-3 text-sm text-rose-600">
          {errorMessage(error)}{" "}
          <button type="button" className="underline" onClick={() => setReloadKey((k) => k + 1)}>
            Thử lại
          </button>
        </p>
      ) : results.length ? (
        <>
          <ul id="assignee-results" role="listbox" aria-label="Kết quả ứng viên" className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-blue-100/70 p-1.5">
            {results.slice(0, 50).map((c, i) => {
              const isActive = i === active;
              const isSelected = multiple ? selected.includes(c.userId) : selected[0] === c.userId;
              return (
                <li
                  key={c.userId}
                  id={`assignee-${c.userId}`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(c.userId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pick(c.userId);
                    }
                  }}
                  className={`flex cursor-pointer items-center gap-3 rounded-md p-2.5 text-sm ${isActive ? "bg-blue-50 outline outline-1 outline-blue-300" : ""} ${isSelected ? "ring-1 ring-blue-400" : ""}`}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      tabIndex={-1}
                      aria-label={c.displayName ?? c.userId}
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 accent-blue-600"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-navy">{c.displayName ?? "Chưa có tên"}</strong>
                    <span className="block truncate text-[11px] text-slate-500">{c.email ?? "Chưa có email"}</span>
                  </span>
                  <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                    {statusLabels[c.status] ?? c.status}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Hiển thị {Math.min(results.length, 50)}{results.length > 50 ? "+" : ""} / {results.length} phù hợp · Đã tải {loaded.length}/{total}
            </span>
            {(pagesLeft || loadingMore) && (
              <button type="button" disabled={loadingMore} className="font-semibold text-blue-600 hover:underline disabled:opacity-50" onClick={() => void loadMore()}>
                {loadingMore ? "Đang tải…" : "Tải thêm"}
              </button>
            )}
          </p>
          <p className="text-[11px] text-slate-400">Hệ thống kiểm tra điều kiện phân công khi lưu; ứng viên chưa đạt sẽ bị từ chối.</p>
        </>
      ) : (
        <p role="status" className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">
          Không tìm thấy ứng viên phù hợp{query ? ` với “${query}”` : ""}.
        </p>
      )}
    </div>
  );
}
