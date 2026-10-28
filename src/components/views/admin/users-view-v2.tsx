"use client";

import * as React from "react";
import {
  Activity,
  Clock,
  Lock,
  LockOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminUserRow } from "@/lib/client/api";
import { roleApi, type OrgRole } from "@/lib/client/api-org";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, relativeTime, roleLabels } from "@/lib/client/labels";
import {
  Empty,
  MetricCard,
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
import { Checkbox } from "@/components/ui/checkbox";
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

/** Vai trò chính mà máy chủ lưu được trên tài khoản. */
const PRIMARY_ROLES = ["admin", "instructor", "intern"];
const USERNAME_PATTERN = /^[a-z0-9_.-]{3,64}$/;

/** Tên đăng nhập hiển thị (máy chủ lưu email — phần local part là định danh). */
function usernameOf(user: { email: string }): string {
  return user.email.split("@")[0] ?? user.email;
}

function UserStatusBadge({ status }: { status: string }) {
  const meta = userStatusMeta[status] ?? { label: status, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

/* ============================ chọn vai trò (multi) ============================ */

function RoleCheckboxes({
  roles,
  selected,
  onToggle,
}: {
  roles: OrgRole[];
  selected: string[];
  onToggle: (code: string, checked: boolean) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {roles.map((r) => {
        const checked = selected.includes(r.code);
        const primary = PRIMARY_ROLES.includes(r.code);
        return (
          <label
            key={r.code}
            className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 transition-colors ${
              checked ? "border-brand/50 bg-brand/[0.08]" : "border-line bg-deep/60 hover:border-line-strong"
            }`}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => onToggle(r.code, v === true)}
              className="mt-0.5"
              aria-label={`Vai trò ${r.name}`}
            />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] font-medium text-ink">{r.name}</span>
                <span className="font-mono text-[10px] text-faint">{r.code}</span>
                {primary ? null : (
                  <ToneBadge tone="zinc">vai trò nhóm</ToneBadge>
                )}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-faint">{r.description}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

/* ============================ dialog tạo / sửa ============================ */

interface UserFormState {
  username: string;
  email: string;
  displayName: string;
  password: string;
  roles: string[];
}

function emptyUserForm(): UserFormState {
  return { username: "", email: "", displayName: "", password: "", roles: ["intern"] };
}

function UserFormDialog({
  open,
  onOpenChange,
  editing,
  reload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AdminUserRow | null;
  reload: () => void;
}) {
  const [form, setForm] = React.useState<UserFormState>(emptyUserForm);
  const [emailTouched, setEmailTouched] = React.useState(false);
  const saveAction = useToastAction(() => {
    onOpenChange(false);
    reload();
  });

  const rolesRes = useResource(() => (open ? roleApi.list({ page: 1, pageSize: 50 }) : Promise.resolve(null)), [open]);
  const roles: OrgRole[] = rolesRes.data?.data ?? [];

  React.useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              username: usernameOf(editing),
              email: editing.email,
              displayName: editing.displayName,
              password: "",
              roles: [editing.role],
            }
          : emptyUserForm()
      );
      setEmailTouched(Boolean(editing));
    }
  }, [open, editing]);

  /** Vai trò chính = vai trò được chọn có quyền cao nhất mà máy chủ hỗ trợ. */
  const primaryRole = (): string | null => {
    for (const code of PRIMARY_ROLES) {
      if (form.roles.includes(code)) return code;
    }
    return null;
  };

  const toggleRole = (code: string, checked: boolean) => {
    setForm((f) => ({
      ...f,
      roles: checked ? [...new Set([...f.roles, code])] : f.roles.filter((r) => r !== code),
    }));
  };

  const submit = () => {
    if (editing) {
      if (form.displayName.trim().length < 2) {
        toast.error("Tên hiển thị tối thiểu 2 ký tự.");
        return;
      }
      const role = primaryRole();
      if (!role) {
        toast.error("Chọn ít nhất một vai trò chính (intern / instructor / admin).");
        return;
      }
      saveAction.run(async () => {
        await adminApi.updateUser(editing.id, {
          displayName: form.displayName.trim(),
          role,
        });
        toast.success(`Đã cập nhật thông tin ${editing.email}.`);
      });
      return;
    }
    if (form.username && !USERNAME_PATTERN.test(form.username)) {
      toast.error("Tên đăng nhập chỉ gồm a-z, 0-9, dấu chấm, gạch dưới, gạch nối (3–64 ký tự).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Email không hợp lệ.");
      return;
    }
    if (form.displayName.trim().length < 2) {
      toast.error("Tên hiển thị tối thiểu 2 ký tự.");
      return;
    }
    if (form.password && form.password.length < 8) {
      toast.error("Mật khẩu tối thiểu 8 ký tự.");
      return;
    }
    const role = primaryRole();
    if (!role) {
      toast.error("Chọn ít nhất một vai trò chính (intern / instructor / admin).");
      return;
    }
    saveAction.run(async () => {
      const created = await adminApi.createUser({
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        password: form.password || "demo1234",
        role,
      });
      toast.success(`Đã tạo tài khoản ${created.email}.`, {
        description: `Tên đăng nhập: ${usernameOf(created)} · mật khẩu mặc định: demo1234 (nếu chưa nhập).`,
      });
    });
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={(o) => !saveAction.busy && onOpenChange(o)}
      title={editing ? "Sửa thông tin người dùng" : "Tạo người dùng mới"}
      description={
        editing
          ? `${editing.displayName} · ${editing.email}`
          : "Tài khoản hoạt động ngay sau khi tạo. Mật khẩu mặc định demo1234 nếu bỏ trống."
      }
      maxWidth="max-w-2xl"
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={saveAction.busy}>
            Hủy
          </LineButton>
          <BrandButton onClick={submit} disabled={saveAction.busy}>
            {saveAction.busy ? <InlineSpinner className="size-4" /> : editing ? <Pencil className="size-4 icon" /> : <Plus className="size-4 icon" />}
            {saveAction.busy ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo tài khoản"}
          </BrandButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tên đăng nhập" hint="Chỉ a-z, 0-9 . _ - (3–64 ký tự) — dùng làm định danh hiển thị.">
            <FormInput
              value={form.username}
              onChange={(e) => {
                const username = e.target.value;
                setForm((f) => ({
                  ...f,
                  username,
                  email: emailTouched ? f.email : username ? `${username}@student.edu.vn` : f.email,
                }));
              }}
              placeholder="an.nguyen"
              className="font-mono"
              disabled={Boolean(editing)}
              autoComplete="off"
            />
          </Field>
          <Field label="Email" hint={editing ? "Không thể đổi email." : "Tự sinh từ tên đăng nhập nếu chưa sửa."}>
            <FormInput
              type="email"
              value={form.email}
              onChange={(e) => {
                setEmailTouched(true);
                setForm((f) => ({ ...f, email: e.target.value }));
              }}
              placeholder="ten@example.edu.vn"
              disabled={Boolean(editing)}
              autoComplete="off"
            />
          </Field>
        </div>
        <Field label="Tên hiển thị">
          <FormInput
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder="Nguyễn Văn A"
          />
        </Field>
        {editing ? null : (
          <Field label="Mật khẩu" hint="Bỏ trống = dùng demo1234.">
            <FormInput
              type="text"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="demo1234"
              className="font-mono"
              autoComplete="off"
            />
          </Field>
        )}

        <div>
          <span className="mb-1.5 block text-xs font-medium text-dim">Vai trò</span>
          {rolesRes.loading ? (
            <LoadingBlock rows={2} />
          ) : rolesRes.error ? (
            <ErrorBlock error={rolesRes.error} onRetry={rolesRes.reload} />
          ) : (
            <RoleCheckboxes roles={roles} selected={form.roles} onToggle={toggleRole} />
          )}
          <p className="mt-2 text-xs text-faint">
            Hệ thống lưu một vai trò chính (admin / instructor / intern). Vai trò nhóm như interviewer hay auditor
            được gán qua trang Nhóm.
          </p>
        </div>
      </div>
    </AdminDialog>
  );
}

/* ============================ view chính ============================ */

export function AdminUsersViewV2() {
  const [page, setPage] = React.useState(1);
  const [qInput, setQInput] = React.useState("");
  const q = useDebounced(qInput);
  const [role, setRole] = React.useState("");
  const [status, setStatus] = React.useState("");

  const list = useResource(
    () => adminApi.users({ page, pageSize: PAGE_SIZE, q, role, status }),
    [page, q, role, status]
  );

  // Số liệu theo bộ lọc tìm kiếm + vai trò (không tính trạng thái — để đếm đủ mọi trạng thái).
  const metrics = useResource(
    () => adminApi.users({ page: 1, pageSize: 500, q, role }),
    [q, role]
  );

  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;

  const resetPage = () => setPage(1);
  const hasActiveFilters = Boolean(qInput || role || status);

  const statusCount = (s: string) =>
    (metrics.data?.data ?? []).filter((u) => u.status === s).length;

  /* ---------- dialog state ---------- */
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminUserRow | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<{ user: AdminUserRow; status: string } | null>(null);
  const statusAction = useToastAction(() => {
    setStatusTarget(null);
    list.reload();
    metrics.reload();
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
        description="Quản lý tài khoản toàn nền tảng: tạo mới, gán vai trò, khoá/mở và theo dõi đăng nhập gần nhất."
        actions={
          <BrandButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4 icon" /> Tạo người dùng
          </BrandButton>
        }
      />

      {/* Số liệu theo bộ lọc */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Tổng tài khoản"
          value={metrics.data?.meta.total ?? "—"}
          hint={q || role ? "theo bộ lọc tìm kiếm / vai trò" : "toàn nền tảng"}
          icon={<Users className="icon" />}
          tone="brand"
        />
        <MetricCard
          label="Đang hoạt động"
          value={statusCount("active")}
          icon={<Activity className="icon" />}
          tone="teal"
        />
        <MetricCard
          label="Chờ kích hoạt"
          value={statusCount("pending")}
          icon={<Clock className="icon" />}
          tone="amber"
        />
        <MetricCard
          label="Đã khóa"
          value={statusCount("locked")}
          icon={<Lock className="icon" />}
          tone="rose"
        />
      </div>

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
              <BrandButton
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4 icon" /> Tạo người dùng
              </BrandButton>
            }
          />
        </div>
      ) : (
        <TableShell minWidth={1020}>
          <THead>
            <tr>
              <Th>Tên đăng nhập</Th>
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
                  <span className="font-mono text-xs text-brand-bright">{usernameOf(user)}</span>
                </Td>
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
                  <span className="whitespace-nowrap text-sm text-dim" title={user.lastLoginAt ?? undefined}>
                    {relativeTime(user.lastLoginAt)}
                  </span>
                </Td>
                <Td className="text-right">
                  <RowMenu
                    user={user}
                    onEdit={() => {
                      setEditing(user);
                      setFormOpen(true);
                    }}
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

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} reload={list.reload} />

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
        <DropdownMenuLabel className="text-xs text-faint">
          <span className="font-mono">{usernameOf(user)}</span>
        </DropdownMenuLabel>
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
        <DropdownMenuItem disabled={user.status === "locked"} onClick={() => onStatus("locked")}>
          <Lock className="size-4 icon" /> Đặt: Đã khóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
