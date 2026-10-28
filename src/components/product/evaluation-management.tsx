"use client";
import { SessionSection as Panel } from "@/components/sessions/session-section";
import { usePathname } from "next/navigation";
import { InstructorPageTitle as PageTitle } from "@/components/instructor/instructor-page-title";
import { InstructorNotice } from "@/components/instructor/instructor-ui";
import { useCallback, useState } from "react";
import * as api from "@/lib/api/management";
import { PerformanceMemberPicker } from "./performance-member-picker";
import { useResource } from "@/lib/api/use-resource";
import { getSessionUser } from "@/lib/auth/session";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { AcademicPicker } from "./academic-picker";
import { useAction } from "./use-action";
import { Can } from "@/components/auth/can";
import { CollectionMetrics } from "./collection-insights";
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
            getSessionUser()?.id,
            s,
          ),
        [page, cycleId, status],
      ),
    );
  return (
    <>
      <PageTitle
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
                  className="mb-3 text-body text-primary"
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
                    <div className="mt-2 flex items-center justify-between">
                      <Badge>
                        {isInstructor ? evaluationLabels[c.status] : c.status}
                      </Badge>
                      <button
                        className="text-caption text-primary"
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
          <select
            aria-label="Trạng thái đánh giá"
            className={`${inputClass} mb-4`}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {["draft", "submitted", "finalized"].map((s) => (
              <option key={s} value={s}>
                {isInstructor
                  ? evaluationLabels[s as keyof typeof evaluationLabels]
                  : s}
              </option>
            ))}
          </select>
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
                        className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5"
                      >
                        <div>
                          <Badge>
                            {isInstructor
                              ? evaluationLabels[e.status]
                              : e.status}
                          </Badge>
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
      <p className="text-body text-muted-foreground">
        Kỳ mới sử dụng bộ tiêu chí chuẩn. Có thể chỉnh trọng số trước khi mở kỳ.
      </p>
      <button className={buttonClass} disabled={action.busy}>
        Lưu kỳ đánh giá
      </button>
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
          className="flex gap-2"
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
            onChanged={criteria.reload}
          />
        ))
      )}
      {cycle.status === "draft" && (
        <NewCriterion cycleId={cycle.id} onChanged={criteria.reload} />
      )}
      <div className="flex flex-wrap gap-2">
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
        <div className="mt-3 flex gap-2">
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
      <button className={buttonClass} disabled={action.busy}>
        Thêm tiêu chí
      </button>
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
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              const result = await api.createEvaluation(cycleId, internId);
              setOpen(false);
              onCreated(result.id);
            });
          }}
        >
          {Boolean(action.error) && <ErrorState error={action.error} />}{" "}
          <PerformanceMemberPicker
            label="Intern đánh giá"
            required
            value={internId}
            onChange={setInternId}
          />
          <button className={buttonClass} disabled={action.busy || !internId}>
            Tạo bản nháp
          </button>
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
  const action = useAction(),
    locked = e.status === "finalized";
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
  return (
    <div
      className={`${isInstructor ? "ins-score-editor " : ""}grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]`}
    >
      <div className="space-y-4">
        {Boolean(action.error) && <ErrorState error={action.error} />}
        <div className="flex flex-wrap gap-3">
          <Badge>{isInstructor ? evaluationLabels[e.status] : e.status}</Badge>
          <p className="font-bold">
            Điểm chính thức: {e.overallScore ?? "Chưa chấm"}
          </p>
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
          {detail.criteria.map((c) => (
            <fieldset key={c.id} className="border-b border-border pb-5 pt-3">
              <legend className="text-subsection font-semibold">{c.name}</legend>
              <p className="mt-1 text-caption text-muted-foreground">
                Trọng số {c.weight}% · Điểm tối đa {c.maxScore}
                {c.isRequired ? " · Bắt buộc" : ""}
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
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
          ))}
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
            <button className={buttonClass} disabled={action.busy}>
              Lưu điểm chính thức
            </button>
          )}
        </form>
        <div className="flex flex-wrap gap-2">
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
            <button
              className={buttonClass}
              disabled={action.busy || needsSave}
              onClick={() =>
                void action
                  .run(() => api.advanceEvaluation(e.id, "finalize"))
                  .then((ok) => {
                    if (ok) reload();
                  })
              }
            >
              Chốt đánh giá
            </button>
          )}
          {locked && (
            <p className="text-body text-muted-foreground">
              Đánh giá đã khóa. Hiệu chỉnh cần quyền quản trị và lưu lịch sử.
            </p>
          )}
        </div>
      </div>
      <Panel title="Gợi ý AI">
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
              void action.run(async () =>
                setSuggestion(await api.suggestEvaluation(e.id)),
              )
            }
          >
            Yêu cầu gợi ý AI
          </button>
        </Can>
        {isInstructor && locked && (
          <p className="mt-3 text-caption leading-6 text-muted-foreground">
            Đánh giá đã chốt. Gợi ý AI mới không còn khả dụng cho kết quả này.
          </p>
        )}
        {suggestion && (
          <div className="mt-4 space-y-3 text-body">
            <p>{suggestion.summary}</p>
            {suggestion.criteria.map((c) => (
              <article
                key={c.criterionCode}
                className="border-b border-border py-4"
              >
                <strong>
                  {detail.criteria.find((x) => x.code === c.criterionCode)
                    ?.name ?? c.criterionCode}
                  : AI đề xuất {c.suggestedScore}
                </strong>
                <p className="mt-2">{c.comment}</p>
                <ul className="mt-2 list-inside list-disc text-caption">
                  {c.evidence.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
