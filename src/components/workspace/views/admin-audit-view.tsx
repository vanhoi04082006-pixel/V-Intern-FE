"use client";

/**
 * Nhật ký hệ thống — nhật ký kiểm toán (ai làm gì) và sự kiện hoạt động
 * (module nào phát sinh gì).
 */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { fetchActivityEvents, fetchAuditLogs, type AuditLogEntry } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  SectionCard,
  type Column,
} from "@/components/shared/kit";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const LOG_COLUMNS: Column<AuditLogEntry>[] = [
  {
    key: "action",
    header: "Hành động",
    render: (r) => <span className="font-mono text-[12px] font-bold text-blue">{r.action}</span>,
  },
  { key: "actor", header: "Người thực hiện", render: (r) => <span className="font-medium text-ink">{r.actorName ?? "—"}</span> },
  { key: "createdAt", header: "Thời gian", render: (r) => <span className="text-[13px] text-ink-soft">{fmtDateTime(r.createdAt)}</span> },
];

export function AdminAuditView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhật ký hệ thống"
        description="Dấu vết mọi thao tác quản trị và sự kiện hoạt động — phục vụ đối chiếu, truy vết."
      />
      <Tabs defaultValue="audit">
        <TabsList className="h-11 rounded-xl border-2 border-ink/15 bg-paper p-1">
          <TabsTrigger value="audit" className="gap-1.5 rounded-lg px-4 font-bold">
            <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
            Nhật ký kiểm toán
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg px-4 font-bold">Sự kiện hoạt động</TabsTrigger>
        </TabsList>
        <TabsContent value="audit" className="mt-4">
          <AuditLogsPanel />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityEventsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ───────────────────────── Nhật ký kiểm toán ───────────────────────── */

function AuditLogsPanel() {
  const [filterInput, setFilterInput] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAction(filterInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filterInput]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-audit-logs", action, page],
    queryFn: ({ signal }) => fetchAuditLogs({ action: action || undefined, page }, signal),
  });

  return (
    <SectionCard title="Nhật ký kiểm toán" description="Lọc theo mã hành động — vd: user.created, kpi.finalized…">
      <div className="mb-4">
        <Input
          placeholder="Lọc theo mã hành động…"
          value={filterInput}
          onChange={(e) => setFilterInput(e.target.value)}
          className={inputCls}
          aria-label="Lọc hành động"
        />
      </div>
      <LogTable
        isLoading={isLoading}
        error={error ? errorMessage(error) : null}
        onRetry={() => void refetch()}
        rows={data?.data ?? []}
        page={data?.meta.page ?? 1}
        totalPages={data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        emptyTitle="Chưa có bản ghi nào"
        emptyDescription="Thử bỏ bộ lọc hoặc chờ hệ thống ghi nhận thao tác mới."
      />
    </SectionCard>
  );
}

/* ───────────────────────── Sự kiện hoạt động ───────────────────────── */

function ActivityEventsPanel() {
  const [filterInput, setFilterInput] = useState("");
  const [module, setModule] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setModule(filterInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [filterInput]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-activity-events", module, page],
    queryFn: ({ signal }) => fetchActivityEvents({ module: module || undefined, page }, signal),
  });

  return (
    <SectionCard title="Sự kiện hoạt động" description="Lọc theo module — vd: recruitment, kpi, certificates…">
      <div className="mb-4">
        <Input
          placeholder="Lọc theo module…"
          value={filterInput}
          onChange={(e) => setFilterInput(e.target.value)}
          className={inputCls}
          aria-label="Lọc module"
        />
      </div>
      <LogTable
        isLoading={isLoading}
        error={error ? errorMessage(error) : null}
        onRetry={() => void refetch()}
        rows={data?.data ?? []}
        page={data?.meta.page ?? 1}
        totalPages={data?.meta.totalPages ?? 1}
        onPageChange={setPage}
        emptyTitle="Chưa có sự kiện nào"
        emptyDescription="Thử bỏ bộ lọc hoặc chờ hệ thống phát sinh sự kiện."
      />
    </SectionCard>
  );
}

/* ───────────────────────── Bảng dùng chung ───────────────────────── */

function LogTable({
  isLoading,
  error,
  onRetry,
  rows,
  page,
  totalPages,
  onPageChange,
  emptyTitle,
  emptyDescription,
}: {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  rows: AuditLogEntry[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (isLoading) return <LoadingState label="Đang tải nhật ký…" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (rows.length === 0) {
    return (
      <ListTable
        columns={LOG_COLUMNS}
        rows={[]}
        rowKey={(r) => r.id}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    );
  }
  return (
    <>
      <ListTable columns={LOG_COLUMNS} rows={rows} rowKey={(r) => r.id} />
      <Pager page={page} totalPages={totalPages} onChange={onPageChange} />
    </>
  );
}
