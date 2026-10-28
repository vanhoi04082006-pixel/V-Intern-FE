"use client";

import * as React from "react";
import { KanbanSquare, ListChecks, SearchX } from "lucide-react";
import { navigate } from "@/lib/client/router";
import { useResource } from "@/lib/client/use-resource";
import { priorityLabels, taskStatusLabels } from "@/lib/client/labels";
import type { PageData } from "@/lib/client/http";
import { taskApi, type Task, type TaskStatus } from "@/lib/client/api";
import { ViewFrame } from "@/components/shared/view";
import {
  Empty,
  PageHeader,
  Panel,
  Pager,
} from "@/components/shared/primitives";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/badges";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DueDate, MiniProgress, useDebouncedValue } from "../shared";
import { InternTaskKanban, useKanbanMove } from "./kanban";

const STATUS_OPTIONS = (Object.keys(taskStatusLabels) as TaskStatus[]).map((v) => ({
  value: v,
  label: taskStatusLabels[v],
}));

const PRIORITY_OPTIONS = (Object.keys(priorityLabels) as string[]).map((v) => ({
  value: v,
  label: priorityLabels[v],
}));

/** /intern/work — danh sách + kanban công việc của tôi. */
export function WorkView() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority]);

  const list = useResource<PageData<Task>>(
    () =>
      taskApi.list({
        mine: true,
        page,
        pageSize: 10,
        status,
        priority,
        search: debouncedSearch,
        sortBy: "dueDate",
        sortOrder: "asc",
      }),
    [page, status, priority, debouncedSearch]
  );

  const board = useResource<PageData<Task>>(
    () => taskApi.list({ mine: true, pageSize: 100, sortBy: "dueDate", sortOrder: "asc" }),
    []
  );

  const moveTask = useKanbanMove({
    getTask: (id) => board.data?.data.find((t) => t.id === id),
    optimisticMove: (id, to) =>
      board.setData((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((t) => (t.id === id ? { ...t, status: to } : t)),
            }
          : prev
      ),
    reload: board.reload,
  });

  const hasFilter = Boolean(search || status || priority);
  const tasks = list.data?.data ?? [];
  const meta = list.data?.meta;
  const boardTasks = board.data?.data ?? [];

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Không gian làm việc"
        title="Công việc của tôi"
        description="Theo dõi nhiệm vụ được giao theo danh sách hoặc bảng kanban — kéo thả để chuyển trạng thái Cần làm → Đang làm → Chờ duyệt."
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">
            <ListChecks className="size-4" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <KanbanSquare className="size-4" />
            Kanban
          </TabsTrigger>
        </TabsList>

        {/* ------------------------- Tab Danh sách ------------------------- */}
        <TabsContent value="list" className="mt-4">
          <FilterBar
            hasActive={hasFilter}
            onReset={() => {
              setSearch("");
              setStatus("");
              setPriority("");
            }}
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo mã hoặc tiêu đề nhiệm vụ…"
              className="min-w-[220px] flex-1"
            />
            <FilterSelect
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              placeholder="Trạng thái"
              ariaLabel="Lọc theo trạng thái"
              className="w-[150px]"
            />
            <FilterSelect
              value={priority}
              onChange={setPriority}
              options={PRIORITY_OPTIONS}
              placeholder="Ưu tiên"
              ariaLabel="Lọc theo ưu tiên"
              className="w-[150px]"
            />
          </FilterBar>

          {list.loading && !list.data ? (
            <LoadingBlock rows={6} />
          ) : list.error && !list.data ? (
            <ErrorBlock error={list.error} onRetry={list.reload} />
          ) : tasks.length === 0 ? (
            <Panel>
              <Empty
                icon={<SearchX className="size-5 icon" />}
                title={hasFilter ? "Không có nhiệm vụ khớp bộ lọc" : "Chưa có nhiệm vụ nào"}
                description={
                  hasFilter
                    ? "Thử đổi từ khóa hoặc xóa bộ lọc để xem toàn bộ nhiệm vụ của bạn."
                    : "Khi giảng viên giao việc, nhiệm vụ sẽ xuất hiện tại đây."
                }
                action={
                  hasFilter ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        setStatus("");
                        setPriority("");
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  ) : undefined
                }
              />
            </Panel>
          ) : (
            <Panel className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wide text-faint">
                      <th className="px-4 py-3">Mã</th>
                      <th className="px-4 py-3">Nhiệm vụ</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Ưu tiên</th>
                      <th className="px-4 py-3">Tiến độ</th>
                      <th className="px-4 py-3">Hạn chót</th>
                      <th className="px-4 py-3">Sprint</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tasks.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/intern/work/${t.id}`)}
                        className="cursor-pointer transition-colors hover:bg-panel-2"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-brand-bright/80">
                          {t.code}
                        </td>
                        <td className="max-w-[320px] px-4 py-3">
                          <p className="truncate font-medium text-ink" title={t.title}>
                            {t.title}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <TaskStatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <MiniProgress value={t.progress} />
                        </td>
                        <td className="px-4 py-3 text-xs text-dim">
                          <DueDate task={t} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-dim">
                          {t.sprintCode ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta ? (
                <Pager page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
              ) : null}
            </Panel>
          )}
        </TabsContent>

        {/* ------------------------- Tab Kanban ------------------------- */}
        <TabsContent value="kanban" className="mt-4">
          {board.loading && !board.data ? (
            <LoadingBlock
              variant="cards"
              rows={8}
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 [&>div]:rounded-2xl"
            />
          ) : board.error && !board.data ? (
            <ErrorBlock error={board.error} onRetry={board.reload} />
          ) : boardTasks.length === 0 ? (
            <Panel>
              <Empty
                icon={<KanbanSquare className="size-5 icon" />}
                title="Chưa có nhiệm vụ để hiển thị"
                description="Khi giảng viên giao việc, nhiệm vụ sẽ xuất hiện trên bảng kanban này."
              />
            </Panel>
          ) : (
            <InternTaskKanban tasks={boardTasks} onMove={moveTask} />
          )}
        </TabsContent>
      </Tabs>
    </ViewFrame>
  );
}
