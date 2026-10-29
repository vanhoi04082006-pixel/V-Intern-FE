"use client";

/**
 * Vai trò & quyền — xem danh sách vai trò, quyền của từng vai trò
 * và toàn bộ permission trong hệ thống.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { fetchPermissions, fetchRolePermissions, fetchRoles, type PermissionItem, type RoleItem } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import {
  Chip,
  EmptyState,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  SectionCard,
  type Column,
} from "@/components/shared/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminRbacView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vai trò & quyền"
        description="Sơ đồ phân quyền của hệ thống — vai trò đang chứa những quyền nào, quyền gắn mã nào."
      />
      <Tabs defaultValue="roles">
        <TabsList className="h-11 rounded-xl border-2 border-ink/15 bg-paper p-1">
          <TabsTrigger value="roles" className="rounded-lg px-4 font-bold">Vai trò</TabsTrigger>
          <TabsTrigger value="permissions" className="rounded-lg px-4 font-bold">Quyền</TabsTrigger>
        </TabsList>
        <TabsContent value="roles" className="mt-4">
          <RolesPanel />
        </TabsContent>
        <TabsContent value="permissions" className="mt-4">
          <PermissionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ───────────────────────── Vai trò ───────────────────────── */

function RolesPanel() {
  const [selected, setSelected] = useState<RoleItem | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: ({ signal }) => fetchRoles(signal),
  });

  const columns: Column<RoleItem>[] = [
    {
      key: "code",
      header: "Mã",
      render: (r) => <span className="font-mono text-[12px] font-bold text-blue">{r.code}</span>,
    },
    { key: "name", header: "Tên", render: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { key: "description", header: "Mô tả", render: (r) => <span className="text-[13px] text-ink-soft">{r.description ?? "—"}</span> },
    {
      key: "isSystem",
      header: "Hệ thống",
      render: (r) => (r.isSystem ? <Chip tone="blue">Hệ thống</Chip> : <Chip>Tự tạo</Chip>),
    },
  ];

  return (
    <>
      <SectionCard title="Danh sách vai trò" description="Nhấn vào một vai trò để xem các quyền đang gán.">
        {isLoading ? (
          <LoadingState label="Đang tải vai trò…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState title="Chưa có vai trò nào" description="Hệ thống chưa định nghĩa vai trò." />
        ) : (
          <ListTable columns={columns} rows={data.data} rowKey={(r) => r.id} onRowClick={(r) => setSelected(r)} />
        )}
      </SectionCard>
      <RolePermissionsDialog role={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}

function RolePermissionsDialog({
  role,
  onOpenChange,
}: {
  role: RoleItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-role-permissions", role?.id],
    queryFn: ({ signal }) => fetchRolePermissions(role!.id, signal),
    enabled: !!role,
  });

  return (
    <Dialog open={!!role} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-ink">
            <KeyRound className="h-4 w-4 text-blue" aria-hidden="true" />
            Quyền của vai trò “{role?.name}”
          </DialogTitle>
          <DialogDescription>Mã vai trò: {role?.code}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <LoadingState label="Đang tải quyền…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Chưa có quyền nào" description="Vai trò này chưa được gán quyền." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.map((code) => (
              <Chip key={code} tone="blue">
                <span className="font-mono">{code}</span>
              </Chip>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Quyền ───────────────────────── */

function PermissionsPanel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-permissions"],
    queryFn: ({ signal }) => fetchPermissions(signal),
  });

  const columns: Column<PermissionItem>[] = [
    {
      key: "code",
      header: "Mã",
      render: (p) => <span className="font-mono text-[12px] font-bold text-blue">{p.code}</span>,
    },
    { key: "name", header: "Tên", render: (p) => <span className="font-semibold text-ink">{p.name}</span> },
    { key: "description", header: "Mô tả", render: (p) => <span className="text-[13px] text-ink-soft">{p.description ?? "—"}</span> },
  ];

  return (
    <SectionCard title="Danh sách quyền" description="Toàn bộ mã quyền hệ thống đang được định nghĩa.">
      {isLoading ? (
        <LoadingState label="Đang tải quyền…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="Chưa có quyền nào" description="Hệ thống chưa định nghĩa quyền." />
      ) : (
        <ListTable columns={columns} rows={data.data} rowKey={(p) => p.id} />
      )}
    </SectionCard>
  );
}
