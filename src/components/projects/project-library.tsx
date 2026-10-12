"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { Empty, PageTitle, Pager, Panel, buttonClass, inputClass } from "@/components/product/primitives";
import { useResource } from "@/lib/api/use-resource";
import { listTemplates, type TemplateQuery, type TemplateSummary } from "@/lib/api/templates";

export function DifficultyBadge({ value }: { value: string }) {
  return <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{value}</span>;
}

/**
 * Project Template Library (M2): server-side search/filter/sort/pagination.
 * `list` is injectable so tests never touch the network.
 */
export function ProjectLibrary({
  list = listTemplates,
}: {
  list?: (q: TemplateQuery, signal?: AbortSignal) => ReturnType<typeof listTemplates>;
}) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const data = useResource(
    useCallback(
      (signal: AbortSignal) =>
        list({ page, pageSize: 9, search: debounced || undefined, category: category || undefined, difficulty: difficulty || undefined }, signal),
      [list, page, debounced, category, difficulty],
    ),
  );

  return (
    <div className="space-y-4">
      <PageTitle title="Thư viện dự án" subtitle="Chọn một project mẫu hoàn chỉnh để khởi tạo phiên thực tập" />
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="Tìm project mẫu"
          placeholder="Tìm theo mã hoặc tên..."
          className={`${inputClass} min-w-52 flex-1`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          aria-label="Lọc theo nhóm"
          placeholder="Nhóm (category)..."
          className={`${inputClass} w-44`}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        />
        <select
          aria-label="Lọc theo độ khó"
          className={inputClass}
          value={difficulty}
          onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
        >
          <option value="">Mọi độ khó</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      {data.loading ? (
        <p role="status" className="p-4 text-sm text-slate-500">Đang tải thư viện...</p>
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : !data.data || data.data.items.length === 0 ? (
        <Empty>Chưa có project mẫu{debounced ? ` phù hợp với "${debounced}"` : ""}.</Empty>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.data.items.map((t: TemplateSummary) => (
              <li key={t.id}>
                <Panel
                  title={t.name}
                  action={<DifficultyBadge value={t.difficulty} />}
                >
                  <p className="font-mono text-[11px] text-slate-400">{t.code} · v{t.version}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.techStack.slice(0, 5).map((tech) => (
                      <span key={tech} className="rounded bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">{tech}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Roles: {t.roles.join(", ") || "—"} · Đội hình gợi ý: {t.teamSize} · {t.sprintCount} sprints blueprint
                  </p>
                  <Link className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline" href={`/instructor/projects/${t.id}`}>
                    Xem chi tiết →
                  </Link>
                </Panel>
              </li>
            ))}
          </ul>
          <Pager page={data.data.page} totalPages={data.data.totalPages} total={data.data.total} unit="mẫu" onChange={setPage} />
        </>
      )}
      <p className="text-[11px] text-slate-400">Dữ liệu thật từ Project Library (phiên bản mẫu được quản lý tập trung).</p>
    </div>
  );
}
