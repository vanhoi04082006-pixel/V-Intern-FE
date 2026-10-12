"use client";
import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { Empty, Pager, buttonClass, inputClass } from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { useResource } from "@/lib/api/use-resource";
import { errorMessage } from "@/lib/auth/api-client";
import {
  assignIntern,
  cancelAssignment,
  getCandidateDetail,
  listSessionAssignments,
  searchCandidates,
  type Candidate,
} from "@/lib/api/academic";

/** Human-readable reason when a candidate cannot be assigned right now. */
export function ineligibilityReason(c: Candidate): string | null {
  if (c.status !== "passed") return `Recruitment ${c.status} — cần PASSED.`;
  if (c.hasActiveAssignment) return "Đang có assignment hoạt động ở project khác.";
  return null;
}

export interface SelectorDeps {
  search: typeof searchCandidates;
  detail: typeof getCandidateDetail;
  assign: typeof assignIntern;
  cancel: typeof cancelAssignment;
  listAssignments: typeof listSessionAssignments;
}

/**
 * Eligible intern selector (M4): server-side search/role/availability with
 * scores, interview detail expansion, add/remove and slot tracking hooks.
 * Backend revalidates everything at assign time; the UI only previews.
 */
export function MemberSelector({
  sessionId,
  projectId,
  onChanged,
  deps,
}: {
  sessionId: string;
  projectId: string;
  onChanged?: () => void;
  deps?: Partial<SelectorDeps>;
}) {
  // Destructure with stable module-level defaults: the `deps` object itself must
  // NOT be a useCallback dependency (new identity every render → refetch loop).
  const {
    search = searchCandidates,
    detail: getDetail = getCandidateDetail,
    assign: assignFn = assignIntern,
    cancel: cancelFn = cancelAssignment,
    listAssignments: listFn = listSessionAssignments,
  } = deps ?? {};
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState("");
  const [availability, setAvailability] = useState("available");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [assignmentsRevision, setAssignmentsRevision] = useState(0);
  const action = useAction(() => {
    setAssignmentsRevision((r) => r + 1);
    onChanged?.();
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const results = useResource(
    useCallback(
      (signal: AbortSignal) =>
        search(
          {
            page,
            pageSize: 10,
            search: debounced || undefined,
            role: role || undefined,
            eligibility: availability === "all" ? undefined : "available",
          },
          signal,
        ),
      [search, page, debounced, role, availability],
    ),
  );
  const assigned = useResource(
    useCallback((signal: AbortSignal) => listFn(sessionId, signal), [listFn, sessionId, assignmentsRevision]),
  );
  const assignedIds = new Set((assigned.data ?? []).map((a) => a.internId.toLowerCase()));

  async function toggleDetail(c: Candidate) {
    if (expanded === c.userId) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(c.userId);
    setDetail(null);
    try {
      setDetail(await getDetail(c.userId));
    } catch (e) {
      setDetail({ error: errorMessage(e) });
    }
  }

  async function add(c: Candidate) {
    setNotice(null);
    const ok = await action.run(() => assignFn({ internId: c.userId, projectId, sessionId }));
    if (ok) setNotice(`Đã phân công ${c.displayName ?? c.email ?? c.userId}.`);
  }

  async function remove(internId: string, displayName: string | null) {
    setNotice(null);
    const list = await listFn(sessionId);
    const row = list.find((a) => a.internId.toLowerCase() === internId.toLowerCase() && a.status === "active");
    if (!row) {
      setNotice("Không tìm thấy assignment đang hoạt động để gỡ.");
      return;
    }
    const ok = await action.run(() => cancelFn(row.id));
    if (ok) setNotice(`Đã gỡ ${displayName ?? internId.slice(0, 8)} khỏi phiên.`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="Tìm sinh viên"
          placeholder="Tìm theo tên hoặc email..."
          className={`${inputClass} min-w-52 flex-1`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select aria-label="Lọc theo role" className={inputClass} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">Mọi role</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
          <option value="qa">QA</option>
          <option value="business_analyst">Business Analyst</option>
          <option value="devops">DevOps</option>
        </select>
        <select aria-label="Lọc theo availability" className={inputClass} value={availability} onChange={(e) => { setAvailability(e.target.value); setPage(1); }}>
          <option value="available">Còn trống</option>
          <option value="all">Tất cả</option>
        </select>
      </div>
      {notice && (
        <p role="status" className="rounded bg-emerald-50 p-2 text-xs text-emerald-700">{notice}</p>
      )}
      {Boolean(action.error) && <ErrorState error={action.error} />}
      {results.loading ? (
        <p role="status" className="p-3 text-sm text-slate-500">Đang tìm ứng viên...</p>
      ) : results.error ? (
        <ErrorState error={results.error} onRetry={results.reload} />
      ) : !results.data || results.data.items.length === 0 ? (
        <Empty>Không tìm thấy ứng viên phù hợp{debounced ? ` với "${debounced}"` : ""}.</Empty>
      ) : (
        <>
          <ul className="space-y-2">
            {results.data.items.map((c) => {
              const reason = ineligibilityReason(c);
              const added = assignedIds.has(c.userId.toLowerCase());
              return (
                <li key={c.userId} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{c.displayName ?? "Chưa có tên"}</p>
                      <p className="truncate text-[11px] text-slate-500">{c.email ?? "Chưa có email"}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Role: {c.selectedRole ?? "—"} · Recruitment: {c.status}
                        {c.result ? ` · Overall ${c.result.overallScore} (T${c.result.technicalScore}/S${c.result.softSkillScore})` : ""}
                      </p>
                      {reason && <p className="mt-1 text-[11px] text-amber-700">{reason}</p>}
                      {expanded === c.userId && (
                        <div className="mt-2 rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                          {detail ? (
                            <pre className="max-h-40 overflow-auto whitespace-pre-wrap">
                              {JSON.stringify(detail, null, 1).slice(0, 2000)}
                            </pre>
                          ) : (
                            "Đang tải chi tiết phỏng vấn..."
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        className="rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-600"
                        onClick={() => void toggleDetail(c)}
                      >
                        {expanded === c.userId ? "Ẩn" : "Chi tiết"}
                      </button>
                      {added ? (
                        <button
                          type="button"
                          disabled={action.busy}
                          className="rounded border border-rose-200 px-2 py-1 text-[11px] text-rose-600 disabled:opacity-50"
                          onClick={() => void remove(c.userId, c.displayName)}
                        >
                          Gỡ
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={action.busy || reason !== null}
                          title={reason ?? "Phân công vào phiên"}
                          className={`${buttonClass} px-2 py-1 text-[11px] disabled:opacity-50`}
                          onClick={() => void add(c)}
                        >
                          Thêm
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pager
            page={results.data.page}
            totalPages={results.data.totalPages}
            total={results.data.total}
            unit="ứng viên"
            onChange={setPage}
          />
          <p className="text-[11px] text-slate-400">
            Backend kiểm tra eligibility khi lưu; ứng viên chưa đạt sẽ bị từ chối với mã lỗi rõ ràng.
          </p>
        </>
      )}
    </div>
  );
}
