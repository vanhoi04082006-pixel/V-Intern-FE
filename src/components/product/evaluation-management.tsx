"use client";
import { SessionSection as Panel } from "@/components/sessions/session-section";
import { usePathname } from "next/navigation";
import { InstructorPageTitle as PageTitle } from "@/components/instructor/instructor-page-title";
import { InstructorNotice } from "@/components/instructor/instructor-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "@/lib/api/management";
import { PerformanceMemberPicker } from "./performance-member-picker";
import { useResource } from "@/lib/api/use-resource";
import { getSessionUser } from "@/lib/auth/session";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { AcademicPicker } from "./academic-picker";
import { useAction } from "./use-action";
import { Can } from "@/components/auth/can";
import { CollectionMetrics } from "./collection-insights";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { StampMoc, MarginNote } from "@/components/workspace/notebook";
import { StampBadge } from "@/components/v-intern/doodles";
import { IconPlus, IconX } from "@/components/v-intern/icons";
import { FilterChips } from "@/components/notebook/kit";
import {
  Badge,
  btn,
  buttonClass,
  Empty,
  inputClass,
  Modal,
  Pager,
} from "./primitives";
const evaluationLabels = {
  draft: "Bản nháp",
  submitted: "Đã nộp",
  finalized: "Đã chốt",
  open: "Đang mở",
  closed: "Đã đóng",
  archived: "Đã lưu trữ",
};
/** AI suggestion lifecycle states are backend-defined; unknown values
 * fall back to the raw code so new states stay visible instead of blank. */
const suggestionStatusLabels: Record<string, string> = {
  generated: "Mới tạo",
  accepted: "Đã áp dụng",
  superseded: "Đã thay thế",
  failed: "Lỗi tạo gợi ý",
};

/* =====================================================================
 * Journey Notebook v3 — micro-interactions chấm bài (port từ sandbox
 * instructor-grading): bước điểm ±0,25, chip điểm nhanh, spark-bar dưới
 * điểm AI đề xuất, bung mộc ĐÃ DUYỆT + confetti khi chốt, lỗi inline
 * rung mực. Chỉ là lớp hình ảnh — logic + bản ghi API giữ nguyên.
 * ===================================================================== */

/** Nút bước điểm — tròn viền mực, vùng chạm 44px. */
const stepButtonClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 grid h-11 w-11 place-items-center rounded-full border-2 border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] transition-all hover:-translate-y-0.5 hover:bg-[var(--blue-mist)] hover:text-[var(--royal)] disabled:pointer-events-none disabled:opacity-50";

/** Chip điểm nhanh ("theo AI" / "tối đa") — vùng chạm 44px. */
const quickScoreChipClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 min-h-11 inline-flex items-center rounded-full border-[1.5px] border-[color-mix(in_srgb,var(--ink)_32%,transparent)] bg-[var(--paper)] px-3 py-1 text-caption font-semibold text-[var(--ink)] transition-all hover:border-[var(--ink)] hover:bg-[var(--blue-mist)]";

/** Confetti 6 hạt bung một nhịp khi chốt điểm — bản inline của .confetti-pop
 * sandbox (tiện ích chưa được port sang journey.css; keyframe `confetti-burst`
 * và màu --confetti-N đã có sẵn), nên dùng style inline thay vì CSS dùng chung. */
function ConfettiBurst() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
    >
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 5,
          height: 5,
          borderRadius: 1.5,
          opacity: 0,
          background: "var(--confetti-1)",
          boxShadow:
            "9px 3px 0 0 var(--confetti-2), -10px -4px 0 0 var(--confetti-3)",
          animation:
            "confetti-burst 680ms 60ms cubic-bezier(0.2, 0.7, 0.3, 1) forwards",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 5,
          height: 5,
          borderRadius: 1.5,
          opacity: 0,
          background: "var(--confetti-4)",
          boxShadow:
            "8px -6px 0 0 var(--confetti-5), -9px 5px 0 0 var(--confetti-6)",
          animation:
            "confetti-burst 640ms 140ms cubic-bezier(0.2, 0.7, 0.3, 1) forwards",
        }}
      />
    </span>
  );
}

/** Spark-bar tí hon dưới điểm AI đề xuất — vẽ tỉ lệ điểm/thang điểm thật
 * (mực nắp trên đỉnh của .spark-bar journey.css, tông theo mức đạt). */
function AiScoreSparkBar({
  suggested,
  max,
}: {
  suggested: number;
  max: number;
}) {
  if (!(max > 0)) return null;
  const ratio = Math.min(1, Math.max(0, suggested / max));
  const tone =
    ratio >= 0.8 ? "success" : ratio >= 0.65 ? "warning" : "danger";
  return (
    <span
      aria-hidden="true"
      title={`AI đề xuất ${suggested}/${max}`}
      className="mt-2 block h-[7px] w-24 overflow-hidden rounded-[3px_3px_1px_1px] border-[1.5px] border-[color-mix(in_srgb,var(--ink)_35%,transparent)] bg-[var(--paper)]"
    >
      <span
        className="spark-bar block h-full"
        data-tone={tone}
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </span>
  );
}

