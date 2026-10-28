"use client";
import { inputClass } from "@/components/product/primitives";
import type {
  LearningPackage,
  PackageFile,
} from "@/lib/api/template-materials";
const initial: LearningPackage = {
  schemaVersion: 1,
  prerequisites: ["Node.js 22+"],
  setup: "",
  run: "",
  starterFiles: [{ path: "README.md", content: "" }],
  sampleData: [],
};
export function FileRows({
  title,
  files,
  max,
  onChange,
}: {
  title: string;
  files: PackageFile[];
  max: number;
  onChange: (files: PackageFile[]) => void;
}) {
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-3 text-body font-semibold text-foreground">
        {title} · {files.length}/{max}
      </legend>
      {files.map((file, index) => (
        <div
          key={index}
          className="min-w-0 space-y-2 border-l border-border pl-4"
        >
          <div className="flex gap-3">
            <label className="min-w-0 flex-1 text-caption text-muted-foreground">
              {title} · đường dẫn {index + 1}
              <input
                required
                maxLength={160}
                className={inputClass}
                value={file.path}
                placeholder="src/model.cjs"
                onChange={(event) =>
                  onChange(
                    files.map((value, i) =>
                      i === index
                        ? { ...value, path: event.target.value }
                        : value,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="self-end py-3 text-caption font-semibold text-destructive"
              onClick={() => onChange(files.filter((_, i) => i !== index))}
            >
              Xóa file {title.toLowerCase()} {index + 1}
            </button>
          </div>
          <label className="block text-caption text-muted-foreground">
            {title} · nội dung {index + 1}
            <textarea
              className={`${inputClass} mt-1 font-mono text-caption`}
              rows={5}
              maxLength={20000}
              spellCheck={false}
              value={file.content}
              onChange={(event) =>
                onChange(
                  files.map((value, i) =>
                    i === index
                      ? { ...value, content: event.target.value }
                      : value,
                  ),
                )
              }
            />
          </label>
        </div>
      ))}
      <button
        type="button"
        disabled={files.length >= max}
        className="text-body font-semibold text-primary disabled:opacity-40"
        onClick={() => onChange([...files, { path: "", content: "" }])}
      >
        + Thêm file {title.toLowerCase()}
      </button>
    </fieldset>
  );
}
export function PackageEditor({
  value,
  onChange,
}: {
  value: LearningPackage | null;
  onChange: (value: LearningPackage | null) => void;
}) {
  return (
    <section className="min-w-0 space-y-4 border-y border-border py-5">
      <label className="flex items-center gap-3 text-body font-semibold text-foreground">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(event) =>
            onChange(event.target.checked ? structuredClone(initial) : null)
          }
        />
        Đính kèm gói starter công khai
      </label>
      <p className="text-caption leading-5 text-muted-foreground">
        Chỉ đề bài, code khởi đầu và dữ liệu mẫu. Không đưa lời giải hoặc hidden
        tests vào phần này. Gói nhỏ cần 1 đến 2 Sprint, 3 đến 6 task có key và tổng 3 đến 7
        ngày.
      </p>
      {value && (
        <div className="min-w-0 space-y-5">
          <label className="block text-body">
            Kiến thức cần có · mỗi dòng một mục
            <textarea
              required
              className={`${inputClass} mt-1`}
              rows={3}
              value={value.prerequisites.join("\n")}
              onChange={(event) =>
                onChange({
                  ...value,
                  prerequisites: event.target.value.split("\n"),
                })
              }
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-body">
              Hướng dẫn chuẩn bị
              <textarea
                required
                className={`${inputClass} mt-1`}
                rows={5}
                maxLength={3000}
                value={value.setup}
                onChange={(event) =>
                  onChange({ ...value, setup: event.target.value })
                }
              />
            </label>
            <label className="text-body">
              Lệnh chạy và kết quả mong đợi
              <textarea
                required
                className={`${inputClass} mt-1`}
                rows={5}
                maxLength={3000}
                value={value.run}
                onChange={(event) =>
                  onChange({ ...value, run: event.target.value })
                }
              />
            </label>
          </div>
          <FileRows
            title="Starter"
            max={30}
            files={value.starterFiles}
            onChange={(starterFiles) => onChange({ ...value, starterFiles })}
          />
          <FileRows
            title="Dữ liệu mẫu"
            max={8}
            files={value.sampleData ?? []}
            onChange={(sampleData) => onChange({ ...value, sampleData })}
          />
        </div>
      )}
    </section>
  );
}
