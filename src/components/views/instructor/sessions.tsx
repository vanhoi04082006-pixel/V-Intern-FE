"use client";

import * as React from "react";
import { AlertTriangle, CalendarDays, Clock3, Presentation, Rocket, Users } from "lucide-react";
import { sessionApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import { navigate } from "@/lib/client/router";
import { ViewFrame, Stagger, StaggerItem } from "@/components/shared/view";
import {
  Panel,
  PageHeader,
  Empty,
  Pager,
  AnimatedProgressBar,
  ToneBadge,
} from "@/components/shared/primitives";
import { SessionStatusBadge } from "@/components/shared/badges";
import { FilterBar, SearchInput, FilterSelect } from "@/components/shared/toolbar";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { useDebounced } from "./shared";

const PAGE_SIZE = 8;

const statusOptions = [
  { value: "planning", label: "Đang chuẩn bị" },
  { value: "active", label: "Đang diễn ra" },
  { value: "completed", label: "Đã kết thúc" },
  { value: "cancelled", label: "Đã hủy" },
];

const sortByOptions = [
  { value: "startDate", label: "Sắp xếp: ngày bắt đầu" },
  { value: "endDate", label: "Sắp xếp: ngày kết thúc" },
  { value: "name", label: "Sắp xếp: tên" },
  { value: "progress", label: "Sắp xếp: tiến độ" },
];

export function InstructorSessions() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sortBy, setSortBy] = React.useState("startDate");
  const [page, setPage] = React.useState(1);
  const debouncedQ = useDebounced(q);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedQ, status, sortBy]);

  const sessions = useResource(
    () =>
      sessionApi.overview({
        q: debouncedQ || undefined,
        status: status || undefined,
        sortBy,
        sortDirection: "desc",
        page,
        pageSize: PAGE_SIZE,
      }),
    [debouncedQ, status, sortBy, page]
  );

  const hasFilter = Boolean(debouncedQ || status);

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Lớp học"
        title="Buổi thực tập"
        description="Theo dõi mọi buổi thực tập: trạng thái, tiến độ nhiệm vụ, cảnh báo trễ hạn và bài nộp chờ duyệt."
      />

      <FilterBar
        onReset={() => {
          setQ("");
          setStatus("");
          setSortBy("startDate");
        }}
        hasActive={hasFilter || sortBy !== "startDate"}
      >
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Tìm theo mã, tên, dự án…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={statusOptions}
          placeholder="Trạng thái"
          className="w-44"
          ariaLabel="Lọc theo trạng thái"
        />
        <FilterSelect
          value={sortBy}
          onChange={setSortBy}
          options={sortByOptions}
          allLabel="Sắp xếp: ngày bắt đầu"
          placeholder="Sắp xếp"
          className="w-56"
          ariaLabel="Sắp xếp danh sách"
        />
      </FilterBar>

      {sessions.loading ? (
        <LoadingBlock variant="cards" rows={4} />
      ) : sessions.error ? (
        <ErrorBlock error={sessions.error} onRetry={sessions.reload} />
      ) : (sessions.data?.data ?? []).length === 0 ? (
        <Panel>
          <Empty
            icon={<Presentation />}
            title={hasFilter ? "Không có buổi thực tập khớp bộ lọc" : "Chưa có buổi thực tập nào"}
            description={
              hasFilter
                ? "Thử xóa bộ lọc hoặc đổi từ khóa tìm kiếm."
                : "Khởi động buổi thực tập đầu tiên từ một dự án mẫu."
            }
            action={
              <button
                type="button"
                onClick={() => navigate("/instructor/projects")}
                className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.98]"
              >
                Chọn dự án mẫu
              </button>
            }
          />
        </Panel>
      ) : (
        <Stagger className="grid gap-4 xl:grid-cols-2">
          {(sessions.data?.data ?? []).map((s) => (
            <StaggerItem key={s.id}>
              <Panel hoverable className="group h-full cursor-pointer p-5">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/instructor/sessions/${s.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/instructor/sessions/${s.id}`);
                    }
                  }}
                  className="flex h-full flex-col text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">
                        {s.code}
                      </div>
                      <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-ink group-hover:text-brand-bright">
                        {s.name}
                      </h3>
                    </div>
                    <SessionStatusBadge status={s.status} />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-dim">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <Presentation className="size-3.5 shrink-0 icon text-faint" />
                      <span className="truncate">{s.project?.name ?? "Chưa có dự án"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 icon text-faint" />
                      {formatDate(s.startDate)} — {formatDate(s.endDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5 icon text-faint" />
                      {s.memberCount}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-dim">
                      <span>
                        {s.currentSprint ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Rocket className="size-3.5 icon text-faint" />
                            {s.currentSprint.name}
                          </span>
                        ) : (
                          "Chưa có sprint"
                        )}
                      </span>
                      <span className="font-mono font-semibold text-ink">
                        {s.taskDone}/{s.taskTotal} nhiệm vụ
                      </span>
                    </div>
                    <AnimatedProgressBar value={s.taskPercent} showLabel />
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                    {s.alerts.overdueTasks > 0 ? (
                      <ToneBadge tone="rose">
                        <AlertTriangle className="size-3 icon" /> {s.alerts.overdueTasks} trễ hạn
                      </ToneBadge>
                    ) : null}
                    {s.alerts.pendingReview > 0 ? (
                      <ToneBadge tone="amber">
                        <Clock3 className="size-3 icon" /> {s.alerts.pendingReview} chờ duyệt
                      </ToneBadge>
                    ) : null}
                    {s.alerts.sessionOverdue ? (
                      <ToneBadge tone="rose" dot>
                        Buổi thực tập đã quá hạn
                      </ToneBadge>
                    ) : null}
                    {s.alerts.overdueTasks === 0 && s.alerts.pendingReview === 0 && !s.alerts.sessionOverdue ? (
                      <ToneBadge tone="emerald" dot>
                        Không có cảnh báo
                      </ToneBadge>
                    ) : null}
                  </div>
                </div>
              </Panel>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {sessions.data && sessions.data.meta.totalPages > 1 ? (
        <Panel className="mt-4">
          <Pager
            page={sessions.data.meta.page}
            totalPages={sessions.data.meta.totalPages}
            total={sessions.data.meta.total}
            onChange={setPage}
          />
        </Panel>
      ) : null}
    </ViewFrame>
  );
}
