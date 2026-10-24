"use client";
import { useState } from "react";
import {
  saveTemplateDefinition,
  type TemplateDetail,
} from "@/lib/api/templates";
import { ErrorState } from "@/components/shared/data-state";
import { buttonClass, inputClass } from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { Can } from "@/components/auth/can";
import {
  parseLearningPackage,
  parseTemplateAssessment,
  type LearningPackage,
  type TemplateAssessment,
} from "@/lib/api/template-materials";
import { PackageEditor } from "./package-editor";
import { AssessmentEditor, type AssessmentChange } from "./assessment-editor";
import { BlueprintFields } from "./blueprint-fields";
export function TemplateEditor({
  source,
  copy = false,
  onSaved,
}: {
  source?: TemplateDetail;
  copy?: boolean;
  onSaved: () => void;
}) {
  const existing = source && !copy ? source : undefined;
  const [name, setName] = useState(
    copy ? `${source?.name ?? ""} — bản mới` : (source?.name ?? ""),
  );
  const [code, setCode] = useState(
    copy
      ? `${source?.code ?? "TPL"}-COPY-${crypto.randomUUID().slice(0, 6)}`
      : (source?.code ?? ""),
  );
  const [description, setDescription] = useState(
    typeof source?.definition.description === "string"
      ? source.definition.description
      : "",
  );
  const [text, setText] = useState(
    JSON.stringify(
      source?.definition ?? {
        name: "",
        description: "",
        difficulty: "beginner",
        category: "small-projects",
        roles: ["frontend"],
        roleDetails: [{ code: "frontend", countMin: 1, countMax: 1 }],
        techStack: ["React", "TypeScript"],
        modules: [],
        sprints: [],
        dod: [],
        rubricVersion: "task-review-v1",
        scenarios: [],
        documentation: "",
      },
      null,
      2,
    ),
  );
  const action = useAction();
  const [packageValue, setPackageValue] = useState<LearningPackage | null>(() =>
    parseLearningPackage(source?.definition.learningPackage),
  );
  const [assessment, setAssessment] = useState<AssessmentChange>({
    mode: "keep",
    text: "",
  });
  const [validation, setValidation] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setValidation(null);
        let raw: unknown;
        try {
          raw = JSON.parse(text);
        } catch {
          setValidation(
            "Blueprint JSON chưa hợp lệ. Kiểm tra dấu ngoặc, dấu phẩy và dấu ngoặc kép.",
          );
          return;
        }
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
          setValidation("Blueprint phải là một JSON object.");
          return;
        }
        const definition: Record<string, unknown> = {
          ...raw,
          name: name.trim(),
          code: code.trim(),
          description: description.trim(),
        };
        if (
          "assessment" in definition ||
          "solutionFiles" in definition ||
          "hiddenTestFiles" in definition
        ) {
          setValidation(
            "Tài liệu chấm phải nhập ở khu vực riêng, không đặt trong blueprint public.",
          );
          return;
        }
        let privateMaterial: TemplateAssessment | null | undefined;
        try {
          if (packageValue)
            definition.learningPackage = parseLearningPackage(packageValue);
          else delete definition.learningPackage;
          if (assessment.mode === "clear") privateMaterial = null;
          if (assessment.mode === "replace")
            privateMaterial = parseTemplateAssessment(
              JSON.parse(assessment.text),
            );
        } catch {
          setValidation(
            "Gói starter hoặc tài liệu chấm chưa đúng cấu trúc. Kiểm đường dẫn, nội dung file, rubric tổng 100 và task mapping.",
          );
          return;
        }
        void action.run(async () => {
          if (privateMaterial === undefined)
            await saveTemplateDefinition(definition, existing);
          else
            await saveTemplateDefinition(definition, existing, privateMaterial);
          onSaved();
        });
      }}
    >
      <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
        Sửa mẫu tạo phiên bản mới cho phiên tương lai. Các phiên đã khởi tạo giữ
        blueprint đã chụp. Có thể nhân bản một trong sáu mẫu đầy đủ rồi chỉnh
        nội dung phù hợp.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Tên mẫu
          <input
            className={inputClass}
            required
            minLength={2}
            maxLength={256}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Mã mẫu
          <input
            className={inputClass}
            required
            maxLength={64}
            disabled={Boolean(existing)}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
      </div>
      <label className="block text-sm">
        Mô tả
        <textarea
          className={inputClass}
          rows={3}
          required
          minLength={10}
          maxLength={4000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <BlueprintFields text={text} onChange={setText} />
      <details className="border-y border-slate-200 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">
          Nâng cao · Sprint, task và cấu trúc blueprint
        </summary>
        <label className="mt-4 block text-sm">
          Blueprint JSON đầy đủ
          <textarea
            className={`${inputClass} mt-1 font-mono text-xs`}
            rows={20}
            required
            maxLength={180000}
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
      </details>
      <PackageEditor value={packageValue} onChange={setPackageValue} />
      <Can perm="templates.assessment.manage">
        <AssessmentEditor
          id={existing?.id}
          value={assessment}
          onChange={setAssessment}
        />
      </Can>
      <p className="text-xs text-slate-500">
        Tên, mã và mô tả ở trên áp dụng khi lưu. Blueprint chứa role,
        requirements, architecture, sprint/task, dependencies và milestone.
        Backend kiểm tra schema và đồ thị trước khi lưu. Không nhập secret hoặc
        dữ liệu cá nhân thật.
      </p>
      {validation && (
        <p role="alert" className="text-sm text-rose-700">
          {validation}
        </p>
      )}
      {Boolean(action.error) && (
        <ErrorState title="Không thể lưu thay đổi" error={action.error} />
      )}
      <button className={buttonClass} disabled={action.busy}>
        {action.busy
          ? "Đang lưu…"
          : existing
            ? "Lưu phiên bản mới"
            : "Tạo project template"}
      </button>
    </form>
  );
}