export function EvaluationManagement() {
  const isInstructor = Boolean(usePathname()?.startsWith("/instructor"));
  const [page, setPage] = useState(1),
    [cycleId, setCycleId] = useState(""),
    [status, setStatus] = useState(""),
    [cyclesPage, setCyclesPage] = useState(1),
    [showCreate, setShowCreate] = useState(false),
    [cycleEditor, setCycleEditor] =
      useState<ReturnType<typeof api.parseCycle>>(),
    [selected, setSelected] = useState<string>();
  const cycles = useResource(
      useCallback(
        (s: AbortSignal) => api.listCycles(cyclesPage, s),
        [cyclesPage],
      ),
    ),
    evaluations = useResource(
      useCallback(
        (s: AbortSignal) =>
          api.listManagedEvaluations(
            page,
            cycleId,
            status,
            /* Admin quản lý toàn bộ đánh giá (BE: isAdmin scope); giảng viên
             * chỉ thấy đánh giá mình phụ trách (evaluatorId = chính mình). */
            (getSessionUser()?.roles ?? []).includes("admin")
              ? ""
              : getSessionUser()?.id,
            s,
          ),
        [page, cycleId, status],
      ),
    );
  return (
    <>
      <PageTitle
        eyebrow="ĐÁNH GIÁ"
        stamp="CHẤM BÀI"
        title="Đánh giá AI"
        subtitle="Giảng viên chốt điểm chính thức · AI cung cấp gợi ý tham khảo"
        action={
          <button className={buttonClass} onClick={() => setShowCreate(true)}>
            Tạo kỳ đánh giá
          </button>
        }
      />
      {!cycles.loading &&
        !evaluations.loading &&
        !cycles.error &&
        !evaluations.error &&
        cycles.data &&
        evaluations.data && (
          <CollectionMetrics
            values={[
              ["Kỳ trong phạm vi quản lý", cycles.data.total],
              ["Đánh giá theo bộ lọc", evaluations.data.total],
              [
                "Bản nháp · trang",
                evaluations.data.items.filter((e) => e.status === "draft")
                  .length,
              ],
              [
                "Đã gửi · trang",
                evaluations.data.items.filter((e) => e.status === "submitted")
                  .length,
              ],
              [
                "Đã chốt · trang",
                evaluations.data.items.filter((e) => e.status === "finalized")
                  .length,
              ],
            ]}
            note="Thống kê trạng thái thuộc trang hiện tại. Điểm AI chỉ tham khảo; không được dùng thay điểm giảng viên."
          />
        )}
      {isInstructor && (
        <div className="mb-5">
          <InstructorNotice title="Từ tiêu chí đến điểm chính thức">
            Chọn kỳ đánh giá, chấm theo từng tiêu chí rồi lưu điểm. Chỉ nộp và
            chốt khi bạn đã kiểm tra đủ minh chứng. Gợi ý AI được hiển thị riêng
            để tham khảo.
          </InstructorNotice>
          <MarginNote className="mt-3 max-w-md">
            mực xanh “đã chốt” là điểm chính thức ✎
          </MarginNote>
        </div>
      )}
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <Panel title="Kỳ đánh giá">
          {cycles.loading ? (
            <LoadingState />
          ) : cycles.error ? (
            <ErrorState error={cycles.error} onRetry={cycles.reload} />
          ) : (
            cycles.data && (
              <>
                <button
                  className="mb-3 rounded-control px-1 text-body font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  onClick={() => {
                    setCycleId("");
                    setPage(1);
                  }}
                >
                  Tất cả kỳ
                </button>
                {cycles.data.items.map((c) => (
                  <div
                    key={c.id}
                    className={`workspace-evaluation-cycle border-b border-border py-4 ${cycleId === c.id ? "bg-accent px-3" : ""}`}
                  >
                    <button
                      className="text-left text-body font-semibold"
                      aria-pressed={cycleId === c.id}
                      onClick={() => {
                        setCycleId(c.id);
                        setPage(1);
                      }}
                    >
                      {c.name}
                      <small className="block text-muted-foreground">{c.code}</small>
                    </button>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <Badge>
                        {isInstructor ? evaluationLabels[c.status] : c.status}
                      </Badge>
                      <button
                        className="rounded-control px-1 text-caption font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        onClick={() => setCycleEditor(c)}
                      >
                        Tiêu chí / trạng thái
                      </button>
                    </div>
                  </div>
                ))}
                <Pager {...cycles.data} onChange={setCyclesPage} />
              </>
            )
          )}
        </Panel>
        <Panel
          title="Đánh giá của bạn"
          action={
            cycleId ? (
              <NewEvaluation
                cycleId={cycleId}
                onCreated={(id) => {
                  setSelected(id);
                  evaluations.reload();
                }}
              />
            ) : undefined
          }
        >
          <FilterChips
            options={[
              { value: "", label: "Tất cả trạng thái" },
              ...["draft", "submitted", "finalized"].map((s) => ({
                value: s,
                label: isInstructor
                  ? evaluationLabels[s as keyof typeof evaluationLabels]
                  : s,
              })),
            ]}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            ariaLabel="Trạng thái đánh giá"
            className="mb-4"
          />
          {evaluations.loading ? (
            <LoadingState />
          ) : evaluations.error ? (
            <ErrorState
              error={evaluations.error}
              onRetry={evaluations.reload}
            />
          ) : (
            evaluations.data && (
              <>
                {evaluations.data.items.length ? (
                  <div className="space-y-3">
                    {evaluations.data.items.map((e) => (
                      <article
                        key={e.id}
                        className={`flex flex-wrap items-center justify-between gap-4 border-b border-border py-5${e.status === "submitted" ? " dashed-cut" : ""}`}
                      >
                        <div>
                          {e.status === "finalized" ? (
                            <StampMoc tone="blue" size="sm" thump>
                              {isInstructor
                                ? evaluationLabels[e.status]
                                : e.status}
                            </StampMoc>
                          ) : (
                            <Badge>
                              {isInstructor
                                ? evaluationLabels[e.status]
                                : e.status}
                            </Badge>
                          )}
                          <p className="mt-2 text-body font-semibold">
                            Điểm chính thức: {e.overallScore ?? "Chưa chấm"}
                          </p>
                          <p className="mt-1 max-w-md text-body text-muted-foreground">
                            {e.summary ?? "Chưa có nhận xét"}
                          </p>
                        </div>
                        <button
                          className={buttonClass}
                          onClick={() => setSelected(e.id)}
                        >
                          Mở đánh giá {e.id.slice(0, 8)}
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty>
                    Chưa có đánh giá phù hợp. Chọn kỳ đang mở để tạo đánh giá.
                  </Empty>
                )}
                <Pager {...evaluations.data} onChange={setPage} />
              </>
            )
          )}
        </Panel>
      </div>
      {showCreate && (
        <Modal title="Tạo kỳ đánh giá" onClose={() => setShowCreate(false)}>
          <CycleForm
            onCreated={() => {
              setShowCreate(false);
              cycles.reload();
            }}
          />
        </Modal>
      )}
      {cycleEditor && (
        <Modal
          title={cycleEditor.name}
          onClose={() => setCycleEditor(undefined)}
        >
          <CycleEditor
            key={cycleEditor.id}
            cycle={cycleEditor}
            onChanged={() => {
              cycles.reload();
              setCycleEditor(undefined);
            }}
          />
        </Modal>
      )}
      {selected && (
        <Modal
          title="Chấm điểm chính thức"
          onClose={() => setSelected(undefined)}
        >
          <EvaluationEditor
            key={selected}
            id={selected}
            onChanged={evaluations.reload}
          />
        </Modal>
      )}
    </>
  );
}
function CycleForm({ onCreated }: { onCreated: () => void }) {
  const [code, setCode] = useState(""),
    [name, setName] = useState(""),
    [projectId, setProjectId] = useState(""),
    [sessionId, setSessionId] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [type, setType] = useState("sprint");
  const action = useAction(onCreated);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(() =>
          api.createCycle({
            code,
            name,
            type,
            projectId,
            ...(sessionId ? { sessionId } : {}),
            startDate: new Date(start).toISOString(),
            endDate: new Date(end).toISOString(),
          }),
        );
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <label className="block text-body">
        Mã kỳ
        <input
          required
          maxLength={64}
          placeholder="VD: KY2-2026"
          className={`${inputClass} mt-1`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      <label className="block text-body">
        Tên kỳ
        <input
          required
          maxLength={256}
          placeholder="VD: Đánh giá giữa kỳ thực tập"
          className={`${inputClass} mt-1`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <AcademicPicker
        kind="projects"
        label="Dự án đánh giá"
        value={projectId}
        onChange={setProjectId}
        required
      />
      <AcademicPicker
        kind="sessions"
        label="Phiên đánh giá"
        value={sessionId}
        onChange={setSessionId}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Bắt đầu", start, setStart],
          ["Kết thúc", end, setEnd],
        ].map(([label, value, set]) => (
          <label key={String(label)} className="block text-body">
            {String(label)}
            <input
              type="datetime-local"
              required
              className={`${inputClass} mt-1`}
              value={String(value)}
              onChange={(e) => (set as (x: string) => void)(e.target.value)}
            />
          </label>
        ))}
      </div>
      <select
        aria-label="Loại kỳ"
        className={inputClass}
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        {["sprint", "midterm", "final"].map((t) => (
          <option key={t} value={t}>
            {{ sprint: "Theo Sprint", midterm: "Giữa kỳ", final: "Cuối kỳ" }[t]}
          </option>
        ))}
      </select>
      <p className="text-caption leading-6 text-muted-foreground">
        Kỳ mới sử dụng bộ tiêu chí chuẩn. Có thể chỉnh trọng số trước khi mở kỳ.
      </p>
      <div className="flex justify-end">
        <button className={buttonClass} disabled={action.busy}>
          Lưu kỳ đánh giá
        </button>
      </div>
    </form>
  );
}
function CycleEditor({
  cycle,
  onChanged,
}: {
  cycle: ReturnType<typeof api.parseCycle>;
  onChanged: () => void;
}) {
  const isInstructor = Boolean(usePathname()?.startsWith("/instructor"));
  const criteria = useResource(
      useCallback((s: AbortSignal) => api.getCriteria(cycle.id, s), [cycle.id]),
    ),
    action = useAction(onChanged);
  const [name, setName] = useState(cycle.name);
  const reloadCriteria = () => {
    action.clearError();
    criteria.reload();
  };
  const choices =
    cycle.status === "draft"
      ? ["open", "archived"]
      : cycle.status === "open"
        ? ["closed"]
        : cycle.status === "closed"
          ? ["archived"]
          : [];
  return (
    <div className="space-y-4">
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <Badge>
        {isInstructor ? evaluationLabels[cycle.status] : cycle.status}
      </Badge>
      {cycle.status === "draft" && (
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(() =>
              api.updateCycle(cycle.id, {
                name,
                startDate: cycle.startDate,
                endDate: cycle.endDate,
              }),
            );
          }}
        >
          <input
            aria-label="Tên kỳ"
            required
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className={buttonClass} disabled={action.busy}>
            Lưu tên
          </button>
        </form>
      )}
      {criteria.loading ? (
        <LoadingState />
      ) : criteria.error ? (
        <ErrorState error={criteria.error} onRetry={criteria.reload} />
      ) : (
        criteria.data?.map((c) => (
          <CriterionEditor
            key={c.id}
            cycleId={cycle.id}
            criterion={c}
            editable={cycle.status === "draft"}
            onChanged={reloadCriteria}
          />
        ))
      )}
      {cycle.status === "draft" && (
        <NewCriterion cycleId={cycle.id} onChanged={reloadCriteria} />
      )}
      <div className="flex flex-wrap justify-end gap-3">
        {choices.map((status) => (
          <button
            key={status}
            className={buttonClass}
            disabled={action.busy}
            onClick={() =>
              void action.run(() => api.transitionCycle(cycle.id, status))
            }
          >
            {isInstructor
              ? (
                  {
                    open: "Mở kỳ đánh giá",
                    closed: "Đóng kỳ đánh giá",
                    archived: "Lưu trữ kỳ",
                  } as Record<string, string>
                )[status]
              : `Chuyển kỳ sang ${status}`}
          </button>
        ))}
      </div>
    </div>
  );
}
function CriterionEditor({
  cycleId,
  criterion: c,
  editable,
  onChanged,
}: {
  cycleId: string;
  criterion: ReturnType<typeof api.parseCriterion>;
  editable: boolean;
  onChanged: () => void;
}) {
  const [name, setName] = useState(c.name),
    [weight, setWeight] = useState(c.weight),
    [max, setMax] = useState(c.maxScore),
    action = useAction(onChanged);
  return (
    <form
      className="border-b border-border py-4"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(() =>
          api.updateCriterion(cycleId, c.id, { name, weight, maxScore: max }),
        );
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-body">
          Tiêu chí
          <input
            aria-label={`Tên ${c.code}`}
            className={`${inputClass} mt-1`}
            required
            value={name}
            disabled={!editable}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-body">
          Trọng số (%)
          <input
            aria-label={`Trọng số ${c.code}`}
            className={`${inputClass} mt-1`}
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            required
            disabled={!editable}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
        </label>
        <label className="text-body">
          Điểm tối đa
          <input
            aria-label={`Điểm tối đa ${c.code}`}
            className={`${inputClass} mt-1`}
            type="number"
            min="0.1"
            max="100"
            step="0.1"
            required
            disabled={!editable}
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
          />
        </label>
      </div>
      {editable && (
        <div className="mt-3 flex flex-wrap justify-end gap-3">
          <button className={buttonClass} disabled={action.busy}>
            Lưu tiêu chí
          </button>
          <button
            type="button"
            className="text-body text-destructive"
            disabled={action.busy}
            onClick={() =>
              void action.run(() => api.deleteCriterion(cycleId, c.id))
            }
          >
            Xóa tiêu chí
          </button>
        </div>
      )}
    </form>
  );
}
function NewCriterion({
  cycleId,
  onChanged,
}: {
  cycleId: string;
  onChanged: () => void;
}) {
  const [code, setCode] = useState(""),
    [name, setName] = useState(""),
    [weight, setWeight] = useState(""),
    action = useAction(onChanged);
  return (
    <form
      className="space-y-3 border-t border-border py-4"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(() =>
          api.createCriterion(cycleId, {
            code,
            name,
            weight: Number(weight),
            maxScore: 100,
          }),
        );
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <input
        aria-label="Mã tiêu chí mới"
        placeholder="Mã tiêu chí"
        required
        maxLength={64}
        className={inputClass}
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <input
        aria-label="Tên tiêu chí mới"
        placeholder="Tên tiêu chí"
        required
        maxLength={128}
        className={inputClass}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        aria-label="Trọng số tiêu chí mới"
        placeholder="Trọng số %"
        type="number"
        min="0.01"
        max="100"
        step="0.01"
        required
        className={inputClass}
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />
      <div className="flex justify-end">
        <button className={buttonClass} disabled={action.busy}>
          Thêm tiêu chí
        </button>
      </div>
    </form>
  );
}
function NewEvaluation({
  cycleId,
  onCreated,
}: {
  cycleId: string;
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [internId, setInternId] = useState(""),
    action = useAction();
  return (
    <>
      <button className={buttonClass} onClick={() => setOpen(!open)}>
        Tạo đánh giá
      </button>
      {open && (
        <form
          className="mt-3 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              const result = await api.createEvaluation(cycleId, internId);
              setOpen(false);
              onCreated(result.id);
            });
          }}
        >
          {Boolean(action.error) && <ErrorState error={action.error} />}
          <PerformanceMemberPicker
            label="Intern đánh giá"
            required
            value={internId}
            onChange={setInternId}
          />
          <div className="flex justify-end">
            <button className={buttonClass} disabled={action.busy || !internId}>
              Tạo bản nháp
            </button>
          </div>
        </form>
      )}
    </>
  );
}
function EvaluationEditor({
  id,
  onChanged,
}: {
  id: string;
  onChanged: () => void;
}) {
  const detail = useResource(
    useCallback(
      async (s: AbortSignal) => {
        const e = await api.getManagedEvaluation(id, s),
          criteria = await api.getCriteria(e.cycleId, s);
        return { evaluation: e, criteria };
      },
      [id],
    ),
  );
  return detail.loading ? (
    <LoadingState />
  ) : detail.error ? (
    <ErrorState error={detail.error} onRetry={detail.reload} />
  ) : detail.data ? (
    <ScoreEditor
      /* Không đưa revisionNumber vào key: sau khi lưu điều chỉnh, modal kết
       * quả phải giữ nguyên (xác nhận "điểm cũ → điểm mới") trong khi dữ liệu
       * cha tải lại — overallScore/badge cập nhật qua prop, không remount. */
      key={`${id}-${detail.data.evaluation.status}`}
      detail={detail.data}
      reload={() => {
        detail.reload();
        onChanged();
      }}
    />
  ) : null;
}
export function ScoreEditor({
  detail,
  reload,
}: {
  detail: {
    evaluation: Awaited<ReturnType<typeof api.getManagedEvaluation>>;
    criteria: ReturnType<typeof api.parseCriterion>[];
  };
  reload: () => void;
}) {
  const isInstructor = Boolean(usePathname()?.startsWith("/instructor"));
  const e = detail.evaluation,
    [scores, setScores] = useState<
      Record<string, { score: string; comment: string }>
    >(
      Object.fromEntries(
        detail.criteria.map((c) => {
          const saved = e.scores.find((s) => s.criterionId === c.id);
          return [
            c.id,
            {
              score: saved?.score.toString() ?? "",
              comment: saved?.comment ?? "",
            },
          ];
        }),
      ),
    ),
    [summary, setSummary] = useState(e.summary ?? ""),
    [suggestion, setSuggestion] =
      useState<ReturnType<typeof api.parseAiSuggestion>>();
  const [suggestionHistoryVersion, setSuggestionHistoryVersion] = useState(0);
  const action = useAction(),
    locked = e.status === "finalized",
    /* Spec 14: hiệu chỉnh điểm đã chốt là quyền quản trị — BE xác minh role
     * admin trực tiếp từ DB lúc lưu; FE chỉ điều hướng hiển thị. */
    isAdmin = (getSessionUser()?.roles ?? []).includes("admin"),
    [revising, setRevising] = useState(false);
  /* Journey v3: bung mộc đỏ "ĐÃ DUYỆT" + confetti một nhịp khi chốt điểm —
   * tải lại sau ~750ms cho kịp nhịp đóng dấu (đúng sandbox stamping). Người
   * dùng giảm chuyển động thì bỏ nhịp giải trí và tải lại luôn như trước. */
  const [sealing, setSealing] = useState(false);
  const sealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (sealTimer.current) clearTimeout(sealTimer.current);
    },
    [],
  );
  function fireSeal(after: () => void) {
    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      after();
      return;
    }
    if (sealTimer.current) clearTimeout(sealTimer.current);
    setSealing(true);
    sealTimer.current = setTimeout(() => {
      setSealing(false);
      after();
    }, 750);
  }
  const hasUnsavedChanges =
    summary !== (e.summary ?? "") ||
    detail.criteria.some((criterion) => {
      const saved = e.scores.find(
        (score) => score.criterionId === criterion.id,
      );
      const draft = scores[criterion.id];
      return (
        (draft.score === ""
          ? Boolean(saved)
          : !saved || Number(draft.score) !== saved.score) ||
        draft.comment !== (saved?.comment ?? "")
      );
    });
  const needsSave = isInstructor && !locked && hasUnsavedChanges;
  async function save() {
    const ok = await action.run(() =>
      api.saveEvaluation(e.id, {
        scores: detail.criteria
          .filter((c) => scores[c.id].score !== "")
          .map((c) => ({
            criterionId: c.id,
            score: Number(scores[c.id].score),
            comment: scores[c.id].comment,
          })),
        summary,
      }),
    );
    if (ok) reload();
  }
  /** Điểm AI đang đề xuất cho một mã tiêu chí (theo gợi ý mới nhất). */
  const aiScoreOf = (code: string) =>
    suggestion?.criteria.find((x) => x.criterionCode === code)?.suggestedScore;
  /** Bước ±0,25 điểm cho ô điểm tiêu chí — kẹp trong khoảng 0…maxScore thật. */
  function stepScore(c: ReturnType<typeof api.parseCriterion>, delta: number) {
    const cur = Number(scores[c.id].score.replace(",", "."));
    const base = Number.isFinite(cur)
      ? Math.min(c.maxScore, Math.max(0, cur))
      : 0;
    const next = Math.min(c.maxScore, Math.max(0, base + delta));
    setScores({
      ...scores,
      [c.id]: { ...scores[c.id], score: String(Number(next.toFixed(2))) },
    });
  }
  /** Điền nhanh một giá trị thật (AI đề xuất / điểm tối đa) vào ô điểm. */
  function fillScore(c: ReturnType<typeof api.parseCriterion>, value: number) {
    setScores({
      ...scores,
      [c.id]: { ...scores[c.id], score: String(Number(value.toFixed(2))) },
    });
  }
  return (
    <div
      className={`${isInstructor ? "ins-score-editor " : ""}grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]`}
    >
      <div className="space-y-4">
        {Boolean(action.error) && (
          /* Journey v3: lỗi inline rung mực — key đổi theo thông điệp để mỗi
           * lỗi mới phát lại nhịp animate-shake-ink như sandbox formError. */
          <span key={String(action.error)} className="animate-shake-ink block">
            <ErrorState error={action.error} />
          </span>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{isInstructor ? evaluationLabels[e.status] : e.status}</Badge>
          {e.revisionNumber > 0 && (
            /* Số lần hiệu chỉnh chính thức đã áp dụng (spec 14). */
            <Badge tone="blue">Điều chỉnh #{e.revisionNumber}</Badge>
          )}
          <p className="font-bold">
            Điểm chính thức: {e.overallScore ?? "Chưa chấm"}
          </p>
          {locked && (
            /* Điểm đã chốt là quyết định cuối — mộc xanh đóng đè bản in. */
            <StampMoc tone="blue" size="sm" thump>
              CHỐT ĐIỂM
            </StampMoc>
          )}
        </div>
        {isInstructor && (
          <ol className="ins-decision-steps" aria-label="Quy trình đánh giá">
            {(
              [
                ["draft", "Chấm & lưu"],
                ["submitted", "Đã nộp"],
                ["finalized", "Đã chốt"],
              ] as const
            ).map(([status, label]) => (
              <li
                key={status}
                aria-current={e.status === status ? "step" : undefined}
              >
                {label}
              </li>
            ))}
          </ol>
        )}
        {needsSave && (
          <InstructorNotice title="Thay đổi chưa được lưu">
            Lưu điểm và nhận xét trước khi nộp hoặc chốt, để kết quả chính thức
            khớp với nội dung bạn đang xem.
          </InstructorNotice>
        )}
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {detail.criteria.map((c) => {
            const aiValue = aiScoreOf(c.code);
            return (
            <fieldset key={c.id} className="border-b border-border pb-5 pt-3">
              <legend className="text-subsection font-semibold">{c.name}</legend>
              <p className="mt-1 text-caption text-muted-foreground">
                Trọng số {c.weight}% · Điểm tối đa {c.maxScore}
                {c.isRequired ? " · Bắt buộc" : ""}
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div>
              <label className="block text-body">
                Điểm {c.name}
                <input
                  aria-label={`Điểm ${c.name}`}
                  type="number"
                  min="0"
                  max={c.maxScore}
                  step="0.1"
                  required={c.isRequired}
                  disabled={locked || action.busy}
                  className={`${inputClass} mt-1`}
                  value={scores[c.id].score}
                  onChange={(event) =>
                    setScores({
                      ...scores,
                      [c.id]: { ...scores[c.id], score: event.target.value },
                    })
                  }
                />
              </label>
              {!locked && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      className={stepButtonClass}
                      disabled={action.busy}
                      aria-label={`Bớt 0,25 điểm ${c.name}`}
                      onClick={() => stepScore(c, -0.25)}
                    >
                      <IconX size={13} />
                    </button>
                    <button
                      type="button"
                      className={stepButtonClass}
                      disabled={action.busy}
                      aria-label={`Thêm 0,25 điểm ${c.name}`}
                      onClick={() => stepScore(c, 0.25)}
                    >
                      <IconPlus size={13} />
                    </button>
                  </span>
                  {typeof aiValue === "number" && (
                    <button
                      type="button"
                      className={quickScoreChipClass}
                      disabled={action.busy}
                      aria-label={`Điền điểm AI đề xuất cho ${c.name}`}
                      onClick={() => fillScore(c, aiValue)}
                    >
                      theo AI
                    </button>
                  )}
                  <button
                    type="button"
                    className={quickScoreChipClass}
                    disabled={action.busy}
                    aria-label={`Điền điểm tối đa cho ${c.name}`}
                    onClick={() => fillScore(c, c.maxScore)}
                  >
                    tối đa
                  </button>
                </div>
              )}
              </div>
              <label className="block text-body">
                Nhận xét {c.name}
                <textarea
                  aria-label={`Nhận xét ${c.name}`}
                  maxLength={2000}
                  disabled={locked || action.busy}
                  className={`${inputClass} mt-1`}
                  value={scores[c.id].comment}
                  onChange={(event) =>
                    setScores({
                      ...scores,
                      [c.id]: { ...scores[c.id], comment: event.target.value },
                    })
                  }
                />
              </label>
              </div>
            </fieldset>
            );
          })}
          <label className="block text-body">
            Tổng kết
            <textarea
              className={`${inputClass} mt-1`}
              maxLength={4000}
              disabled={locked || action.busy}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>
          {!locked && (
            <div className="flex justify-end">
              <button className={buttonClass} disabled={action.busy}>
                Lưu điểm chính thức
              </button>
            </div>
          )}
        </form>
        <div className="flex flex-wrap gap-3">
          {e.status === "draft" && (
            <button
              className={buttonClass}
              disabled={action.busy || needsSave}
              onClick={() =>
                void action
                  .run(() => api.advanceEvaluation(e.id, "submit"))
                  .then((ok) => {
                    if (ok) reload();
                  })
              }
            >
              Nộp đánh giá
            </button>
          )}
          {e.status === "submitted" && (
            <span className="relative inline-flex">
              {sealing && (
                <>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-9 right-2 z-10"
                  >
                    <StampMoc tone="red" rotate={-8} size="sm" thump>
                      ĐÃ DUYỆT
                    </StampMoc>
                  </span>
                  <ConfettiBurst />
                </>
              )}
              <button
                className={buttonClass}
                disabled={action.busy || needsSave || sealing}
                onClick={() =>
                  void action
                    .run(() => api.advanceEvaluation(e.id, "finalize"))
                    .then((ok) => {
                      if (ok) fireSeal(reload);
                    })
                }
              >
                Chốt đánh giá
              </button>
            </span>
          )}
          {locked && !isAdmin && (
            <p className="text-body text-muted-foreground">
              Đánh giá đã khóa. Hiệu chỉnh cần quyền quản trị và lưu lịch sử.
            </p>
          )}
          {locked && isAdmin && (
            /* Hiệu chỉnh chính thức trên đánh giá đã chốt — spec 14: chỉ admin,
             * BE xác minh lại role lúc lưu; mỗi lần lưu tạo một phiên bản bất
             * biến kèm lý do (immutable revision row). */
            <span className="relative inline-flex items-center gap-3">
              <button
                className={buttonClass}
                disabled={action.busy || sealing}
                onClick={() => setRevising(true)}
              >
                Hiệu chỉnh điểm đã chốt
              </button>
              <MarginNote className="max-w-64">
                {"Điều chỉnh chính thức của quản trị — lưu lịch sử phiên bản kèm lý do; trạng thái vẫn \"Đã chốt\"."}
              </MarginNote>
            </span>
          )}
        </div>
      </div>
      <Panel
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles size={15} aria-hidden="true" />
            Gợi ý AI
          </span>
        }
      >
        <p className="mb-3 text-caption text-muted-foreground">
          Gợi ý không ghi vào điểm chính thức. Hãy kiểm tra chứng cứ và tự chấm
          điểm.
        </p>
        {/* CT-004: AI suggestions require ai.evaluation.assist (plus draft/submitted
            state enforced server-side). Hide the affordance instead of a surprise 403. */}
        <Can perm="ai.evaluation.assist">
          <button
            className={btn("secondary")}
            disabled={action.busy || (isInstructor && locked)}
            onClick={() =>
              void action.run(async () => {
                setSuggestion(await api.suggestEvaluation(e.id));
                setSuggestionHistoryVersion(version => version + 1);
              })
            }
          >
            <Sparkles
              size={15}
              animation="blink"
              animate={action.busy}
              loop
              aria-hidden="true"
            />
            {action.busy ? "Đang xử lý…" : "Yêu cầu gợi ý AI"}
          </button>
        </Can>
        {isInstructor && locked && (
          <p className="mt-3 text-caption leading-6 text-muted-foreground">
            Đánh giá đã chốt. Gợi ý AI mới không còn khả dụng cho kết quả này.
          </p>
        )}
        {suggestion && (
          <div className="mt-4 space-y-3 text-body">
            <p>
              <StampBadge
                className="text-[var(--stamp-red)]"
                rotate={-8}
              >
                AI ĐỀ XUẤT
              </StampBadge>
            </p>
            <p>{suggestion.summary}</p>
            {suggestion.criteria.map((c) => {
              const criterion = detail.criteria.find(
                (x) => x.code === c.criterionCode,
              );
              return (
              <article
                key={c.criterionCode}
                className="border-b border-border py-4"
              >
                <strong>
                  {criterion?.name ?? c.criterionCode}
                  : AI đề xuất {c.suggestedScore}
                </strong>
                {criterion && (
                  <AiScoreSparkBar
                    suggested={c.suggestedScore}
                    max={criterion.maxScore}
                  />
                )}
                <p className="mt-2">{c.comment}</p>
                <ul className="mt-2 list-inside list-disc text-caption">
                  {c.evidence.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </article>
              );
            })}
          </div>
        )}
        <SuggestionHistory key={`${e.id}-${suggestionHistoryVersion}`} evaluationId={e.id} criteria={detail.criteria} />
      </Panel>
      {revising && isAdmin && (
        <RevisionModal
          evaluation={e}
          criteria={detail.criteria}
          onClose={() => setRevising(false)}
          onRevised={reload}
        />
      )}
    </div>
  );
}

