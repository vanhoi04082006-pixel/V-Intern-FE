"use client";

/**
 * Quản trị nhóm — tạo nhóm, thêm/bớt thành viên.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Users2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addGroupMembers, createGroup, fetchGroups, removeGroupMember, type GroupItem } from "@/lib/api/admin";
import { fetchMemberOptions, type SessionMember } from "@/lib/api/academic";
import { errorMessage } from "@/lib/api/transport";
import {
  Chip,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  SectionCard,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inputCls =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

export function AdminGroupsView() {
  const queryClient = useQueryClient();
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<GroupItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [qInput]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-groups", q, page],
    queryFn: ({ signal }) => fetchGroups({ q: q || undefined, page }, signal),
  });

  const columns: Column<GroupItem>[] = [
    {
      key: "code",
      header: "Mã",
      render: (g) => <span className="font-mono text-[12px] font-bold text-blue">{g.code}</span>,
    },
    { key: "name", header: "Tên", render: (g) => <span className="font-semibold text-ink">{g.name}</span> },
    { key: "memberCount", header: "Thành viên", render: (g) => <span className="font-bold">{g.memberCount}</span> },
    {
      key: "roleCodes",
      header: "Vai trò nhóm",
      render: (g) => (
        <div className="flex flex-wrap gap-1">
          {g.roleCodes.length === 0 ? <Chip>—</Chip> : g.roleCodes.map((r) => <Chip key={r} tone="blue">{r}</Chip>)}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhóm"
        description="Gom người dùng theo nhóm để cấp quyền theo lô — nhấn dòng để quản lý thành viên."
        actions={
          <Button
            className="h-11 gap-2 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            onClick={() => setCreateOpen(true)}
          >
            <Users2 className="h-4 w-4" aria-hidden="true" />
            Tạo nhóm
          </Button>
        }
      />

      <SectionCard title="Danh sách nhóm">
        <div className="mb-4">
          <Input
            placeholder="Tìm nhóm theo mã hoặc tên…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className={inputCls}
            aria-label="Tìm nhóm"
          />
        </div>
        {isLoading ? (
          <LoadingState label="Đang tải nhóm…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.data.length === 0 ? (
          <ListTable columns={columns} rows={[]} rowKey={(g) => g.id} emptyTitle="Không tìm thấy nhóm" emptyDescription="Tạo nhóm mới để bắt đầu gộp người dùng." />
        ) : (
          <>
            <ListTable columns={columns} rows={data.data} rowKey={(g) => g.id} onRowClick={(g) => setEditing(g)} />
            <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin-groups"] });
          setCreateOpen(false);
        }}
      />
      <GroupMembersDialog
        group={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onChanged={() => void queryClient.invalidateQueries({ queryKey: ["admin-groups"] })}
      />
    </div>
  );
}

/* ───────────────────────── Tạo nhóm ───────────────────────── */

function CreateGroupDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => createGroup({ code: code.trim(), name: name.trim() }),
    onSuccess: () => {
      toast({ title: "Đã tạo nhóm ✦" });
      setCode("");
      setName("");
      onCreated();
    },
    onError: (e) => toast({ title: "Tạo nhóm thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-ink/15 bg-paper">
        <DialogHeader>
          <DialogTitle className="text-ink">Tạo nhóm mới</DialogTitle>
          <DialogDescription>Nhóm giúp gán vai trò cho nhiều người dùng cùng lúc.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="group-code">Mã nhóm</Label>
            <Input id="group-code" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="vd: mentors-fe" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="group-name">Tên nhóm</Label>
            <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="vd: Mentors Frontend" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            className="h-11 rounded-xl border-2 border-ink bg-royal px-5 font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            disabled={code.trim().length === 0 || name.trim().length === 0 || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang tạo…" : "Tạo nhóm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Thành viên nhóm ───────────────────────── */

function GroupMembersDialog({
  group,
  onOpenChange,
  onChanged,
}: {
  group: GroupItem | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  return (
    <Dialog open={!!group} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-ink/15 bg-paper">
        {group ? <GroupMembersForm key={group.id} group={group} onChanged={onChanged} onOpenChange={onOpenChange} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function GroupMembersForm({
  group,
  onOpenChange,
  onChanged,
}: {
  group: GroupItem;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  /** Thành viên đã thêm trong phiên này — API chưa có endpoint liệt kê thành viên nhóm. */
  const [justAdded, setJustAdded] = useState<SessionMember[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setQ(qInput), 400);
    return () => clearTimeout(timer);
  }, [qInput]);

  const { data: options, isLoading } = useQuery({
    queryKey: ["member-options", q],
    queryFn: ({ signal }) => fetchMemberOptions({ q: q || undefined }, signal),
  });

  const addMembers = useMutation({
    mutationFn: () => addGroupMembers(group.id, selected),
    onSuccess: () => {
      const added = (options ?? []).filter((m) => selected.includes(m.userId));
      setJustAdded((prev) => [...prev, ...added.filter((a) => !prev.some((p) => p.userId === a.userId))]);
      setSelected([]);
      onChanged();
      toast({ title: `Đã thêm ${selected.length} thành viên vào nhóm` });
    },
    onError: (e) => toast({ title: "Thêm thành viên thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => removeGroupMember(group.id, userId),
    onSuccess: (_data, userId) => {
      setJustAdded((prev) => prev.filter((m) => m.userId !== userId));
      onChanged();
      toast({ title: "Đã xoá thành viên khỏi nhóm" });
    },
    onError: (e) => toast({ title: "Xoá thành viên thất bại", description: errorMessage(e), variant: "destructive" }),
  });

  const toggle = (userId: string, checked: boolean) => {
    setSelected((prev) => (checked ? [...new Set([...prev, userId])] : prev.filter((id) => id !== userId)));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-ink">Thành viên nhóm “{group.name}”</DialogTitle>
        <DialogDescription>
          Mã nhóm <span className="font-mono text-blue">{group.code}</span> — hiện có {group.memberCount} thành viên.
          Thêm bằng cách tick tên rồi bấm “Thêm vào nhóm”.
        </DialogDescription>
      </DialogHeader>

        {justAdded.length > 0 ? (
          <div className="rounded-xl border-2 border-emerald-400/40 bg-emerald-50/50 p-3">
            <p className="mb-2 text-[12px] font-extrabold uppercase tracking-wide text-emerald-700">
              Đã thêm trong phiên này
            </p>
            <ul className="space-y-1.5">
              {justAdded.map((m) => (
                <li key={m.userId} className="flex items-center justify-between gap-3 rounded-lg bg-paper px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{m.displayName}</p>
                    <p className="truncate text-[12px] text-ink-soft">{m.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-rose-300 text-rose-600 hover:bg-rose-50"
                    disabled={removeMember.isPending}
                    onClick={() => removeMember.mutate(m.userId)}
                  >
                    Xoá
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <Label htmlFor="member-search">Tìm người dùng</Label>
          <div className="flex gap-2">
            <Input
              id="member-search"
              placeholder="Nhập tên hoặc email…"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              className={inputCls}
            />
            <Button
              variant="outline"
              className="h-11 shrink-0 gap-2 rounded-xl border-2 border-ink/20 font-bold"
              disabled={selected.length === 0 || addMembers.isPending}
              onClick={() => addMembers.mutate()}
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Thêm vào nhóm ({selected.length})
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Đang tải danh sách người dùng…" />
        ) : !options || options.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">Không tìm thấy người dùng phù hợp.</p>
        ) : (
          <ul className="max-h-72 space-y-1.5 overflow-y-auto">
            {options.map((m) => (
              <li key={m.userId}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-3 py-2.5 transition-colors ${
                    selected.includes(m.userId) ? "border-blue/50 bg-blue-mist/60" : "border-ink/15 bg-paper hover:border-blue/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--blue)]"
                    checked={selected.includes(m.userId)}
                    onChange={(e) => toggle(m.userId, e.target.checked)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{m.displayName}</span>
                    <span className="block truncate text-[12px] text-ink-soft">{m.email}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <p className="text-[12px] text-ink-faint">
          Lưu ý: API hiện chưa cung cấp endpoint liệt kê thành viên sẵn có của nhóm — danh sách trên chỉ là nguồn chọn để thêm.
        </p>
    </>
  );
}
