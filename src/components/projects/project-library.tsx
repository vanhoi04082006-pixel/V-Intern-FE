"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import {
  Empty,
  PageTitle,
  Pager,
  inputClass,
} from "@/components/product/primitives";
import {
  IconArrowUpRight,
} from "@/components/v-intern/icons";
import { roleLabel } from "@/lib/api/workspace";
import { useResource } from "@/lib/api/use-resource";
import {
  listTemplates,
  type TemplateQuery,
  type TemplateSummary,
} from "@/lib/api/templates";

const difficultyLabels: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};
const categoryLabels: Record<string, string> = { "small-projects": "Dự án thực hành", "mini-projects": "Bài nhỏ, có starter", web: "Ứng dụng web", mobile: "Ứng dụng di động", data: "Dữ liệu" };

export function DifficultyBadge({ value }: { value: string }) {
  return (
    <span className="shrink-0 rounded bg-muted px-2 py-1 text-caption font-medium text-muted-foreground">
      {difficultyLabels[value] ?? value}
    </span>
  );
}

/**
 * Project Template Library (M2): server-side search/filter/sort/pagination.
 * `list` is injectable so tests never touch the network.
 */
export function ProjectLibrary({
  list = listTemplates,
}: {
  list?: (
    q: TemplateQuery,
    signal?: AbortSignal,
  ) => ReturnType<typeof listTemplates>;
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
        list(
          {
            page,
            pageSize: 9,
            search: debounced || undefined,
            category: category || undefined,
            difficulty: difficulty || undefined,
          },
          signal,
        ),
      [list, page, debounced, category, difficulty],
    ),
  );

  return (
    <div className="space-y-4">
      <PageTitle
        title="Thư viện dự án"
        subtitle="Chọn một mẫu dự án hoàn chỉnh để khởi tạo phiên thực tập"
      />
      <div className="workspace-filter-bar">
        <input
          aria-label="Tìm mẫu dự án"
          placeholder="Tìm theo mã hoặc tên..."
          className={`${inputClass} min-w-52 flex-1`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          aria-label="Lọc theo nhóm"
          placeholder="Nhóm dự án..."
          className={`${inputClass} sm:w-44`}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Lọc theo độ khó"
          className={`${inputClass} sm:w-48`}
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Mọi độ khó</option>
          <option value="beginner">Cơ bản</option>
          <option value="intermediate">Trung bình</option>
          <option value="advanced">Nâng cao</option>
        </select>
      </div>
      {data.loading ? (
        <p role="status" className="p-4 text-body text-muted-foreground">
          Đang tải thư viện...
        </p>
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : !data.data || data.data.items.length === 0 ? (
        <Empty>
          Chưa có mẫu dự án{debounced ? ` phù hợp với "${debounced}"` : ""}.
        </Empty>
      ) : (
        <>
          <ul className="workspace-project-grid">
            {data.data.items.map((t: TemplateSummary) => (
              <li key={t.id}>
                <article className="workspace-project-card">
                  <div className="workspace-project-cover" data-difficulty={t.difficulty}>
                    <span>{t.category ? categoryLabels[t.category] ?? t.category : "Dự án thực tập"}</span>
                  </div>
                  <header>
                    <h2>{t.name}</h2>
                    <DifficultyBadge value={t.difficulty} />
                  </header>
                  <p className="workspace-project-meta">
                    {t.code}, phiên bản {t.version}
                  </p>
                  <p className="workspace-project-stack">
                    {t.techStack.join(", ") || "Chưa có thông tin công nghệ"}
                  </p>
                  <p className="workspace-project-meta mb-5">
                    Vai trò: {t.roles.map(roleLabel).join(", ") || "—"}, Đội hình gợi ý:{" "}
                    {t.teamSize}, {t.sprintCount} sprint theo mẫu
                  </p>
                  <Link href={`/instructor/projects/${t.id}`}>
                    Xem chi tiết <IconArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
          <Pager
            page={data.data.page}
            totalPages={data.data.totalPages}
            total={data.data.total}
            onChange={(p: number) => setPage(p)}
          />
        </>
      )}
      <p className="text-caption text-muted-foreground">
        Dữ liệu thật từ thư viện mẫu (phiên bản được quản lý tập trung).
      </p>
    </div>
  );
}
