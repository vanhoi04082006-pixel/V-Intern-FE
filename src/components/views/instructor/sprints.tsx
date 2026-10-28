"use client";

import * as React from "react";
import { CalendarDays, ListChecks, Presentation, Rocket } from "lucide-react";
import { sessionApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import { navigate } from "@/lib/client/router";
import { ViewFrame, Stagger, StaggerItem } from "@/components/shared/view";
import {
  Panel,
  PageHeader,
  Empty,
  AnimatedProgressBar,
} from "@/components/shared/primitives";
import { FilterBar, FilterSelect } from "@/components/shared/toolbar";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { SprintStatusBadge } from "./shared";

export function InstructorSprints() {
  const overview = useResource(() => sessionApi.overview({ page: 1, pageSize: 50 }), []);
  const sessions = overview.data?.data ?? [];

  const [sessionId, setSessionId] = React.useState("");
  const effectiveSessionId = sessionId || sessions[0]?.id || "";

  const detail = useResource(
    () => (effectiveSessionId ? sessionApi.detail(effectiveSessionId) : Promise.resolve(null)),
    [effectiveSessionId]
  );

  // Đếm nhiệm vụ theo sprint (work trả tasks của session)
  const work = useResource(
    () =>
      effectiveSessionId
        ? sessionApi.work(effectiveSessionId, { page: 1, pageSize: 200 })
        : Promise.resolve(null),
    [effectiveSessionId]
  );

  const taskCountBySprint = React.useMemo(() => {
    const map = new Map<string, number>();
    (work.data?.data ?? []).forEach((t) => {
      if (t.sprintId) map.set(t.sprintId, (map.get(t.sprintId) ?? 0) + 1);
    });
    return map;
  }, [work.data]);

  const sprints = detail.data?.sprints ?? [];
  const sessionOptions = sessions.map((s) => ({
    value: s.id,
    label: `${s.code} · ${s.name}`,
  }));

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Lớp học"
        title="Sprint & giao việc"
        description="Toàn bộ sprint của các buổi thực tập. Vào không gian sprint để kéo thả nhiệm vụ và duyệt bài nộp."
      />

      <FilterBar>
        {sessions.length > 0 ? (
          <FilterSelect
            value={effectiveSessionId}
            onChange={setSessionId}
            options={sessionOptions}
            allLabel="Chọn buổi thực tập"
            placeholder="Chọn buổi thực tập"
            className="w-full sm:w-80"
            ariaLabel="Chọn buổi thực tập"
          />
        ) : null}
      </FilterBar>

      {overview.loading || detail.loading ? (
        <LoadingBlock variant="cards" rows={3} />
      ) : overview.error ? (
        <ErrorBlock error={overview.error} onRetry={overview.reload} />
      ) : detail.error ? (
        <ErrorBlock error={detail.error} onRetry={detail.reload} />
      ) : sessions.length === 0 ? (
        <Panel>
          <Empty
            icon={<Presentation />}
            title="Chưa có buổi thực tập nào"
            description="Khởi động buổi thực tập từ dự án mẫu để có sprint."
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
      ) : sprints.length === 0 ? (
        <Panel>
          <Empty
            icon={<Rocket />}
            title="Buổi thực tập chưa có sprint"
            description="Sinh kế hoạch AI trong trang chi tiết buổi thực tập để tạo sprint tự động."
            action={
              <button
                type="button"
                onClick={() => navigate(`/instructor/sessions/${effectiveSessionId}`)}
                className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.98]"
              >
                Mở chi tiết buổi thực tập
              </button>
            }
          />
        </Panel>
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sprints.map((s) => (
            <StaggerItem key={s.id}>
              <Panel hoverable className="group h-full cursor-pointer p-5">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/instructor/sprints/${s.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/instructor/sprints/${s.id}`);
                    }
                  }}
                  className="flex h-full flex-col text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">
                        {s.code}
                      </div>
                      <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-bright">
                        {s.name}
                      </h3>
                    </div>
                    <SprintStatusBadge status={s.status} />
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-dim">
                    <CalendarDays className="size-3.5 icon text-faint" />
                    {formatDate(s.startDate)} — {formatDate(s.endDate)}
                  </div>

                  <div className="mt-4 flex-1">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-dim">
                      <span className="inline-flex items-center gap-1.5">
                        <ListChecks className="size-3.5 icon text-faint" />
                        {taskCountBySprint.get(s.id) ?? 0} nhiệm vụ
                      </span>
                      <span className="font-mono font-semibold text-ink">{s.progress}%</span>
                    </div>
                    <AnimatedProgressBar
                      value={s.progress}
                      tone={s.status === "done" ? "brand" : "teal"}
                    />
                  </div>

                  <span className="mt-4 inline-flex items-center gap-1 border-t border-line pt-3 text-[11px] font-semibold text-brand-bright transition-transform group-hover:translate-x-0.5">
                    Mở không gian sprint <Rocket className="size-3.5 icon" />
                  </span>
                </div>
              </Panel>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </ViewFrame>
  );
}
