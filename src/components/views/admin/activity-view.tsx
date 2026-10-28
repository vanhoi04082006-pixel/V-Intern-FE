"use client";

import * as React from "react";
import { Activity } from "lucide-react";
import { adminApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { relativeTime } from "@/lib/client/labels";
import {
  Empty,
  PageHeader,
  Pager,
  Panel,
  PanelHeader,
  UserAvatar,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import {
  ActionBadge,
  moduleMeta,
  ModuleIconBadge,
  useDebounced,
} from "./admin-shared";

const PAGE_SIZE = 8;

const MODULE_OPTIONS = Object.entries(moduleMeta).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export function AdminActivityView() {
  const [page, setPage] = React.useState(1);
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebounced(searchInput);
  const [module, setModule] = React.useState("");

  const list = useResource(
    () => adminApi.activityEvents({ page, pageSize: PAGE_SIZE, module, search }),
    [page, module, search]
  );
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const resetPage = () => setPage(1);

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Hoạt động"
        description="Dòng sự kiện thời gian thực trên toàn nền tảng: đăng nhập, phỏng vấn, task, đánh giá và hệ thống."
      />

      <FilterBar
        hasActive={Boolean(searchInput || module)}
        onReset={() => {
          setSearchInput("");
          setModule("");
          resetPage();
        }}
      >
        <FilterSelect
          value={module}
          onChange={(v) => {
            setModule(v);
            resetPage();
          }}
          options={MODULE_OPTIONS}
          placeholder="Module"
          ariaLabel="Lọc theo module"
          className="w-44"
        />
        <SearchInput
          value={searchInput}
          onChange={(v) => {
            setSearchInput(v);
            resetPage();
          }}
          placeholder="Tìm theo hành động, người thực hiện, nội dung…"
          className="w-full sm:w-80"
        />
      </FilterBar>

      {list.loading ? (
        <LoadingBlock rows={6} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<Activity className="icon" />}
            title="Không có sự kiện nào"
            description="Thử bỏ bộ lọc module hoặc đổi từ khóa tìm kiếm."
          />
        </div>
      ) : (
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Dòng sự kiện"
            description={meta ? `${meta.total} sự kiện · trang ${meta.page}/${meta.totalPages}` : undefined}
            icon={<Activity className="icon" />}
          />
          <ul className="divide-y divide-line">
            {rows.map((event) => (
              <li key={event.id} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-panel-2/60">
                <ModuleIconBadge module={event.module} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <UserAvatar name={event.actorName} size={22} />
                    <span className="text-sm font-medium text-ink">{event.actorName}</span>
                    <ActionBadge action={event.action} />
                    <ToneModuleTag module={event.module} />
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-dim">{event.summary}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11px] text-faint">
                  {relativeTime(event.at)}
                </span>
              </li>
            ))}
          </ul>
          {meta && rows.length > 0 ? (
            <Pager page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
          ) : null}
        </Panel>
      )}
    </ViewFrame>
  );
}

function ToneModuleTag({ module }: { module: string }) {
  const meta = moduleMeta[module];
  if (!meta) return null;
  return <span className="text-[11px] font-medium text-faint">· {meta.label}</span>;
}
