"use client";

import * as React from "react";
import { Clock, Lock, LockOpen, MoreHorizontal, Pencil, Plus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminUserRow } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, relativeTime, roleLabels } from "@/lib/client/labels";
import {
  Empty,
  PageHeader,
  Pager,
  ToneBadge,
  UserAvatar,
} from "@/components/shared/primitives";
import { RoleBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AdminDialog,
  BrandButton,
  Field,
  FormInput,
  FormSelect,
  LineButton,
  TableShell,
  TBody,
  Td,
  THead,
  Th,
  Tr,
  useDebounced,
  useToastAction,
  userStatusMeta,
} from "./admin-shared";

const PAGE_SIZE = 10;

const ROLE_OPTIONS = ["intern", "instructor", "admin"].map((v) => ({ value: v, label: roleLabels[v] ?? v }));
const STATUS_OPTIONS = ["active", "pending", "locked"].map((v) => ({
  value: v,
  label: userStatusMeta[v]?.label ?? v,
}));

function UserStatusBadge({ status }: { status: string }) {
  const meta = userStatusMeta[status] ?? { label: status, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

export function AdminUsersView() {
  const [page, setPage] = React.useState(1);
  const [qInput, setQInput] = React.useState("");
  const q = useDebounced(qInput);
  const [role, setRole] = React.useState("");
  const [status, setStatus] = React.useState("");

  const list = useResource(
    () => adminApi.users({ page, pageSize: PAGE_SIZE, q, role, status }),
    [page, q, role, status]
  );
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;

  const resetPage = () => setPage(1);
  const hasActiveFilters = Boolean(qInput || role || status);

  /* ---------- tạo người dùng ---------- */
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({ email: "", displayName: "", password: "", role: "intern" });
  const createAction = useToastAction(() => {
    setCreateOpen(false);
    setCreateForm({ email: "", displayName: "", password: "", role: "intern" });
    list.reload();
  });

  const submitCreate = () => {
    if (createForm.password && createForm.password.length < 8) {
      toast.error("Mật khẩu tối thiểu 8 ký tự.");
      return;
    }
    createAction.run(async () => {
      const created = await adminApi.createUser({
        email: createForm.email.trim(),
        displayName: createForm.displayName.trim(),
        password: createForm.password || "demo1234",
        role: createForm.role,
      });
      toast.success(`Đã tạo tài khoản ${created.email}.`, {
        description: `Mật khẩu mặc định: demo1234 (nếu chưa nhập).`,
      });
    });
  };

  /* ---------- sửa thông tin ---------- */
  const [editing, setEditing] = React.useState<AdminUserRow | null>(null);
  const [editForm, setEditForm] = React.useState({ displayName: "", role: "intern" });
  const editAction = useToastAction(() => {
    setEditing(null);
    list.reload();
  });

  const openEdit = (user: AdminUserRow) => {
    setEditForm({ displayName: user.displayName, role: user.role });
    setEditing(user);
  };

  const submitEdit = () => {
    if (!editing) return;
    editAction.run(async () => {
      await adminApi.updateUser(editing.id, {
        displayName: editForm.displayName.trim(),
        role: editForm.role,
      });
      toast.success(`Đã cập nhật thông tin ${editing.email}.`);
    });
  };

  /* ---------- đổi trạng thái ---------- */
  const [statusTarget, setStatusTarget] = React.useState<{ user: AdminUserRow; status: string } | null>(null);
  const statusAction = useToastAction(() => {
    setStatusTarget(null);
    list.reload();
  });

  const confirmStatus = () => {
    if (!statusTarget) return;
    const { user, status: next } = statusTarget;
    statusAction.run(async () => {
      await adminApi.setUserStatus(user.id, next);
      toast.success(`${user.email} → ${userStatusMeta[next]?.label ?? next}.`);
    });
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Người dùng"
        description="Quản lý tài khoản toàn nền tảng: tạo mới, đổi vai trò, khoá/mở và theo dõi đăng nhập."
        actions={
          <BrandButton onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 icon" /> Tạo người dùng
          </BrandButton>
        }
      />

      <FilterBar
        hasActive={hasActiveFilters}
        onReset={() => {
          setQInput("");
          setRole("");
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
          placeholder="Tìm theo tên hoặc email…"
          className="w-full sm:w-64"
        />
        <FilterSelect
          value={role}
          onChange={(v) => {
            setRole(v);
            resetPage();
          }}
          options={ROLE_OPTIONS}
          placeholder="Vai trò"
          ariaLabel="Lọc theo vai trò"
          className="w-40"
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v);
            resetPage();
          }}
          options={STATUS_OPTIONS}
          placeholder="Trạng thái"
          ariaLabel="Lọc theo trạng thái"
          className="w-40"
        />
      </FilterBar>

      {list.loading ? (
        <LoadingBlock rows={6} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<UserCheck className="icon" />}
            title="Không có người dùng khớp bộ lọc"
            description="Thử đổi từ khóa, vai trò hoặc trạng thái — hoặc tạo tài khoản mới."
            action={
              <BrandButton onClick={() => setCreateOpen(true)}>
                <Plus className="size-4 icon" /> Tạo người dùng
              </BrandButton>
            }
          />
        </div>
      ) : (
        <TableShell>
          <THead>
            <tr>
              <Th>Người dùng</Th>
              <Th>Vai trò</Th>
              <Th>Trạng thái</Th>
              <Th>Ngày tham gia</Th>
              <Th>Đăng nhập cuối</Th>
              <Th className="text-right">Thao tác</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((user) => (
              <Tr key={user.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.displayName} size={34} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{user.displayName}</p>
                      <p className="truncate font-mono text-xs text-dim">{user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <RoleBadge role={user.role} />
                </Td>
                <Td>
                  <UserStatusBadge status={user.status} />
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-sm text-dim">{formatDate(user.joinedAt)}</span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-sm text-dim">{relativeTime(user.lastLoginAt)}</span>
                </Td>
                <Td className="text-right">
                  <RowMenu
                    user={user}
                    onEdit={() => openEdit(user)}
                    onStatus={(next) => setStatusTarget({ user, status: next })}
                  />
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

      {/* Dialog tạo người dùng */}
      <AdminDialog
        open={createOpen}
        onOpenChange={(open) => !createAction.busy && setCreateOpen(open)}
        title="Tạo người dùng mới"
        description="Tài khoản sẽ ở trạng thái hoạt động ngay sau khi tạo."
        footer={
          <>
            <LineButton onClick={() => setCreateOpen(false)} disabled={createAction.busy}>
              Hủy
            </LineButton>
            <BrandButton onClick={submitCreate} disabled={createAction.busy}>
              {createAction.busy ? <InlineSpinner className="size-4" /> : <Plus className="size-4 icon" />}
              {createAction.busy ? "Đang tạo…" : "Tạo tài khoản"}
            </BrandButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Email">
            <FormInput
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="ten@example.edu.vn"
              autoComplete="off"
            />
          </Field>
          <Field label="Tên hiển thị">
            <FormInput
              value={createForm.displayName}
              onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Nguyễn Văn A"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mật khẩu" hint="Bỏ trống = dùng demo1234">
              <FormInput
                type="text"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="demo1234"
                className="font-mono"
                autoComplete="off"
              />
            </Field>
            <Field label="Vai trò">
              <FormSelect
                value={createForm.role}
                onChange={(v) => setCreateForm((f) => ({ ...f, role: v }))}
                options={ROLE_OPTIONS}
                ariaLabel="Chọn vai trò"
              />
            </Field>
          </div>
        </div>
      </AdminDialog>

      {/* Dialog sửa thông tin */}
      <AdminDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !editAction.busy && !open && setEditing(null)}
        title="Sửa thông tin người dùng"
        description={editing ? `${editing.displayName} · ${editing.email}` : undefined}
        footer={
          <>
            <LineButton onClick={() => setEditing(null)} disabled={editAction.busy}>
              Hủy
            </LineButton>
            <BrandButton onClick={submitEdit} disabled={editAction.busy}>
              {editAction.busy ? <InlineSpinner className="size-4" /> : <Pencil className="size-4 icon" />}
              {editAction.busy ? "Đang lưu…" : "Lưu thay đổi"}
            </BrandButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tên hiển thị">
            <FormInput
              value={editForm.displayName}
              onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Tên mới"
            />
          </Field>
          <Field label="Vai trò">
            <FormSelect
              value={editForm.role}
              onChange={(v) => setEditForm((f) => ({ ...f, role: v }))}
              options={ROLE_OPTIONS}
              ariaLabel="Chọn vai trò"
            />
          </Field>
        </div>
      </AdminDialog>

      {/* Xác nhận đổi trạng thái */}
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !statusAction.busy && !open && setStatusTarget(null)}
        title={
          statusTarget
            ? statusTarget.status === "locked"
              ? `Khoá tài khoản ${statusTarget.user.displayName}?`
              : `Chuyển ${statusTarget.user.displayName} sang “${userStatusMeta[statusTarget.status]?.label ?? statusTarget.status}”?`
            : ""
        }
        description={
          statusTarget?.status === "locked"
            ? "Người dùng sẽ không thể đăng nhập cho đến khi được mở khoá."
            : "Trạng thái tài khoản sẽ được cập nhật ngay."
        }
        confirmLabel={statusTarget?.status === "locked" ? "Khoá tài khoản" : "Xác nhận"}
        destructive={statusTarget?.status === "locked"}
        busy={statusAction.busy}
        onConfirm={confirmStatus}
      />
    </ViewFrame>
  );
}

function RowMenu({
  user,
  onEdit,
  onStatus,
}: {
  user: AdminUserRow;
  onEdit: () => void;
  onStatus: (status: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-ink"
          aria-label={`Thao tác với ${user.displayName}`}
        >
          <MoreHorizontal className="size-4 icon" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 border-line bg-panel-2">
        <DropdownMenuLabel className="text-xs text-faint">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-line" />
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4 icon" /> Sửa thông tin
        </DropdownMenuItem>
        {user.status === "locked" ? (
          <DropdownMenuItem onClick={() => onStatus("active")}>
            <LockOpen className="size-4 icon" /> Mở khoá tài khoản
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onClick={() => onStatus("locked")}>
            <Lock className="size-4 icon" /> Khoá tài khoản
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-line" />
        <DropdownMenuItem disabled={user.status === "active"} onClick={() => onStatus("active")}>
          <UserCheck className="size-4 icon" /> Đặt: Hoạt động
        </DropdownMenuItem>
        <DropdownMenuItem disabled={user.status === "pending"} onClick={() => onStatus("pending")}>
          <Clock className="size-4 icon" /> Đặt: Chờ kích hoạt
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
