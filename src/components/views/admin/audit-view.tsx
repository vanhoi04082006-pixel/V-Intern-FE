"use client";

import * as React from "react";
import { ScrollText } from "lucide-react";
import { adminApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDateTime } from "@/lib/client/labels";
import {
  Empty,
  PageHeader,
  Pager,
  ToneBadge,
  UserAvatar,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import {
  auditActionMeta,
  TableShell,
  TBody,
  Td,
  THead,
  Th,
  Tr,
  useDebounced,
} from "./admin-shared";

const PAGE_SIZE = 10;

const ACTION_OPTIONS = Object.entries(auditActionMeta).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

function AuditActionBadge({ action }: { action: string }) {
  const meta = auditActionMeta[action] ?? { label: action, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

export function AdminAuditView() {
  const [page, setPage] = React.useState(1);
  const [action, setAction] = React.useState("");
  const [actorInput, setActorInput] = React.useState("");
  const actor = useDebounced(actorInput);

  const list = useResource(
    () => adminApi.auditLogs({ page, pageSize: PAGE_SIZE, actor, action }),
    [page, actor, action]
  );
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;
  const resetPage = () => setPage(1);

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Kiểm toán"
        description="Nhật ký thao tác bất biến: ai làm gì, với đối tượng nào, thời điểm và địa chỉ IP."
      />

      <FilterBar
        hasActive={Boolean(actorInput || action)}
        onReset={() => {
          setActorInput("");
          setAction("");
          resetPage();
        }}
      >
        <FilterSelect
          value={action}
          onChange={(v) => {
            setAction(v);
            resetPage();
          }}
          options={ACTION_OPTIONS}
          placeholder="Loại hành động"
          ariaLabel="Lọc theo loại hành động"
          className="w-44"
        />
        <SearchInput
          value={actorInput}
          onChange={(v) => {
            setActorInput(v);
            resetPage();
          }}
          placeholder="Tìm theo người thực hiện…"
          className="w-full sm:w-64"
        />
      </FilterBar>

      {list.loading ? (
        <LoadingBlock rows={6} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<ScrollText className="icon" />}
            title="Không có bản ghi kiểm toán nào"
            description="Thử đổi loại hành động hoặc từ khóa người thực hiện."
          />
        </div>
      ) : (
        <TableShell minWidth={880}>
          <THead>
            <tr>
              <Th>Người thực hiện</Th>
              <Th>Hành động</Th>
              <Th>Đối tượng</Th>
              <Th>Thời điểm</Th>
              <Th>IP</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((log) => (
              <Tr key={log.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={log.actorName} size={28} />
                    <span className="whitespace-nowrap text-sm font-medium text-ink">{log.actorName}</span>
                  </div>
                </Td>
                <Td>
                  <AuditActionBadge action={log.action} />
                </Td>
                <Td className="max-w-[360px]">
                  <span className="block truncate text-sm text-dim" title={log.target}>
                    {log.target}
                  </span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-sm text-dim">{formatDateTime(log.at)}</span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap font-mono text-xs text-dim">{log.ip}</span>
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
    </ViewFrame>
  );
}