/**
 * Modal hiệu chỉnh chính thức trên đánh giá đã chốt (spec 14 — admin policy).
 * - Chỉ admin (BE xác minh lại role lúc lưu, FE chỉ điều hướng hiển thị).
 * - Gửi POST /evaluations/:id/revisions: scores điều chỉnh + summary + lý do
 *   bắt buộc; BE giữ trạng thái finalized, tăng revisionNumber và lưu hàng
 *   revision bất biến (điểm cũ/mới + lý do).
 */
function RevisionModal({
  evaluation,
  criteria,
  onClose,
  onRevised,
}: {
  evaluation: ReturnType<typeof api.parseManagedEvaluation> & {
    scores: { criterionId: string; score: number; comment: string | null }[];
  };
  criteria: ReturnType<typeof api.parseCriterion>[];
  onClose: () => void;
  onRevised: () => void;
}) {
  const action = useAction(),
    [scores, setScores] = useState<Record<string, { score: string; comment: string }>>(
      Object.fromEntries(
        criteria.map((c) => {
          const saved = evaluation.scores.find((s) => s.criterionId === c.id);
          return [c.id, { score: saved?.score.toString() ?? "", comment: saved?.comment ?? "" }];
        }),
      ),
    ),
    [summary, setSummary] = useState(evaluation.summary ?? ""),
    [reason, setReason] = useState(""),
    [result, setResult] = useState<Awaited<ReturnType<typeof api.reviseEvaluation>>>();
  const reasonInvalid = reason.trim().length === 0;
  const scoreInvalid = criteria.some((c) => {
    const raw = scores[c.id].score.replace(",", ".").trim();
    if (raw === "") return false;
    const value = Number(raw);
    return !Number.isFinite(value) || value < 0 || value > c.maxScore;
  });
  return (
    <Modal
      wide
      title="Hiệu chỉnh điểm đã chốt"
      description={
        <>
          Quyền quản trị · spec 14 — điều chỉnh chính thức trên đánh giá đã chốt.
          Mỗi lần lưu tạo một phiên bản bất biến kèm lý do; trạng thái vẫn{" "}
          <strong>Đã chốt</strong>.
        </>
      }
      onClose={onClose}
      footer={
        <>
          <button className={btn("secondary")} onClick={onClose} disabled={action.busy}>
            {result ? "Đóng" : "Hủy"}
          </button>
          <button
            className={buttonClass}
            disabled={action.busy || reasonInvalid || scoreInvalid}
            onClick={() =>
              void action
                .run(async () => {
                  const outcome = await api.reviseEvaluation(evaluation.id, {
                    scores: criteria
                      .filter((c) => scores[c.id].score !== "")
                      .map((c) => ({
                        criterionId: c.id,
                        score: Number(scores[c.id].score.replace(",", ".")),
                        comment: scores[c.id].comment || null,
                      })),
                    summary,
                    reason: reason.trim(),
                  });
                  setResult(outcome);
                  return outcome;
                })
                .then((ok) => {
                  if (ok) onRevised();
                })
            }
          >
            {action.busy ? "Đang lưu…" : "Lưu điều chỉnh"}
          </button>
        </>
      }
    >
      {Boolean(action.error) && (
        <span key={String(action.error)} className="animate-shake-ink block">
          <ErrorState error={action.error} />
        </span>
      )}
      {result ? (
        <div className="space-y-3" role="status">
          <div className="flex flex-wrap items-center gap-3">
            <StampMoc tone="red" size="sm" thump>
              ĐÃ HIỆU CHỈNH
            </StampMoc>
            <p className="font-bold">
              Điều chỉnh #{result.revision.revisionNumber}
            </p>
          </div>
          <p className="text-body">
            Điểm chính thức{" "}
            {result.revision.previousOverallScore ?? evaluation.overallScore} →{" "}
            <strong>{result.evaluation.overallScore ?? result.revision.newOverallScore}</strong>
          </p>
          <p className="text-caption text-muted-foreground">
            Lý do đã lưu vào lịch sử phiên bản: {result.revision.reason}
          </p>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <MarginNote>
            Điểm và nhận xét dưới đây là bản điều chỉnh — chỉ gửi những tiêu chí
            bạn thực sự thay đổi. Lý do hiệu chỉnh là bắt buộc (1–1000 ký tự).
          </MarginNote>
          {criteria.map((c) => {
            const saved = evaluation.scores.find((s) => s.criterionId === c.id);
            return (
              <fieldset key={c.id} className="border-b border-border pb-4 pt-3">
                <legend className="text-subsection font-semibold">{c.name}</legend>
                <p className="mt-1 text-caption text-muted-foreground">
                  Trọng số {c.weight}% · Điểm tối đa {c.maxScore}
                  {saved ? ` · Hiện tại ${saved.score}` : ""}
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,110px)_minmax(0,1fr)]">
                  <label className="block text-body">
                    Điểm {c.name}
                    <input
                      aria-label={`Điểm điều chỉnh ${c.name}`}
                      type="number"
                      min="0"
                      max={c.maxScore}
                      step="0.1"
                      disabled={action.busy || Boolean(result)}
                      className={`${inputClass} mt-1`}
                      value={scores[c.id].score}
                      onChange={(event) =>
                        setScores({
                          ...scores,
                          [c.id]: { ...scores[c.id], score: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="block text-body">
                    Nhận xét điều chỉnh {c.name}
                    <textarea
                      aria-label={`Nhận xét điều chỉnh ${c.name}`}
                      maxLength={2000}
                      disabled={action.busy || Boolean(result)}
                      className={`${inputClass} mt-1`}
                      rows={2}
                      value={scores[c.id].comment}
                      onChange={(event) =>
                        setScores({
                          ...scores,
                          [c.id]: { ...scores[c.id], comment: event.target.value },
                        })
                      }
                    />
                  </label>
                </div>
              </fieldset>
            );
          })}
          <label className="block text-caption font-semibold">
            Nhận xét tổng hợp điều chỉnh
            <textarea
              className={`${inputClass} mt-1`}
              rows={3}
              maxLength={4000}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>
          <label className="block text-caption font-semibold">
            Lý do hiệu chỉnh (bắt buộc — lưu vào lịch sử phiên bản)
            <textarea
              className={`${inputClass} mt-1`}
              rows={2}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-required="true"
            />
          </label>
          {(reasonInvalid || scoreInvalid) && (
            <p className="text-caption text-[var(--danger)]" role="alert">
              {scoreInvalid
                ? "Điểm điều chỉnh phải để trống (giữ nguyên) hoặc nằm trong 0…điểm tối đa."
                : "Cần nhập lý do hiệu chỉnh trước khi lưu."}
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}

/** Suggestion history rows; each expands into its fetched detail (advisory). */
function SuggestionHistory({
  evaluationId,
  criteria,
}: {
  evaluationId: string;
  criteria: ReturnType<typeof api.parseCriterion>[];
}) {
  const [openId, setOpenId] = useState<string>();
  return (
    <Can perm="ai.evaluation.assist">
      <SuggestionHistoryList
        evaluationId={evaluationId}
        criteria={criteria}
        openId={openId}
        onToggle={setOpenId}
      />
    </Can>
  );
}

function SuggestionHistoryList({
  evaluationId,
  criteria,
  openId,
  onToggle,
}: {
  evaluationId: string;
  criteria: ReturnType<typeof api.parseCriterion>[];
  openId?: string;
  onToggle: (id: string | undefined) => void;
}) {
  const history = useResource(
    useCallback(
      (s: AbortSignal) => api.listEvaluationSuggestions(evaluationId, s),
      [evaluationId],
    ),
  );
  return (
    <div className="mt-5">
      <h3 className="text-subsection font-semibold">Lịch sử gợi ý AI</h3>
      {history.loading ? (
        <LoadingState label="Đang tải lịch sử gợi ý..." />
      ) : history.error ? (
        /* Advisory panel: quiet inline error — never competes with the
           primary save/finalize alerts for the alert role. */
        <p className="mt-2 text-caption text-muted-foreground" role="status">
          Không tải được lịch sử gợi ý AI.{" "}
          <button
            type="button"
            className="rounded-control font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            onClick={history.reload}
          >
            Thử lại
          </button>
        </p>
      ) : !history.data || history.data.length === 0 ? (
        <p className="mt-2 text-caption text-muted-foreground">
          Chưa có gợi ý AI nào được lưu cho đánh giá này.
        </p>
      ) : (
        <ul className="ins-timeline notebook-scroll mt-3 max-h-96 overflow-y-auto pr-1 text-body">
          {history.data.map((row, index) => (
            <li
              key={row.id}
              data-current={index === 0 ? "true" : undefined}
              className="pb-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-caption text-muted-foreground">
                  {new Date(row.generatedAt).toLocaleString("vi-VN")} ·{" "}
                  {suggestionStatusLabels[row.status] ?? row.status}
                </span>
                <button
                  type="button"
                  className="min-h-9 rounded-control px-2 text-caption font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  aria-expanded={openId === row.id}
                  onClick={() =>
                    onToggle(openId === row.id ? undefined : row.id)
                  }
                >
                  {openId === row.id ? "Ẩn chi tiết" : "Chi tiết"}
                </button>
              </div>
              {openId === row.id && (
                <SuggestionDetail
                  evaluationId={evaluationId}
                  suggestionId={row.id}
                  criteria={criteria}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Fetches one suggestion detail and renders the full advisory payload. */
function SuggestionDetail({
  evaluationId,
  suggestionId,
  criteria,
}: {
  evaluationId: string;
  suggestionId: string;
  criteria: ReturnType<typeof api.parseCriterion>[];
}) {
  const suggestionDetail = useResource(
    useCallback(
      (s: AbortSignal) =>
        api.getEvaluationSuggestion(evaluationId, suggestionId, s),
      [evaluationId, suggestionId],
    ),
  );
  return (
    <div className="mt-3">
      {suggestionDetail.loading ? (
        <LoadingState label="Đang tải chi tiết gợi ý..." />
      ) : suggestionDetail.error ? (
        <ErrorState
          error={suggestionDetail.error}
          onRetry={suggestionDetail.reload}
        />
      ) : suggestionDetail.data ? (
        <div className="space-y-3 rounded-control bg-accent p-3 text-body">
          <p className="text-caption text-muted-foreground">
            Trạng thái:{" "}
            {suggestionStatusLabels[suggestionDetail.data.status] ??
              suggestionDetail.data.status}{" "}
            · Phiên bản prompt: {suggestionDetail.data.promptVersion}
            {suggestionDetail.data.aiRunId
              ? ` · Lượt chạy AI: ${suggestionDetail.data.aiRunId.slice(0, 8)}`
              : ""}
          </p>
          <p>{suggestionDetail.data.suggestion.summary}</p>
          {suggestionDetail.data.suggestion.strengths.length > 0 && (
            <div>
              <strong className="text-small">Điểm mạnh</strong>
              <ul className="mt-1 list-inside list-disc text-caption">
                {suggestionDetail.data.suggestion.strengths.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
          {suggestionDetail.data.suggestion.improvements.length > 0 && (
            <div>
              <strong className="marker-red text-small">Cần cải thiện</strong>
              <ul className="mt-1 list-inside list-disc text-caption">
                {suggestionDetail.data.suggestion.improvements.map(
                  (x, i) => (
                    <li key={i}>{x}</li>
                  ),
                )}
              </ul>
            </div>
          )}
          {suggestionDetail.data.suggestion.criteria.map((c) => {
            const criterion = criteria.find((x) => x.code === c.criterionCode);
            return (
            <article
              key={c.criterionCode}
              className="border-t border-border pt-2"
            >
              <strong>
                {criterion?.name ?? c.criterionCode}
                : AI đề xuất {c.suggestedScore}
              </strong>
              {criterion && (
                <AiScoreSparkBar
                  suggested={c.suggestedScore}
                  max={criterion.maxScore}
                />
              )}
              {c.comment && <p className="mt-1">{c.comment}</p>}
              {c.evidence.length > 0 && (
                <ul className="mt-1 list-inside list-disc text-caption">
                  {c.evidence.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              )}
            </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
