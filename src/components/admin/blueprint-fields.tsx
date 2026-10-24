"use client";
import { inputClass } from "@/components/product/primitives";

const lines = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string").join("\n")
    : "";
/** Edit the common teaching fields while preserving advanced blueprint metadata verbatim. */
export function BlueprintFields({
  text,
  onChange,
}: {
  text: string;
  onChange: (value: string) => void;
}) {
  let source: Record<string, unknown>;
  try {
    const raw: unknown = JSON.parse(text);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    source = raw as Record<string, unknown>;
  } catch {
    return (
      <p className="text-sm text-amber-800">
        Sửa JSON ở phần nâng cao để tiếp tục soạn bằng biểu mẫu. Nội dung chưa
        lưu được giữ nguyên.
      </p>
    );
  }
  const update = (key: string, value: unknown) =>
    onChange(JSON.stringify({ ...source, [key]: value }, null, 2));
  const collections = [
    ["techStack", "Công nghệ"],
    ["modules", "Chức năng chính"],
    ["roles", "Mã vai trò nghề nghiệp"],
    ["dod", "Điều kiện hoàn thành"],
    ["scopeIn", "Trong phạm vi"],
    ["scopeOut", "Ngoài phạm vi"],
  ] as const;
  return (
    <section className="space-y-4 border-t border-slate-200 pt-5">
      <div>
        <h3 className="font-semibold text-navy">Nội dung học tập</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Mỗi dòng là một mục. Mã nghề dùng catalog hiện tại; cấu trúc Sprint,
          task và phụ thuộc được giữ trong phần nâng cao.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {collections.map(([key, label]) => (
          <label key={key} className="text-sm">
            {label} · mỗi dòng một mục
            <textarea
              className={`${inputClass} mt-1`}
              rows={3}
              value={lines(source[key])}
              onChange={(event) => update(key, event.target.value.split("\n"))}
            />
          </label>
        ))}
      </div>
      <label className="block text-sm">
        Hướng dẫn dự án
        <textarea
          className={`${inputClass} mt-1`}
          rows={5}
          maxLength={12000}
          value={
            typeof source.documentation === "string" ? source.documentation : ""
          }
          onChange={(event) => update("documentation", event.target.value)}
        />
      </label>
    </section>
  );
}
