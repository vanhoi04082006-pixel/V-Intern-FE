"use client";
import { useState } from "react";
import {
  getAssessment,
  type TemplateAssessment,
} from "@/lib/api/template-materials";
import { ErrorState } from "@/components/shared/data-state";
import { inputClass } from "@/components/product/primitives";
import { FileRows } from "./package-editor";
export type AssessmentChange = {
  mode: "keep" | "clear" | "replace";
  text: string;
};
const empty: TemplateAssessment = {
  schemaVersion: 1,
  solutionFiles: [{ path: "", content: "" }],
  hiddenTestFiles: [{ path: "", content: "" }],
  rubric: [{ criterion: "", description: "", weight: 100 }],
  taskSuites: [{ taskKey: "", suiteId: "", digest: "" }],
};
function AssessmentFields({
  value,
  onChange,
}: {
  value: TemplateAssessment;
  onChange: (value: TemplateAssessment) => void;
}) {
  return (
    <div className="space-y-6">
      <FileRows
        title="Lời giải"
        files={value.solutionFiles}
        max={30}
        onChange={(solutionFiles) => onChange({ ...value, solutionFiles })}
      />
      <FileRows
        title="Kiểm thử riêng"
        files={value.hiddenTestFiles}
        max={30}
        onChange={(hiddenTestFiles) => onChange({ ...value, hiddenTestFiles })}
      />
      <fieldset className="space-y-4">
        <legend className="mb-3 text-body font-semibold">
          Tiêu chí chấm · tổng{" "}
          {value.rubric.reduce((sum, row) => sum + row.weight, 0)} / 100%
        </legend>
        {value.rubric.map((row, index) => (
          <div
            key={index}
            className="space-y-3 border-l border-warning/20 pl-4"
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
              <label className="text-body">
                Tiêu chí chấm {index + 1}
                <input
                  required
                  className={inputClass}
                  maxLength={128}
                  value={row.criterion}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      rubric: value.rubric.map((r, i) =>
                        i === index
                          ? { ...r, criterion: event.target.value }
                          : r,
                      ),
                    })
                  }
                />
              </label>
              <label className="text-body">
                Trọng số {index + 1} (%)
                <input
                  required
                  type="number"
                  min={1}
                  max={100}
                  className={inputClass}
                  value={row.weight}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      rubric: value.rubric.map((r, i) =>
                        i === index
                          ? { ...r, weight: Number(event.target.value) }
                          : r,
                      ),
                    })
                  }
                />
              </label>
            </div>
            <label className="block text-body">
              Mô tả chấm {index + 1}
              <textarea
                required
                className={inputClass}
                maxLength={1000}
                value={row.description}
                onChange={(event) =>
                  onChange({
                    ...value,
                    rubric: value.rubric.map((r, i) =>
                      i === index
                        ? { ...r, description: event.target.value }
                        : r,
                    ),
                  })
                }
              />
            </label>
            <button
              type="button"
              className="text-caption font-semibold text-destructive"
              onClick={() =>
                onChange({
                  ...value,
                  rubric: value.rubric.filter((_, i) => i !== index),
                })
              }
            >
              Xóa tiêu chí {index + 1}
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={value.rubric.length >= 20}
          className="text-body font-semibold text-warning"
          onClick={() =>
            onChange({
              ...value,
              rubric: [
                ...value.rubric,
                { criterion: "", description: "", weight: 1 },
              ],
            })
          }
        >
          + Thêm tiêu chí chấm
        </button>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="mb-3 text-body font-semibold">
          Nối nhiệm vụ với bộ kiểm thử
        </legend>
        <p className="text-caption leading-5 text-muted-foreground">
          Task key phải tồn tại trong blueprint. Digest SHA-256 do người quản lý
          bộ kiểm thử cung cấp; metadata này chưa cấp quyền chạy trusted runner.
        </p>
        {value.taskSuites.map((row, index) => (
          <div
            key={index}
            className="space-y-3 border-l border-warning/20 pl-4"
          >
            {(
              [
                ["taskKey", "Task key", 64],
                ["suiteId", "Mã bộ kiểm thử", 100],
                ["digest", "SHA-256 bộ kiểm thử", 64],
              ] as const
            ).map(([key, label, maxLength]) => (
              <label key={key} className="block text-body">
                {label} {index + 1}
                <input
                  required
                  className={`${inputClass} font-mono text-caption`}
                  maxLength={maxLength}
                  value={row[key]}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      taskSuites: value.taskSuites.map((r, i) =>
                        i === index ? { ...r, [key]: event.target.value } : r,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <button
              type="button"
              className="text-caption font-semibold text-destructive"
              onClick={() =>
                onChange({
                  ...value,
                  taskSuites: value.taskSuites.filter((_, i) => i !== index),
                })
              }
            >
              Xóa mapping {index + 1}
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={value.taskSuites.length >= 60}
          className="text-body font-semibold text-warning"
          onClick={() =>
            onChange({
              ...value,
              taskSuites: [
                ...value.taskSuites,
                { taskKey: "", suiteId: "", digest: "" },
              ],
            })
          }
        >
          + Thêm mapping nhiệm vụ
        </button>
      </fieldset>
    </div>
  );
}
export function AssessmentEditor({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: AssessmentChange;
  onChange: (value: AssessmentChange) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null);
  let material: TemplateAssessment | null = null;
  try {
    const raw = JSON.parse(value.text),
      rows: Record<string, string[]> = {
        solutionFiles: ["path", "content"],
        hiddenTestFiles: ["path", "content"],
        rubric: ["criterion", "description"],
        taskSuites: ["taskKey", "suiteId", "digest"],
      };
    if (
      raw?.schemaVersion === 1 &&
      Object.entries(rows).every(
        ([key, fields]) =>
          Array.isArray(raw[key]) &&
          raw[key].every(
            (row: unknown) =>
              !!row &&
              typeof row === "object" &&
              fields.every(
                (field) =>
                  typeof (row as Record<string, unknown>)[field] === "string",
              ),
          ),
      ) &&
      raw.rubric.every(
        (row: { weight: unknown }) =>
          typeof row.weight === "number" && Number.isFinite(row.weight),
      )
    )
      material = raw;
  } catch {
    /* Preserve incomplete advanced text. */
  }
  return (
    <section className="min-w-0 space-y-4 border-l border-warning/30 pl-4">
      <h3 className="font-semibold text-warning">Tài liệu chấm riêng</h3>
      <p className="text-caption leading-5 text-muted-foreground">
        Không nằm trong blueprint public hoặc ZIP starter. Thay đổi tạo phiên
        bản mới; phiên đang chạy giữ tài liệu đã ghim.
      </p>
      <label className="block text-body">
        Cách xử lý tài liệu chấm
        <select
          className={`${inputClass} mt-1`}
          value={value.mode}
          onChange={(event) =>
            onChange({
              mode: event.target.value as AssessmentChange["mode"],
              text: value.text || JSON.stringify(empty, null, 2),
            })
          }
        >
          <option value="keep">Giữ nguyên ở phiên bản mới</option>
          <option value="replace">Thay bằng nội dung bên dưới</option>
          <option value="clear">Bỏ ở phiên bản mới</option>
        </select>
      </label>
      {value.mode === "clear" && (
        <p className="text-body text-warning">
          Phiên bản mới sẽ không có tài liệu chấm. Lịch sử và các phiên cũ vẫn
          được giữ.
        </p>
      )}
      {value.mode === "replace" && (
        <>
          {id && (
            <button
              disabled={busy}
              type="button"
              className="text-body font-semibold text-warning underline underline-offset-4"
              onClick={() => {
                setBusy(true);
                setError(null);
                void getAssessment(id)
                  .then((result) =>
                    onChange({
                      mode: "replace",
                      text: JSON.stringify(result.assessment ?? empty, null, 2),
                    }),
                  )
                  .catch(setError)
                  .finally(() => setBusy(false));
              }}
            >
              {busy ? "Đang tải…" : "Tải nội dung chấm hiện tại"}
            </button>
          )}
          {material ? (
            <AssessmentFields
              value={material}
              onChange={(next) =>
                onChange({
                  mode: "replace",
                  text: JSON.stringify(next, null, 2),
                })
              }
            />
          ) : (
            <p role="alert" className="text-body text-warning">
              Cấu trúc JSON chưa đủ để mở biểu mẫu. Nội dung đang soạn được giữ
              nguyên ở phần nâng cao.
            </p>
          )}
          <details>
            <summary className="cursor-pointer text-body font-semibold text-muted-foreground">
              Nâng cao · JSON tài liệu chấm
            </summary>
            <label className="mt-3 block text-body">
              Assessment JSON riêng
              <textarea
                required
                className={`${inputClass} mt-1 font-mono text-caption`}
                rows={16}
                maxLength={300000}
                spellCheck={false}
                value={value.text}
                onChange={(event) =>
                  onChange({ ...value, text: event.target.value })
                }
              />
            </label>
          </details>
        </>
      )}
      {Boolean(error) && <ErrorState error={error} />}
    </section>
  );
}
