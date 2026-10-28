"use client";

import * as React from "react";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  FileText,
  History,
  ListChecks,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  knowledgeApi,
  type KnowledgeAudience,
  type KnowledgeDocDetail,
  type KnowledgeKind,
  type KnowledgePurpose,
  type KnowledgeRevision,
  type KnowledgeSource,
  type KnowledgeStatus,
} from "@/lib/client/api-org";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { formatDateTime, relativeTime } from "@/lib/client/labels";
import {
  Empty,
  KeyValue,
  PageHeader,
  Pager,
  Panel,
  PanelHeader,
  ToneBadge,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import {
  AdminDialog,
  BrandButton,
  Field,
  FormInput,
  FormSelect,
  FormTextarea,
  LineButton,
  useToastAction,
} from "./admin-shared";

/* ============================ nhãn dùng chung ============================ */

export const knowledgeKindLabels: Record<KnowledgeKind, string> = {
  qa: "Hỏi–đáp",
  guide: "Hướng dẫn",
  exercise: "Bài tập",
  solution: "Đáp án",
  rubric: "Rubric",
  plan_template: "Mẫu kế hoạch",
  communication: "Truyền thông",
};

const knowledgeKindTones: Record<KnowledgeKind, "teal" | "brand" | "amber" | "emerald" | "violet" | "orange" | "zinc"> = {
  qa: "teal",
  guide: "brand",
  exercise: "amber",
  solution: "emerald",
  rubric: "violet",
  plan_template: "orange",
  communication: "zinc",
};

export const knowledgeStatusMeta: Record<KnowledgeStatus, { label: string; tone: "amber" | "brand" | "zinc" }> = {
  draft: { label: "Bản nháp", tone: "amber" },
  published: { label: "Đã xuất bản", tone: "brand" },
  archived: { label: "Đã lưu trữ", tone: "zinc" },
};

export const knowledgeAudienceLabels: Record<KnowledgeAudience, string> = {
  student_safe: "Toàn sinh viên",
  staff_only: "Chỉ nhân sự",
  grading_only: "Chỉ chấm điểm",
};

export const knowledgePurposeLabels: Record<KnowledgePurpose, string> = {
  interview_question: "Câu phỏng vấn",
  code_review: "Review code",
  plan_generation: "Sinh kế hoạch",
  career_advice: "Tư vấn nghề",
  exercise_grading: "Chấm bài tập",
  cv_analysis: "Phân tích CV",
  session_summary: "Tổng hợp phiên",
  mentor_chat: "Chat mentor",
  onboarding_guide: "HD nhập môn",
};

export const KNOWLEDGE_KIND_OPTIONS = (Object.keys(knowledgeKindLabels) as KnowledgeKind[]).map((k) => ({
  value: k,
  label: knowledgeKindLabels[k],
}));

export const KNOWLEDGE_AUDIENCE_OPTIONS = (Object.keys(knowledgeAudienceLabels) as KnowledgeAudience[]).map((k) => ({
  value: k,
  label: knowledgeAudienceLabels[k],
}));

export const KNOWLEDGE_PURPOSE_OPTIONS = (Object.keys(knowledgePurposeLabels) as KnowledgePurpose[]).map((k) => ({
  value: k,
  label: knowledgePurposeLabels[k],
}));

export function KnowledgeKindBadge({ kind }: { kind: KnowledgeKind }) {
  return <ToneBadge tone={knowledgeKindTones[kind] ?? "zinc"}>{knowledgeKindLabels[kind] ?? kind}</ToneBadge>;
}

/* ============================ đọc body an toàn ============================ */

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function asRowArray<T>(v: unknown, keys: string[]): T[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map((row) => {
      const out: Record<string, string> = {};
      keys.forEach((k) => {
        out[k] = typeof row[k] === "string" ? (row[k] as string) : "";
      });
      return out as T;
    });
}

/* ============================ editors nhỏ ============================ */

function ChipsEditor({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = React.useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setInput("");
  };
  return (
    <Field label={label} hint={hint ?? "Nhập rồi nhấn Enter để thêm."}>
      <div className="space-y-2">
        {value.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {value.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1 rounded-md border border-line bg-deep/70 px-2 py-0.5 text-xs text-dim"
              >
                {chip}
                <button
                  type="button"
                  className="text-faint transition-colors hover:text-rose"
                  onClick={() => onChange(value.filter((c) => c !== chip))}
                  aria-label={`Xóa ${chip}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <FormInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "Nhập mục mới…"}
        />
      </div>
    </Field>
  );
}

interface RowFieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number";
  placeholder?: string;
  mono?: boolean;
}

function RowsEditor({
  label,
  hint,
  rows,
  fields,
  makeRow,
  onChange,
  addLabel = "Thêm dòng",
}: {
  label: string;
  hint?: string;
  rows: Record<string, string>[];
  fields: RowFieldDef[];
  makeRow: () => Record<string, string>;
  onChange: (rows: Record<string, string>[]) => void;
  addLabel?: string;
}) {
  const update = (idx: number, key: string, value: string) => {
    const next = [...rows];
    next[idx] = { ...next[idx], [key]: value };
    onChange(next);
  };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-dim">{label}</span>
        <LineButton type="button" size="sm" onClick={() => onChange([...rows, makeRow()])}>
          <Plus className="size-3.5 icon" /> {addLabel}
        </LineButton>
      </div>
      {hint ? <p className="mb-2 text-xs text-faint">{hint}</p> : null}
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-xs text-faint">
            Chưa có dòng nào — bấm “{addLabel}” để bắt đầu.
          </p>
        ) : null}
        {rows.map((row, idx) => (
          <div key={idx} className="space-y-2 rounded-xl border border-line bg-deep/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-semibold text-faint">#{idx + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg text-dim hover:bg-panel-2 hover:text-rose"
                onClick={() => onChange(rows.filter((_, i) => i !== idx))}
                aria-label={`Xóa dòng ${idx + 1}`}
              >
                <Trash2 className="size-3.5 icon" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
                  <span className="mb-1 block text-[11px] font-medium text-faint">{f.label}</span>
                  {f.type === "textarea" ? (
                    <FormTextarea
                      value={row[f.key] ?? ""}
                      onChange={(e) => update(idx, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="min-h-16"
                    />
                  ) : (
                    <FormInput
                      type={f.type === "number" ? "number" : "text"}
                      value={row[f.key] ?? ""}
                      onChange={(e) => update(idx, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className={f.mono ? "font-mono" : undefined}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ body editor theo kind ============================ */

function QaBodyEditor({ body, onChange }: { body: Record<string, unknown>; onChange: (b: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <ChipsEditor
        label="Ý chính kỳ vọng (intendedKeyPoints)"
        value={asStringArray(body.intendedKeyPoints)}
        onChange={(v) => onChange({ ...body, intendedKeyPoints: v })}
        placeholder="vd: useState trả về cặp [state, setState]"
      />
      <Field label="Hướng tiếp cận đúng (correctApproaches)" hint="Mỗi dòng một hướng tiếp cận.">
        <FormTextarea
          value={asStringArray(body.correctApproaches).join("\n")}
          onChange={(e) => onChange({ ...body, correctApproaches: e.target.value.split("\n").filter((l) => l.trim()) })}
          className="min-h-28"
        />
      </Field>
      <Field label="Ví dụ minh họa (illustration)">
        <FormTextarea
          value={typeof body.illustration === "string" ? body.illustration : ""}
          onChange={(e) => onChange({ ...body, illustration: e.target.value })}
          className="min-h-28 font-mono text-xs"
          placeholder="Code sample minh họa câu trả lời đúng…"
        />
      </Field>
      <ChipsEditor
        label="Lỗi thường gặp (commonErrors)"
        value={asStringArray(body.commonErrors)}
        onChange={(v) => onChange({ ...body, commonErrors: v })}
        placeholder="vd: Mutate state trực tiếp"
      />
      <ChipsEditor
        label="Câu hỏi nâng cao (followUpQuestions)"
        value={asStringArray(body.followUpQuestions)}
        onChange={(v) => onChange({ ...body, followUpQuestions: v })}
        placeholder="vd: Khi nào dùng useReducer?"
      />
      <Field label="Ví dụ trả lời yếu (weakExample)">
        <FormTextarea
          value={typeof body.weakExample === "string" ? body.weakExample : ""}
          onChange={(e) => onChange({ ...body, weakExample: e.target.value })}
          className="min-h-20"
        />
      </Field>
      <RowsEditor
        label="Rubric chấm điểm"
        rows={asRowArray<{ criterion: string; excellent: string; passing: string }>(body.rubric, ["criterion", "excellent", "passing"])}
        makeRow={() => ({ criterion: "", excellent: "", passing: "" })}
        onChange={(v) => onChange({ ...body, rubric: v })}
        fields={[
          { key: "criterion", label: "Tên tiêu chí", placeholder: "Định nghĩa chính xác" },
          { key: "excellent", label: "Mức xuất sắc", type: "textarea", placeholder: "Mô tả mức xuất sắc" },
          { key: "passing", label: "Mức đạt", type: "textarea", placeholder: "Mô tả mức đạt tối thiểu" },
        ]}
      />
    </div>
  );
}

function GuideBodyEditor({ body, onChange }: { body: Record<string, unknown>; onChange: (b: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Tổng quan (overview)">
        <FormTextarea
          value={typeof body.overview === "string" ? body.overview : ""}
          onChange={(e) => onChange({ ...body, overview: e.target.value })}
          className="min-h-24"
        />
      </Field>
      <RowsEditor
        label="Các phần hướng dẫn (sections)"
        rows={asRowArray<{ title: string; content: string }>(body.sections, ["title", "content"])}
        makeRow={() => ({ title: "", content: "" })}
        onChange={(v) => onChange({ ...body, sections: v })}
        fields={[
          { key: "title", label: "Tiêu đề phần", placeholder: "1. Tạo nhánh" },
          { key: "content", label: "Nội dung", type: "textarea", placeholder: "Nội dung chi tiết của phần…" },
        ]}
      />
      <ChipsEditor
        label="Checklist (checklist)"
        value={asStringArray(body.checklist)}
        onChange={(v) => onChange({ ...body, checklist: v })}
        placeholder="vd: Lint + test pass local"
      />
    </div>
  );
}

function ExerciseBodyEditor({ body, onChange }: { body: Record<string, unknown>; onChange: (b: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Đề bài (prompt)">
        <FormTextarea
          value={typeof body.prompt === "string" ? body.prompt : ""}
          onChange={(e) => onChange({ ...body, prompt: e.target.value })}
          className="min-h-24"
        />
      </Field>
      <Field label="Yêu cầu (requirements)" hint="Mỗi dòng một yêu cầu.">
        <FormTextarea
          value={asStringArray(body.requirements).join("\n")}
          onChange={(e) => onChange({ ...body, requirements: e.target.value.split("\n").filter((l) => l.trim()) })}
          className="min-h-24"
        />
      </Field>
      <ChipsEditor
        label="Gợi ý (hints)"
        value={asStringArray(body.hints)}
        onChange={(v) => onChange({ ...body, hints: v })}
        placeholder="vd: Dùng vòng lặp for + await"
      />
      <Field label="Kết quả mong đợi (expectedOutcome)">
        <FormTextarea
          value={typeof body.expectedOutcome === "string" ? body.expectedOutcome : ""}
          onChange={(e) => onChange({ ...body, expectedOutcome: e.target.value })}
          className="min-h-20"
        />
      </Field>
    </div>
  );
}

function SolutionBodyEditor({ body, onChange }: { body: Record<string, unknown>; onChange: (b: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <RowsEditor
        label="Các bước giải (steps)"
        rows={asRowArray<{ title: string; detail: string }>(body.steps, ["title", "detail"])}
        makeRow={() => ({ title: "", detail: "" })}
        onChange={(v) => onChange({ ...body, steps: v })}
        fields={[
          { key: "title", label: "Bước", placeholder: "Bước 1 — Phân tích đề" },
          { key: "detail", label: "Chi tiết", type: "textarea", placeholder: "Cách làm / code tham khảo…" },
        ]}
      />
      <ChipsEditor
        label="Lưu ý (notes)"
        value={asStringArray(body.notes)}
        onChange={(v) => onChange({ ...body, notes: v })}
        placeholder="vd: Chú ý xử lý edge case mảng rỗng"
      />
    </div>
  );
}

function RubricBodyEditor({ body, onChange }: { body: Record<string, unknown>; onChange: (b: Record<string, unknown>) => void }) {
  const rows = asRowArray<{
    code: string;
    label: string;
    weight: string;
    excellent: string;
    good: string;
    passing: string;
    failing: string;
  }>(body.criteria, ["code", "label", "weight", "excellent", "good", "passing", "failing"]);
  const totalWeight = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0);
  return (
    <div className="space-y-3">
      <RowsEditor
        label="Tiêu chí (criteria)"
        rows={rows}
        makeRow={() => ({ code: "", label: "", weight: "0", excellent: "", good: "", passing: "", failing: "" })}
        onChange={(v) =>
          onChange({
            ...body,
            criteria: v.map((r) => ({
              code: r.code,
              label: r.label,
              weight: Number(r.weight) || 0,
              levels: { excellent: r.excellent, good: r.good, passing: r.passing, failing: r.failing },
            })),
          })
        }
        fields={[
          { key: "code", label: "Mã", placeholder: "FUNCTIONAL", mono: true },
          { key: "label", label: "Tên tiêu chí", placeholder: "Tính năng đúng yêu cầu" },
          { key: "weight", label: "Trọng số (0–1)", type: "number", placeholder: "0.25", mono: true },
          { key: "excellent", label: "Xuất sắc", placeholder: "Mô tả mức xuất sắc" },
          { key: "good", label: "Tốt", placeholder: "Mô tả mức tốt" },
          { key: "passing", label: "Đạt", placeholder: "Mô tả mức đạt" },
          { key: "failing", label: "Không đạt", placeholder: "Mô tả mức không đạt" },
        ]}
      />
      <p className={`font-mono text-xs font-semibold ${Math.abs(totalWeight - 1) < 0.001 ? "text-emerald" : "text-amber"}`}>
        Tổng trọng số: {(Math.round(totalWeight * 100) / 100).toFixed(2)} (chuẩn: 1.00)
      </p>
    </div>
  );
}

function PlanTemplateBodyEditor({ body, onChange }: { body: Record<string, unknown>; onChange: (b: Record<string, unknown>) => void }) {
  const sections = asRowArray<{ key: string; title: string; fields: string }>(body.sections, ["key", "title", "fields"]);
  return (
    <div className="space-y-4">
      <RowsEditor
        label="Các section của template"
        hint="fields: danh sách tên field cách nhau bởi dấu phẩy."
        rows={sections}
        makeRow={() => ({ key: "", title: "", fields: "" })}
        onChange={(v) =>
          onChange({
            ...body,
            sections: v.map((r) => ({
              key: r.key,
              title: r.title,
              fields: r.fields.split(",").map((f) => f.trim()).filter(Boolean),
            })),
          })
        }
        fields={[
          { key: "key", label: "Khóa", placeholder: "goal", mono: true },
          { key: "title", label: "Tiêu đề", placeholder: "Mục tiêu sprint" },
          { key: "fields", label: "Fields (phẩy ngăn cách)", placeholder: "goal, successCriteria", mono: true },
        ]}
      />
      <Field label="Cách dùng (usage)">
        <FormTextarea
          value={typeof body.usage === "string" ? body.usage : ""}
          onChange={(e) => onChange({ ...body, usage: e.target.value })}
          className="min-h-20"
        />
      </Field>
    </div>
  );
}

function CommunicationBodyEditor({ body, onChange }: { body: Record<string, unknown>; onChange: (b: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Tình huống (scenario)">
        <FormTextarea
          value={typeof body.scenario === "string" ? body.scenario : ""}
          onChange={(e) => onChange({ ...body, scenario: e.target.value })}
          className="min-h-20"
        />
      </Field>
      <RowsEditor
        label="Kịch bản hội thoại (script)"
        rows={asRowArray<{ speaker: string; line: string }>(body.script, ["speaker", "line"])}
        makeRow={() => ({ speaker: "mentor", line: "" })}
        onChange={(v) => onChange({ ...body, script: v })}
        addLabel="Thêm câu thoại"
        fields={[
          { key: "speaker", label: "Người nói", placeholder: "mentor / intern", mono: true },
          { key: "line", label: "Lời thoại", type: "textarea", placeholder: "Câu thoại…" },
        ]}
      />
      <ChipsEditor
        label="Mẹo giao tiếp (tips)"
        value={asStringArray(body.tips)}
        onChange={(v) => onChange({ ...body, tips: v })}
        placeholder="vd: Mở đầu bằng câu hỏi, không trách móc"
      />
    </div>
  );
}

function BodyEditor({
  kind,
  body,
  onChange,
}: {
  kind: KnowledgeKind;
  body: Record<string, unknown>;
  onChange: (b: Record<string, unknown>) => void;
}) {
  switch (kind) {
    case "qa":
      return <QaBodyEditor body={body} onChange={onChange} />;
    case "guide":
      return <GuideBodyEditor body={body} onChange={onChange} />;
    case "exercise":
      return <ExerciseBodyEditor body={body} onChange={onChange} />;
    case "solution":
      return <SolutionBodyEditor body={body} onChange={onChange} />;
    case "rubric":
      return <RubricBodyEditor body={body} onChange={onChange} />;
    case "plan_template":
      return <PlanTemplateBodyEditor body={body} onChange={onChange} />;
    case "communication":
      return <CommunicationBodyEditor body={body} onChange={onChange} />;
    default:
      return null;
  }
}

/* ============================ editor chính ============================ */

export function AdminKnowledgeEditor({ code, onBack }: { code: string; onBack: () => void }) {
  const detail = useResource(() => knowledgeApi.detail(code), [code]);

  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [kind, setKind] = React.useState<KnowledgeKind>("qa");
  const [audience, setAudience] = React.useState<KnowledgeAudience>("student_safe");
  const [purpose, setPurpose] = React.useState<KnowledgePurpose>("interview_question");
  const [roleCode, setRoleCode] = React.useState("");
  const [body, setBody] = React.useState<Record<string, unknown>>({});
  const [sources, setSources] = React.useState<KnowledgeSource[]>([]);
  const [baseline, setBaseline] = React.useState("");
  const [kindConfirm, setKindConfirm] = React.useState<KnowledgeKind | null>(null);
  const [checkOpen, setCheckOpen] = React.useState(false);
  const [canPublish, setCanPublish] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  const doc: KnowledgeDocDetail | null = detail.data;

  const syncFromDoc = React.useCallback((d: KnowledgeDocDetail) => {
    setTitle(d.title);
    setSummary(d.summary);
    setKind(d.kind);
    setAudience(d.audience);
    setPurpose(d.purpose);
    setRoleCode(d.roleCode ?? "");
    setBody(d.body ?? {});
    setSources(d.sources ?? []);
    setBaseline(
      JSON.stringify({
        title: d.title,
        summary: d.summary,
        kind: d.kind,
        audience: d.audience,
        purpose: d.purpose,
        roleCode: d.roleCode ?? "",
        body: d.body ?? {},
        sources: d.sources ?? [],
      })
    );
  }, []);

  React.useEffect(() => {
    if (doc) syncFromDoc(doc);
  }, [doc, syncFromDoc]);

  const dirty = React.useMemo(() => {
    if (!doc) return false;
    return (
      baseline !==
      JSON.stringify({ title, summary, kind, audience, purpose, roleCode, body, sources })
    );
  }, [baseline, title, summary, kind, audience, purpose, roleCode, body, sources, doc]);

  const saveAction = useToastAction(() => undefined);
  const lifecycleAction = useToastAction(() => detail.reload());

  const guardBack = () => {
    if (dirty && !window.confirm("Bạn có thay đổi chưa lưu. Về danh sách và bỏ các thay đổi?")) {
      return;
    }
    onBack();
  };

  const save = () => {
    if (!doc) return;
    if (!title.trim() || !summary.trim()) {
      toast.error("Tiêu đề và tóm tắt không được để trống.");
      return;
    }
    saveAction.run(async () => {
      try {
        const updated = await knowledgeApi.update(code, {
          title: title.trim(),
          summary: summary.trim(),
          kind,
          audience,
          purpose,
          roleCode: roleCode || null,
          body,
          sources,
          note: "Cập nhật từ trình soạn thảo",
          expectedVersion: doc.version,
        });
        toast.success(`Đã lưu — tài liệu trở thành bản nháp v${updated.version}.`);
        detail.reload();
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          toast.error("Tài liệu vừa được người khác cập nhật — đang tải lại bản mới nhất.");
          detail.reload();
          return;
        }
        throw err;
      }
    });
  };

  const openCheck = () => {
    setCanPublish(false);
    setCheckOpen(true);
  };

  const publish = () => {
    if (!doc) return;
    lifecycleAction.run(async () => {
      try {
        await knowledgeApi.publish(code, doc.version);
        toast.success("Tài liệu đã được xuất bản cho Agent sử dụng.");
        setCheckOpen(false);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          toast.error("Dữ liệu vừa được cập nhật — đang tải lại.");
          detail.reload();
          return;
        }
        throw err;
      }
    });
  };

  const archive = () => {
    if (!doc) return;
    lifecycleAction.run(async () => {
      try {
        await knowledgeApi.archive(code, doc.version);
        toast.success("Tài liệu đã được lưu trữ.");
        setArchiveOpen(false);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          toast.error("Dữ liệu vừa được cập nhật — đang tải lại.");
          detail.reload();
          return;
        }
        throw err;
      }
    });
  };

  if (detail.loading && !doc) {
    return (
      <ViewFrame>
        <LoadingBlock variant="detail" rows={8} />
      </ViewFrame>
    );
  }
  if (detail.error || !doc) {
    return (
      <ViewFrame>
        <ErrorBlock error={detail.error ?? new Error("Không tìm thấy tài liệu")} onRetry={detail.reload} />
        <div className="mt-4 text-center">
          <LineButton onClick={onBack}>
            <ArrowLeft className="size-4 icon" /> Về kho tri thức
          </LineButton>
        </div>
      </ViewFrame>
    );
  }

  const navItems = [
    { id: "info", label: "Thông tin" },
    { id: "body", label: "Nội dung" },
    { id: "sources", label: "Nguồn" },
    { id: "scope", label: "Phạm vi" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(`ke-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <ViewFrame>
      <button
        type="button"
        onClick={guardBack}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5 icon" /> Về kho tri thức
      </button>

      <PageHeader
        eyebrow={doc.code}
        title={doc.title || "Tài liệu chưa đặt tiêu đề"}
        description={doc.summary}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <KnowledgeKindBadge kind={doc.kind} />
            <ToneBadge tone={knowledgeStatusMeta[doc.status]?.tone ?? "zinc"} dot>
              {knowledgeStatusMeta[doc.status]?.label ?? doc.status}
            </ToneBadge>
            <span className="font-mono text-xs text-faint">v{doc.version}</span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
        {/* Nav trái sticky */}
        <nav className="hidden lg:block">
          <div className="sticky top-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className="w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium text-dim transition-colors hover:bg-panel-2 hover:text-ink"
              >
                {item.label}
              </button>
            ))}
            <div className="mt-4 rounded-xl border border-line bg-deep/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Đối tượng</p>
              <p className="mt-1 text-xs text-ink">{knowledgeAudienceLabels[doc.audience]}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Mục đích</p>
              <p className="mt-1 text-xs text-ink">{knowledgePurposeLabels[doc.purpose]}</p>
              {doc.roleCode ? (
                <>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Vai trò</p>
                  <p className="mt-1 font-mono text-xs text-ink">{doc.roleCode}</p>
                </>
              ) : null}
            </div>
          </div>
        </nav>

        {/* Form phải */}
        <div className="min-w-0 space-y-6 pb-24">
          {/* 1. Thông tin */}
          <span id="ke-info" className="block scroll-mt-24" aria-hidden />
          <Panel>
            <PanelHeader
              title="Thông tin"
              description="Mã, tiêu đề, loại và phân loại của tài liệu."
              icon={<FileText className="size-4 icon" />}
            />
            <div className="space-y-4 px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mã tài liệu" hint="Không thể đổi sau khi tạo.">
                  <FormInput value={doc.code} disabled className="font-mono" />
                </Field>
                <Field label="Tiêu đề">
                  <FormInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề tài liệu…" />
                </Field>
                <Field label="Loại tài liệu" hint="Đổi loại sẽ cần nhập lại nội dung theo cấu trúc mới.">
                  <FormSelect value={kind} onChange={(v) => setKindConfirm(v as KnowledgeKind)} options={KNOWLEDGE_KIND_OPTIONS} ariaLabel="Chọn loại tài liệu" />
                </Field>
                <Field label="Đối tượng người đọc">
                  <FormSelect value={audience} onChange={(v) => setAudience(v as KnowledgeAudience)} options={KNOWLEDGE_AUDIENCE_OPTIONS} ariaLabel="Chọn đối tượng" />
                </Field>
                <Field label="Mục đích sử dụng">
                  <FormSelect value={purpose} onChange={(v) => setPurpose(v as KnowledgePurpose)} options={KNOWLEDGE_PURPOSE_OPTIONS} ariaLabel="Chọn mục đích" />
                </Field>
                <Field label="Vai trò liên quan" hint="Bỏ trống nếu áp dụng cho mọi vai trò.">
                  <FormInput
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    placeholder="vd: frontend"
                    className="font-mono"
                  />
                </Field>
              </div>
              <Field label="Tóm tắt">
                <FormTextarea value={summary} onChange={(e) => setSummary(e.target.value)} className="min-h-20" placeholder="Tóm tắt nội dung tài liệu…" />
              </Field>
            </div>
          </Panel>

          {/* 2. Nội dung */}
          <span id="ke-body" className="block scroll-mt-24" aria-hidden />
          <Panel>
            <PanelHeader
              title={`Nội dung — ${knowledgeKindLabels[kind]}`}
              description="Cấu trúc nội dung thay đổi theo loại tài liệu."
              icon={<ListChecks className="size-4 icon" />}
            />
            <div className="px-5 py-5">
              <BodyEditor kind={kind} body={body} onChange={setBody} />
            </div>
          </Panel>

          {/* 3. Nguồn */}
          <span id="ke-sources" className="block scroll-mt-24" aria-hidden />
          <Panel>
            <PanelHeader
              title="Nguồn tham khảo"
              description="Ít nhất một nguồn hợp lệ mới có thể xuất bản."
              icon={<ShieldCheck className="size-4 icon" />}
              actions={
                <LineButton size="sm" onClick={() => setSources([...sources, { name: "", url: "" }])}>
                  <Plus className="size-3.5 icon" /> Thêm nguồn
                </LineButton>
              }
            />
            <div className="space-y-2 px-5 py-5">
              {sources.length === 0 ? (
                <Empty icon={<ShieldCheck className="icon" />} title="Chưa có nguồn tham khảo" description="Thêm ít nhất một nguồn để đủ điều kiện xuất bản." />
              ) : (
                sources.map((src, idx) => (
                  <div key={idx} className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-deep/60 p-3">
                    <div className="min-w-40 flex-1">
                      <span className="mb-1 block text-[11px] font-medium text-faint">Tên nguồn</span>
                      <FormInput
                        value={src.name}
                        onChange={(e) => {
                          const next = [...sources];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setSources(next);
                        }}
                        placeholder="React Docs — useState"
                      />
                    </div>
                    <div className="min-w-48 flex-[2]">
                      <span className="mb-1 block text-[11px] font-medium text-faint">URL</span>
                      <FormInput
                        value={src.url}
                        onChange={(e) => {
                          const next = [...sources];
                          next[idx] = { ...next[idx], url: e.target.value };
                          setSources(next);
                        }}
                        placeholder="https://…"
                        className="font-mono text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-lg text-dim hover:bg-panel-2 hover:text-rose"
                      onClick={() => setSources(sources.filter((_, i) => i !== idx))}
                      aria-label={`Xóa nguồn ${idx + 1}`}
                    >
                      <Trash2 className="size-3.5 icon" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Panel>

          {/* 4. Phạm vi */}
          <span id="ke-scope" className="block scroll-mt-24" aria-hidden />
          <Panel>
            <PanelHeader
              title="Phạm vi & vòng đời"
              description="Trạng thái hiện tại và các mốc thời gian của tài liệu."
              icon={<Archive className="size-4 icon" />}
            />
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
              <KeyValue label="Trạng thái">
                <ToneBadge tone={knowledgeStatusMeta[doc.status]?.tone ?? "zinc"} dot>
                  {knowledgeStatusMeta[doc.status]?.label ?? doc.status}
                </ToneBadge>
              </KeyValue>
              <KeyValue label="Phiên bản">
                <span className="font-mono">v{doc.version}</span>
              </KeyValue>
              <KeyValue label="Số bản lưu">
                <span className="font-mono">{doc.revisionCount}</span>
              </KeyValue>
              <KeyValue label="Ngày tạo">{formatDateTime(doc.createdAt)}</KeyValue>
              <KeyValue label="Ngày xuất bản">{doc.publishedAt ? formatDateTime(doc.publishedAt) : "—"}</KeyValue>
              <KeyValue label="Ngày lưu trữ">{doc.archivedAt ? formatDateTime(doc.archivedAt) : "—"}</KeyValue>
            </div>
          </Panel>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 px-4 py-3 backdrop-blur lg:pl-[264px]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${dirty ? "text-amber" : "text-faint"}`}>
            {dirty ? "● Có thay đổi chưa lưu" : "Đã đồng bộ"}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <LineButton onClick={guardBack} disabled={saveAction.busy}>
              <ArrowLeft className="size-4 icon" /> Thoát
            </LineButton>
            <LineButton onClick={() => setHistoryOpen(true)}>
              <History className="size-4 icon" /> Lịch sử
            </LineButton>
            {doc.status !== "archived" ? (
              <LineButton onClick={() => setArchiveOpen(true)} className="hover:text-rose">
                <Archive className="size-4 icon" /> Lưu trữ
              </LineButton>
            ) : null}
            <LineButton onClick={openCheck} disabled={doc.status === "archived"}>
              <ShieldCheck className="size-4 icon" /> Kiểm tra xuất bản
            </LineButton>
            <BrandButton onClick={save} disabled={saveAction.busy || doc.status === "archived"}>
              {saveAction.busy ? <InlineSpinner className="size-4" /> : <Save className="size-4 icon" />} Lưu
            </BrandButton>
          </div>
        </div>
      </div>

      {/* Dialog đổi kind */}
      <ConfirmDialog
        open={Boolean(kindConfirm)}
        onOpenChange={(o) => !o && setKindConfirm(null)}
        title={`Đổi loại tài liệu sang “${kindConfirm ? knowledgeKindLabels[kindConfirm] : ""}”?`}
        description="Cấu trúc nội dung khác nhau giữa các loại — trường cũ không khớp có thể không hiển thị đúng. Bạn có thể hoàn tác bằng Lịch sử phiên bản."
        confirmLabel="Đổi loại"
        onConfirm={() => {
          if (kindConfirm) setKind(kindConfirm);
          setKindConfirm(null);
        }}
      />

      {/* Dialog kiểm tra xuất bản */}
      <AdminDialog
        open={checkOpen}
        onOpenChange={(o) => !lifecycleAction.busy && setCheckOpen(o)}
        title="Kiểm tra điều kiện xuất bản"
        description="Tài liệu cần đạt toàn bộ checklist trước khi xuất bản cho Agent."
        footer={
          <>
            <LineButton onClick={() => setCheckOpen(false)} disabled={lifecycleAction.busy}>
              Đóng
            </LineButton>
            <BrandButton onClick={publish} disabled={!canPublish || lifecycleAction.busy || doc.status !== "draft"}>
              {lifecycleAction.busy ? <InlineSpinner className="size-4" /> : <ShieldCheck className="size-4 icon" />}
              Xuất bản
            </BrandButton>
          </>
        }
      >
        <ul className="space-y-2">
          <PublicationChecks code={code} onResult={setCanPublish} />
        </ul>
      </AdminDialog>

      {/* Dialog lịch sử */}
      <HistoryDialog code={code} currentVersion={doc.version} open={historyOpen} onOpenChange={setHistoryOpen} />

      {/* Dialog lưu trữ */}
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={(o) => !lifecycleAction.busy && !o && setArchiveOpen(false)}
        title="Lưu trữ tài liệu?"
        description="Tài liệu đã lưu trữ không xuất hiện cho Agent và không thể chỉnh sửa cho đến khi khôi phục từ phiên bản cũ."
        confirmLabel="Lưu trữ"
        destructive
        busy={lifecycleAction.busy}
        onConfirm={archive}
      />
    </ViewFrame>
  );
}

/* ============================ checklist xuất bản ============================ */

function PublicationChecks({
  code,
  onResult,
}: {
  code: string;
  onResult: (canPublish: boolean) => void;
}) {
  const check = useResource(() => knowledgeApi.publicationCheck(code), [code]);
  React.useEffect(() => {
    if (check.data) onResult(check.data.canPublish);
  }, [check.data, onResult]);

  if (check.loading) return <LoadingBlock rows={3} />;
  if (check.error) return <ErrorBlock error={check.error} onRetry={check.reload} />;

  return (
    <>
      {check.data?.checks.map((c) => (
        <li
          key={c.id}
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed ${
            c.passed
              ? "border-emerald-500/25 bg-emerald-500/[0.07] text-ink"
              : "border-rose-500/25 bg-rose-500/[0.07] text-ink"
          }`}
        >
          {c.passed ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 icon text-emerald" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0 icon text-rose" />
          )}
          <span>
            {c.label}
            <span className={`ml-2 text-[11px] font-semibold ${c.passed ? "text-emerald" : "text-rose"}`}>
              {c.passed ? "Đạt" : "Chưa đạt"}
            </span>
          </span>
        </li>
      ))}
      {check.data?.canPublish ? (
        <li className="flex items-center gap-2 px-1 text-xs font-medium text-emerald">
          <CheckCircle2 className="size-4 icon" /> Tài liệu đủ điều kiện xuất bản.
        </li>
      ) : (
        <li className="flex items-center gap-2 px-1 text-xs font-medium text-amber">
          <XCircle className="size-4 icon" /> Chưa đủ điều kiện — sửa các mục chưa đạt rồi lưu lại.
        </li>
      )}
    </>
  );
}

