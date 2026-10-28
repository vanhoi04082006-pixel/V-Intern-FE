"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { Empty, Pager, buttonClass, inputClass } from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { useResource } from "@/lib/api/use-resource";
import { Can } from "@/components/auth/can";
import { errorMessage } from "@/lib/auth/api-client";
import { roleLabel } from '@/lib/api/workspace';
import { listCareerReferences } from '@/lib/api/career-roles';
import { CandidateInterviewSummary } from './candidate-interview-summary';
import {
  assignIntern,
  cancelAssignment,
  completeAssignment,
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

/** Slot capacity left for a role (never negative). */
export function slotRemaining(slot: { requiredCount: number; filledCount: number }): number {
  return Math.max(0, slot.requiredCount - slot.filledCount);
}

/** Only unfilled slots matching the passed recruitment role are assignable. */
export function openRolesFor(
  candidate: Candidate,
  slots: Array<{ roleCode: string; requiredCount: number; filledCount: number }>,
): string[] {
  return slots.filter(s => slotRemaining(s) > 0 && s.roleCode === candidate.selectedRole).map(s => s.roleCode);
}

export interface SelectorDeps {
  careers?: typeof listCareerReferences;
  search: typeof searchCandidates;
  detail: typeof getCandidateDetail;
  assign: typeof assignIntern;
  cancel: typeof cancelAssignment;
  complete?: typeof completeAssignment;
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
  slots,
  onChanged,
  deps,
  members = [],
}: {
  sessionId: string;
  projectId: string;
  slots: Array<{ roleCode: string; requiredCount: number; filledCount: number }>;
  onChanged?: () => void;
  deps?: Partial<SelectorDeps>;
  members?: Array<{ userId: string; displayName: string; email: string }>;
}) {
  // Destructure with stable module-level defaults: the `deps` object itself must
  // NOT be a useCallback dependency (new identity every render → refetch loop).
  const {
    search = searchCandidates,
    detail: getDetail = getCandidateDetail,
    assign: assignFn = assignIntern,
    cancel: cancelFn = cancelAssignment,
    complete: completeFn = completeAssignment,
    listAssignments: listFn = listSessionAssignments,
    careers: loadCareers = listCareerReferences,
  } = deps ?? {};
  const careerCatalog = useResource(useCallback((signal: AbortSignal) => loadCareers(signal), [loadCareers]));
  const careerLabel = (code: string | null) => careerCatalog.data?.find(role => role.code === code)?.label ?? roleLabel(code);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const detailRequest = useRef(0);
  useEffect(() => () => { detailRequest.current += 1; }, [sessionId]);
  const [notice, setNotice] = useState<string | null>(null);
  const [assignmentsRevision, setAssignmentsRevision] = useState(0);
  // Per-candidate role choice (which open slot this intern fills).
  const [rolePick, setRolePick] = useState<Record<string, string>>({});
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
            eligibility: "available",
          },
          signal,
        ),
      [search, page, debounced, role],
    ),
    assignmentsRevision,
  );
  const assigned = useResource(
    useCallback((signal: AbortSignal) => listFn(sessionId, signal), [listFn, sessionId]), assignmentsRevision,
  );
  const assignedIds = new Set((assigned.data ?? []).map((a) => a.internId.toLowerCase()));

  async function toggleDetail(c: Candidate) {
    const request = ++detailRequest.current;
    if (expanded === c.userId) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(c.userId);
    setDetail(null);
    try {
      const result = await getDetail(c.userId);
      if (detailRequest.current === request) setDetail(result);
    } catch (e) {
      if (detailRequest.current === request) setDetail({ error: errorMessage(e) });
    }
  }

  async function add(c: Candidate) {
    setNotice(null);
    const open = openRolesFor(c, slots);
    if (open.length === 0) {
      setNotice("Không còn slot trống phù hợp với vai trò đã phỏng vấn.");
      return;
    }
    const role = rolePick[c.userId] ?? open[0];
    const ok = await action.run(() => assignFn({ internId: c.userId, projectId, sessionId, role }));
    if (ok) setNotice(`Đã phân công ${c.displayName ?? c.email ?? c.userId}.`);
  }

  async function remove(internId: string, displayName: string | null) {
    setNotice(null);
    let removed = false;
    const ok = await action.run(async () => {
      const list = await listFn(sessionId, undefined, internId);
      const row = list.find((a) => a.internId.toLowerCase() === internId.toLowerCase() && a.status === "active");
      if (!row) {
        setNotice("Không tìm thấy assignment đang hoạt động để gỡ.");
        return;
      }
      await cancelFn(row.id);
      removed = true;
    });
    if (ok && removed) setNotice(`Đã gỡ ${displayName ?? internId.slice(0, 8)} khỏi phiên.`);
  }

  /** POST assignments/:id/complete — kết thúc phân công trong trạng thái hoàn thành (lịch sử được giữ lại). */
  async function complete(internId: string, displayName: string | null) {
    setNotice(null);
    let completed = false;
    const ok = await action.run(async () => {
      const list = await listFn(sessionId, undefined, internId);
      const row = list.find((a) => a.internId.toLowerCase() === internId.toLowerCase() && a.status === "active");
      if (!row) {
        setNotice("Không tìm thấy phân công đang hoạt động để hoàn thành.");
        return;
      }
      await completeFn(row.id);
      completed = true;
    });
    if (ok && completed) setNotice(`Đã hoàn thành phân công của ${displayName ?? internId.slice(0, 8)}.`);
  }

  return (
    <div className="space-y-3">
      {members.length > 0 && <section aria-label="Thành viên đã phân công" className="border-b border-border pb-4"><h3 className="mb-2 text-body font-semibold">Đội hình hiện tại</h3><ul className="space-y-2">{members.map(member => <li key={member.userId} className="flex flex-wrap items-center justify-between gap-2 text-body"><div className="min-w-0"><strong>{member.displayName}</strong><p className="break-all text-caption text-muted-foreground">{member.email}</p></div><Can perm="assignments.manage"><button type="button" aria-label={`Gỡ ${member.displayName} khỏi phiên`} className="rounded-control border border-border px-3 py-2 text-caption font-semibold text-destructive disabled:opacity-50" disabled={action.busy} onClick={() => void remove(member.userId, member.displayName)}>Gỡ khỏi phiên</button></Can></li>)}</ul></section>}
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="Tìm sinh viên"
          placeholder="Tìm theo tên hoặc email..."
          className={`${inputClass} min-w-52 flex-1`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select aria-label="Lọc theo vai trò" className={inputClass} disabled={careerCatalog.loading || Boolean(careerCatalog.error)} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">Mọi vai trò</option>
          {careerCatalog.data?.map(role => <option key={role.code} value={role.code}>{role.label}</option>)}
        </select>
      </div>
      <p className="text-caption text-muted-foreground">Chỉ tìm sinh viên đã đậu phỏng vấn và chưa có phân công đang hoạt động.</p>
      {Boolean(careerCatalog.error) && <div role="alert" className="text-body text-warning">Không tải được danh sách nghề nghiệp. Bạn vẫn có thể tìm sinh viên theo tên. <button type="button" className="font-semibold underline" onClick={careerCatalog.reload}>Thử lại danh sách nghề</button></div>}
      {notice && (
        <p role="status" className="rounded bg-success-subtle p-2 text-caption text-success">{notice}</p>
      )}
      {Boolean(action.error) && <ErrorState error={action.error} />}
      {results.loading ? (
        <p role="status" className="p-3 text-body text-muted-foreground">Đang tìm ứng viên...</p>
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
                <li key={c.userId} className="border-b border-border py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-body font-semibold text-foreground">{c.displayName ?? "Chưa có tên"}</p>
                      <p className="break-words text-caption text-muted-foreground">{c.email ?? "Chưa có email"}</p>
                      <p className="mt-1 text-caption text-muted-foreground">
                        {careerLabel(c.selectedRole)} · {c.status === 'passed' ? 'Đã đậu phỏng vấn' : 'Chưa đủ điều kiện'}
                        {c.result ? ` · Tổng điểm ${c.result.overallScore} · Chuyên môn ${c.result.technicalScore} · Tiếng Anh ${c.result.englishScore ?? 'Chưa có điểm riêng'}` : ''}
                      </p>
                      {Boolean(c.result?.strengths?.length) && <p className="mt-2 text-caption text-muted-foreground">Kỹ năng: {c.result!.strengths!.join(' · ')}</p>}
                      {Boolean(c.result?.weaknesses?.length) && <p className="mt-1 text-caption text-muted-foreground">Cần cải thiện: {c.result!.weaknesses!.join(' · ')}</p>}
                      {reason && <p className="mt-1 text-caption text-warning">{reason}</p>}
                      {!reason && !added && (
                        <label className="mt-1 block text-caption text-muted-foreground">
                          Vai trò trong đội
                          <select
                            aria-label={`Vai trò cho ${c.displayName ?? c.userId}`}
                            className={`${inputClass} mt-1`}
                            value={rolePick[c.userId] ?? openRolesFor(c, slots)[0] ?? ""}
                            onChange={(e) => setRolePick((prev) => ({ ...prev, [c.userId]: e.target.value }))}
                            disabled={openRolesFor(c, slots).length === 0}
                          >
                            {openRolesFor(c, slots).length === 0 ? (
                              <option value="">Hết slot</option>
                            ) : (
                              openRolesFor(c, slots).map((r) => (
                              <option key={r} value={r}>{careerLabel(r)}</option>
                              ))
                            )}
                          </select>
                        </label>
                      )}
                      {expanded === c.userId && (
                        <div className="mt-3 border-t border-border pt-3 text-small text-muted-foreground">
                          {detail ? (
                            <CandidateInterviewSummary detail={detail} />
                          ) : (
                            "Đang tải chi tiết phỏng vấn..."
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="min-h-10 rounded-control border border-input px-3 py-2 text-small text-primary hover:bg-accent"
                        onClick={() => void toggleDetail(c)}
                      >
                        {expanded === c.userId ? "Ẩn" : "Chi tiết"}
                      </button>
                      <Can perm="assignments.manage">{added ? (<>
                        <button
                          type="button"
                          disabled={action.busy}
                          title="Đánh dấu phân công của sinh viên này là hoàn thành"
                          className="min-h-10 rounded-control border border-input px-3 py-2 text-small text-primary hover:bg-accent disabled:opacity-50"
                          onClick={() => void complete(c.userId, c.displayName)}
                        >
                          Hoàn thành
                        </button>
                        <button
                          type="button"
                          disabled={action.busy}
                          className="min-h-10 rounded-control border border-input px-3 py-2 text-small text-destructive hover:bg-destructive-subtle disabled:opacity-50"
                          onClick={() => void remove(c.userId, c.displayName)}
                        >
                          Gỡ
                        </button>
                      </>) : (
                        <button
                          type="button"
                          disabled={action.busy || reason !== null || openRolesFor(c, slots).length === 0}
                          title={reason ?? (openRolesFor(c, slots).length === 0 ? "Không còn slot vai trò trống" : "Phân công vào phiên")}
                          className={`${buttonClass} px-2 py-1 text-caption disabled:opacity-50`}
                          onClick={() => void add(c)}
                        >
                          Thêm
                        </button>
                      )}</Can>
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
            onChange={(p: number) => setPage(p)}
          />
          <p className="text-caption text-muted-foreground">Chỉ sinh viên đã đậu, còn trống và phù hợp vai trò trong đội mới được phân công.</p>
        </>
      )}
    </div>
  );
}
