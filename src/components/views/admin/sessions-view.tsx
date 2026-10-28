"use client";

import * as React from "react";
import { AlertTriangle, CalendarRange, Presentation, Users } from "lucide-react";
import { sessionApi, type SessionOverviewItem } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, sessionStatusLabels } from "@/lib/client/labels";
import {
  AnimatedProgressBar,
  Empty,
  PageHeader,
  Pager,
  ToneBadge,
} from "@/components/shared/primitives";
import { SessionStatusBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import { TableShell, TBody, Td, THead, Th, Tr, useDebounced } from "./admin-shared";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = ["planning", "active", "completed", "cancelled"].map((v) => ({
  value: v,
  label: sessionStatusLabels[v] ?? v,
}));

/** Hàng cảnh báo: task trễ / chờ duyệt / phiên quá hạn. */
function AlertBadges({ alerts }: { alerts: SessionOverviewItem["alerts"] }) {
  const items: React.ReactNode[] = [];
  if (alerts.overdueTasks > 0) {
    items.push(
      <ToneBadge key="overdue" tone="amber">
        {alerts.overdueTasks} task trễ hạn
      </ToneBadge>
    );
  }
  if (alerts.pendingReview > 0) {
    items.push(
      <ToneBadge key="review" tone="teal">
        {alerts.pendingReview} chờ duyệt
      </ToneBadge>
    );
  }
  if (alerts.sessionOverdue) {
    items.push(
      <ToneBadge key="session" tone="rose" dot>
        Quá hạn
      </ToneBadge>
    );
  }
  if (!items.length) return <span className="text-xs text-faint">—</span>;
  return <div className="flex max-w-56 flex-wrap justify-end gap-1.5">{items}</div>;
}

export function AdminSessionsView() {
  const [page, setPage] = React.useState(1);
  const [qInput, setQInput] = React.useState("");
  const q = useDebounced(qInput);
  const [status, setStatus] = React.useState("");

  const list = useResource(
    () => sessionApi.overview({ page, pageSize: PAGE_SIZE, q, status }),
    [page, q, status]
  );
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const resetPage = () => setPage(1);

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Buổi thực tập"
        description="Toàn bộ phiên thực tập trên nền tảng — tổng quan nhanh, không thao tác chi tiết (thuộc về giảng viên phụ trách)."
      />

      <FilterBar
        hasActive={Boolean(qInput || status)}
        onReset={() => {
          setQInput("");
          setStatus("");
          resetPage();
        }}
      >
        <SearchInput
          value={qInput}
          onChange={(v) => {
            setQInput(v);
            resetPage();
          }}
          placeholder="Tìm theo mã, tên phiên, dự án…"
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v);
            resetPage();
          }}
          options={STATUS_OPTIONS}
          placeholder="Trạng thái"
          ariaLabel="Lọc theo trạng thái phiên"
          className="w-44"
        />
      </FilterBar>

      {list.loading ? (
        <LoadingBlock rows={4} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<Presentation className="icon" />}
            title="Không có phiên thực tập nào"
            description="Thử bỏ bộ lọc — phiên mới được tạo từ trang Dự án mẫu của giảng viên."
          />
        </div>
      ) : (
        <TableShell minWidth={940}>
          <THead>
            <tr>
              <Th>Phiên</Th>
              <Th>Trạng thái</Th>
              <Th>Thời gian</Th>
              <Th>Dự án</Th>
              <Th>Thành viên</Th>
              <Th>Tiến độ task</Th>
              <Th className="text-right">Cảnh báo</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((session) => (
              <Tr key={session.id}>
                <Td>
                  <p className="font-mono text-xs text-faint">{session.code}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink">{session.name}</p>
                  {session.currentSprint ? (
                    <p className="mt-0.5 text-xs text-dim">Sprint hiện tại: {session.currentSprint.code}</p>
                  ) : null}
                </Td>
                <Td>
                  <SessionStatusBadge status={session.status} />
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-dim">
                    <CalendarRange className="size-3.5 icon text-faint" />
                    {formatDate(session.startDate)} → {formatDate(session.endDate)}
                  </span>
                </Td>
                <Td className="max-w-[220px]">
                  {session.project ? (
                    <>
                      <p className="truncate text-sm text-ink" title={session.project.name}>
                        {session.project.name}
                      </p>
                      <p className="font-mono text-xs text-faint">{session.project.code}</p>
                    </>
                  ) : (
                    <span className="text-xs text-faint">—</span>
                  )}
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 font-mono text-sm text-dim">
                    <Users className="size-3.5 icon text-faint" />
                    {session.memberCount}
                  </span>
                </Td>
                <Td className="min-w-[160px]">
                  <AnimatedProgressBar value={session.taskPercent} showLabel />
                  <p className="mt-1 text-xs text-faint">
                    {session.taskDone}/{session.taskTotal} task hoàn thành
                  </p>
                </Td>
                <Td className="text-right">
                  <AlertBadges alerts={session.alerts} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </TableShell>
      )}

      {meta && rows.length > 0 ? (
        <div className="mt-4">
          <Pager page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
        </div>
      ) : null}

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-faint">
        <AlertTriangle className="mt-0.5 size-3.5 icon shrink-0" />
        Cảnh báo tổng hợp từ dữ liệu phiên: task trễ hạn (amber), bài nộp chờ giảng viên duyệt (teal), phiên đã
        quá ngày kết thúc (rose).
      </p>
    </ViewFrame>
  );
}
