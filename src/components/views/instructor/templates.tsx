"use client";

import * as React from "react";
import { Boxes, FolderKanban, Layers, Rocket, Users } from "lucide-react";
import { templateApi, type TemplateSummary } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { navigate } from "@/lib/client/router";
import { ViewFrame, Stagger, StaggerItem } from "@/components/shared/view";
import {
  Panel,
  PageHeader,
  Empty,
  Pager,
  ToneBadge,
} from "@/components/shared/primitives";
import { FilterBar, SearchInput, FilterSelect } from "@/components/shared/toolbar";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { DifficultyBadge } from "./shared";

const PAGE_SIZE = 9;

const difficultyOptions = [
  { value: "beginner", label: "Sơ cấp" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "advanced", label: "Nâng cao" },
];

export function InstructorTemplates() {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("");
  const [page, setPage] = React.useState(1);

  // Nguồn lấy danh mục: một lần fetch toàn bộ (dự án mẫu ít).
  const all = useResource(() => templateApi.list({ page: 1, pageSize: 100 }), []);

  const categoryOptions = React.useMemo(() => {
    const set = new Set<string>((all.data?.data ?? []).map((t) => t.category).filter(Boolean));
    return Array.from(set).sort().map((c) => ({ value: c, label: c }));
  }, [all.data]);

  // Lọc + phân trang phía client từ danh sách đầy đủ (đơn giản, nhất quán).
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return (all.data?.data ?? []).filter((t) => {
      if (q && !`${t.name} ${t.code} ${t.description}`.toLowerCase().includes(q)) return false;
      if (category && t.category !== category) return false;
      if (difficulty && t.difficulty !== difficulty) return false;
      return true;
    });
  }, [all.data, search, category, difficulty]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [search, category, difficulty]);

  const hasFilter = Boolean(search || category || difficulty);

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Thư viện dự án"
        title="Dự án mẫu"
        description="Các dự án mẫu có blueprint đầy đủ vai trò, sprint, nhiệm vụ và cột mốc — khởi động buổi thực tập trong một phút."
      />

      <FilterBar
        onReset={() => {
          setSearch("");
          setCategory("");
          setDifficulty("");
        }}
        hasActive={hasFilter}
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tên, mã, mô tả…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={category}
          onChange={setCategory}
          options={categoryOptions}
          placeholder="Danh mục"
          className="w-40"
          ariaLabel="Lọc theo danh mục"
        />
        <FilterSelect
          value={difficulty}
          onChange={setDifficulty}
          options={difficultyOptions}
          placeholder="Độ khó"
          className="w-40"
          ariaLabel="Lọc theo độ khó"
        />
      </FilterBar>

      {all.loading ? (
        <LoadingBlock variant="cards" rows={6} />
      ) : all.error ? (
        <ErrorBlock error={all.error} onRetry={all.reload} />
      ) : pageItems.length === 0 ? (
        <Panel>
          <Empty
            icon={<FolderKanban />}
            title={hasFilter ? "Không có dự án mẫu khớp bộ lọc" : "Chưa có dự án mẫu nào"}
            description={
              hasFilter
                ? "Thử xóa bộ lọc hoặc đổi từ khóa tìm kiếm."
                : "Dự án mẫu sẽ xuất hiện ở đây khi quản trị viên thêm mới."
            }
            action={
              hasFilter ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                    setDifficulty("");
                  }}
                  className="h-9 rounded-lg border border-line px-4 text-sm font-medium text-dim transition-colors hover:border-line-strong hover:text-ink"
                >
                  Xóa bộ lọc
                </button>
              ) : undefined
            }
          />
        </Panel>
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((t) => (
            <StaggerItem key={t.id}>
              <TemplateCard template={t} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {filtered.length > PAGE_SIZE ? (
        <Panel className="mt-4">
          <Pager page={safePage} totalPages={totalPages} total={filtered.length} onChange={setPage} />
        </Panel>
      ) : null}
    </ViewFrame>
  );
}

function TemplateCard({ template }: { template: TemplateSummary }) {
  return (
    <Panel hoverable className="group flex h-full cursor-pointer flex-col p-5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/instructor/projects/${template.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/instructor/projects/${template.id}`);
          }
        }}
        className="flex min-h-0 flex-1 flex-col text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">
              {template.code}
            </div>
            <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-ink group-hover:text-brand-bright">
              {template.name}
            </h3>
          </div>
          <DifficultyBadge difficulty={template.difficulty} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ToneBadge tone="zinc">{template.category}</ToneBadge>
          <span className="inline-flex items-center gap-1 text-[11px] text-dim">
            <Users className="size-3 icon text-faint" />
            {template.teamSize.min}–{template.teamSize.max} người
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-dim">
            <Layers className="size-3 icon text-faint" />
            {template.sprintCount} sprint
          </span>
        </div>

        <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-dim">
          {template.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.techStack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-line bg-deep px-2 py-0.5 font-mono text-[10px] text-dim"
            >
              {tech}
            </span>
          ))}
          {template.techStack.length > 4 ? (
            <span className="rounded-md border border-line bg-deep px-2 py-0.5 font-mono text-[10px] text-faint">
              +{template.techStack.length - 4}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-faint">
            <Boxes className="size-3.5 icon" />
            {template.roles.length} vai trò
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-bright transition-transform group-hover:translate-x-0.5">
            Xem blueprint <Rocket className="size-3.5 icon" />
          </span>
        </div>
      </div>
    </Panel>
  );
}