/* ============================ dialog lịch sử + khôi phục ============================ */

function HistoryDialog({
  code,
  currentVersion,
  open,
  onOpenChange,
}: {
  code: string;
  currentVersion: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [page, setPage] = React.useState(1);
  const revisions = useResource(
    () => (open ? knowledgeApi.revisions(code, { page, pageSize: 5 }) : Promise.resolve(null)),
    [open, code, page]
  );
  const restoreAction = useToastAction(() => revisions.reload());
  const [restoring, setRestoring] = React.useState<KnowledgeRevision | null>(null);

  React.useEffect(() => {
    if (open) setPage(1);
  }, [open]);

  const restore = () => {
    if (!restoring) return;
    restoreAction.run(async () => {
      try {
        const res = await knowledgeApi.restore(code, currentVersion, restoring.version);
        toast.success(`Đã khôi phục phiên bản ${restoring.version} thành bản nháp v${res.version}.`);
        setRestoring(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          toast.error("Tài liệu vừa được cập nhật — đang tải lại.");
          revisions.reload();
          return;
        }
        throw err;
      }
    });
  };

  const rows = revisions.data?.data ?? [];

  return (
    <>
      <AdminDialog
        open={open}
        onOpenChange={(o) => !restoreAction.busy && onOpenChange(o)}
        title="Lịch sử phiên bản"
        description="Mỗi lần lưu tạo một snapshot. Khôi phục sẽ tạo bản nháp mới từ snapshot cũ."
        maxWidth="max-w-2xl"
        footer={<LineButton onClick={() => onOpenChange(false)}>Đóng</LineButton>}
      >
        {revisions.loading ? (
          <LoadingBlock rows={3} />
        ) : revisions.error ? (
          <ErrorBlock error={revisions.error} onRetry={revisions.reload} />
        ) : rows.length === 0 ? (
          <Empty icon={<History className="icon" />} title="Chưa có phiên bản nào" />
        ) : (
          <div className="space-y-2">
            {rows.map((rev) => (
              <div key={rev.id} className="rounded-xl border border-line bg-deep/60 p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-bright">v{rev.version}</span>
                  <ToneBadge tone={rev.snapshot.status === "published" ? "brand" : rev.snapshot.status === "archived" ? "zinc" : "amber"}>
                    {knowledgeStatusMeta[rev.snapshot.status]?.label ?? rev.snapshot.status}
                  </ToneBadge>
                  <span className="text-[11px] text-faint">
                    {rev.editedBy} · {relativeTime(rev.at)}
                  </span>
                  <LineButton size="sm" className="ml-auto" onClick={() => setRestoring(rev)}>
                    <RotateCcw className="size-3.5 icon" /> Khôi phục thành bản nháp
                  </LineButton>
                </div>
                <p className="mt-1.5 text-[13px] text-ink">{rev.note}</p>
                <p className="mt-0.5 text-[11px] text-faint">{rev.snapshot.title}</p>
              </div>
            ))}
            {revisions.data && revisions.data.meta.totalPages > 1 ? (
              <Pager
                page={revisions.data.meta.page}
                totalPages={revisions.data.meta.totalPages}
                total={revisions.data.meta.total}
                onChange={setPage}
              />
            ) : null}
          </div>
        )}
      </AdminDialog>

      <ConfirmDialog
        open={Boolean(restoring)}
        onOpenChange={(o) => !restoreAction.busy && !o && setRestoring(null)}
        title={restoring ? `Khôi phục từ phiên bản v${restoring.version}?` : ""}
        description="Nội dung hiện tại sẽ được thay bằng snapshot của phiên bản đã chọn và tạo thành bản nháp mới."
        confirmLabel="Khôi phục"
        busy={restoreAction.busy}
        onConfirm={restore}
      />
    </>
  );
}
