"use client";

/**
 * Quản trị người dùng — tìm kiếm, lọc trạng thái, tạo tài khoản mới,
 * đổi trạng thái và sửa tên hiển thị.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createUser, fetchUsers, setUserStatus, updateUser, type UserItem } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  Chip,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";
const triggerCls =
  "h-11 w-full rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

const STATUS_OPTIONS = [
  { value: "active", label: "Đang hoạt động" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "locked", label: "Bị khoá" },
  { value: "deleted", label: "Đã xoá" },
];

const ROLE_OPTIONS = ["admin", "instructor", "intern"];

export function AdminUsersView() {
  const queryClient = useQueryClient();

  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [roleCode, setRoleCode] = useState("all");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [qInput]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users", q, status, roleCode, page],
    queryFn: ({ signal }) =>
      fetchUsers(
        {
          q: q || undefined,
          status: status === "all" ? undefined : status,
          roleCode: roleCode === "all" ? undefined : roleCode,
          page,
        },
        signal,
      ),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const columns: Column<UserItem>[] = [
    { key: "email", header: "Email", render: (u) => <span className="font-semibold text-ink">{u.email}</span> },
    { key: "displayName", header: "Tên hiển thị", render: (u) => <span className="font-medium">{u.displayName}</span> },
    {
      key: "roles",
      header: "Vai trò",
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.length === 0 ? <Chip>—</Chip> : u.roles.map((r) => <Chip key={r} tone="blue">{r}</Chip>)}
        </div>
      ),
    },
    { key: "status", header: "Trạng thái", render: (u) => <StatusBadge status={u.status} /> },
    {
      key: "createdAt",
      header: "Tạo lúc",
      render: (u) => <span className="text-[13px] text-ink-soft">{fmtDateTime(u.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản toàn hệ thống — tạo mới, khoá/mở, gán vai trò."
        actions={
          <Button
            className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            onClick={() => setCreateOpen(true)}
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Tạo người dùng
          </Button>
        }
      />

      <SectionCard title="Danh sách người dùng" description="Nhấn vào một dòng để chỉnh sửa thông tin tài khoản.">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Tìm theo email, tên, username…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className={inputCls}
            aria-label="Tìm người dùng"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={triggerCls} aria-label="Lọc trạng thái">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={roleCode}
            onValueChange={(v) => {
              setRoleCode(v);
              setPage(1);
            }}
          >
            <SelectTrigger className={`${triggerCls} sm:w-[190px]`} aria-label="Lọc vai trò">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi vai trò</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState label="Đang tải người dùng…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable columns={columns} rows={[]} rowKey={(u) => u.id} emptyTitle="Không tìm thấy người dùng" emptyDescription="Thử đổi từ khoá hoặc bộ lọc." />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(u) => u.id} onRowClick={(u) => setEditing(u)} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          invalidate();
          setCreateOpen(false);
        }}
      />
      <EditUserDialog user={editing} onOpenChange={(open) => !open && setEditing(null)} onSaved={invalidate} />

      <p className="text-center text-[12px] text-ink-faint">
        Mật khẩu tạo qua đây là mật khẩu tạm — người dùng sẽ phải đổi mật khẩu khi đăng nhập lần đầu.
      </p>
    </div>
  );
}

/* ───────────────────────── Tạo người dùng ───────────────────────── */

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleCodes, setRoleCodes] = useState<string[]>(["intern"]);

  const create = useMutation({
    mutationFn: () =>
      createUser({
        email: email.trim(),
        displayName: displayName.trim(),
        username: username.trim() || undefined,
        password,
        roleCodes,
      }),
    onSuccess: () => {
      toast({
        title: "Đã tạo người dùng ✦",
        description: "Mật khẩu tạm — người dùng sẽ phải đổi khi đăng nhập.",
      });
      setEmail("");
      setDisplayName("");
      setUsername("");
      setPassword("");
      setRoleCodes(["intern"]);
      onCreated();
    },
    onError: (e) =>
      toast({ title: "Tạo người dùng thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const toggleRole = (role: string, checked: boolean) => {
    setRoleCodes((prev) => (checked ? [...new Set([...prev, role])] : prev.filter((r) => r !== role)));
  };

  const valid =
    email.trim().length > 3 &&
    email.includes("@") &&
    displayName.trim().length > 0 &&
    password.length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Tạo người dùng mới</DialogTitle>
          <DialogDescription>
            Tài khoản sẽ ở trạng thái chờ xử lý cho đến khi người dùng đăng nhập và đổi mật khẩu.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="new-email">Email</Label>
            <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="ten@congty.vn" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new-display-name">Tên hiển thị</Label>
            <Input id="new-display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} placeholder="Nguyễn Văn A" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new-username">Username (tuỳ chọn)</Label>
            <Input id="new-username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} placeholder="nguyenvana" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new-password">Mật khẩu tạm</Label>
            <Input id="new-password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="Tối thiểu 10 ký tự" />
            <p className="text-[12px] text-ink-faint">Tối thiểu 10 ký tự — người dùng sẽ phải đổi khi đăng nhập.</p>
          </div>
          <div className="grid gap-2">
            <Label>Vai trò</Label>
            <div className="flex flex-wrap gap-4">
              {ROLE_OPTIONS.map((role) => (
                <label key={role} className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink">
                  <Checkbox checked={roleCodes.includes(role)} onCheckedChange={(v) => toggleRole(role, v === true)} />
                  {role}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={!valid || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang tạo…" : "Tạo người dùng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Sửa người dùng ───────────────────────── */

function EditUserDialog({
  user,
  onOpenChange,
  onSaved,
}: {
  user: UserItem | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        {user ? <EditUserForm key={user.id} user={user} onOpenChange={onOpenChange} onSaved={onSaved} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function EditUserForm({
  user,
  onOpenChange,
  onSaved,
}: {
  user: UserItem;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [status, setStatus] = useState(user.status);

  const saveProfile = useMutation({
    mutationFn: () => updateUser(user.id, { displayName: displayName.trim() }),
    onSuccess: () => {
      toast({ title: "Đã cập nhật tên hiển thị" });
      onSaved();
      onOpenChange(false);
    },
    onError: (e) => toast({ title: "Cập nhật thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const saveStatus = useMutation({
    mutationFn: () => setUserStatus(user.id, status),
    onSuccess: () => {
      toast({ title: "Đã đổi trạng thái tài khoản" });
      onSaved();
      onOpenChange(false);
    },
    onError: (e) => toast({ title: "Đổi trạng thái thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-ink">Chỉnh sửa: {user.displayName}</DialogTitle>
        <DialogDescription>
          {user.email} — vai trò: {user.roles.join(", ") || "chưa có"}
        </DialogDescription>
      </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-display-name">Tên hiển thị</Label>
            <Input id="edit-display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
          </div>
          <div className="grid gap-1.5">
            <Label>Trạng thái tài khoản</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className={triggerCls} aria-label="Trạng thái tài khoản">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[12px] text-ink-faint">
              Trạng thái hiện tại: <StatusBadge status={user.status} />
            </p>
          </div>
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl border-2 border-ink/20 font-bold"
            disabled={status === user.status || saveStatus.isPending}
            onClick={() => saveStatus.mutate()}
          >
            {saveStatus.isPending ? "Đang lưu…" : "Lưu trạng thái"}
          </Button>
          <Button
            className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={displayName.trim() === user.displayName || saveProfile.isPending}
            onClick={() => saveProfile.mutate()}
          >
            {saveProfile.isPending ? "Đang lưu…" : "Lưu tên hiển thị"}
          </Button>
        </DialogFooter>
    </>
  );
}
