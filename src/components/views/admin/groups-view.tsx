"use client";

import * as React from "react";
import {
  CheckCircle2,
  Pencil,
  Plus,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminUserRow } from "@/lib/client/api";
import {
  groupApi,
  roleApi,
  type Group,
  type GroupMemberRow,
  type OrgPermission,
  type OrgRole,
} from "@/lib/client/api-org";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import {
  Empty,
  PageHeader,
  Panel,
  PanelHeader,
} from "@/components/shared/primitives";
import { RoleBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AdminDialog,
  BrandButton,
  Field,
  FormInput,
  FormSelect,
  FormTextarea,
  LineButton,
  useToastAction,
} from "./admin-shared";

/* ============================ dialog tạo / sửa nhóm ============================ */

function GroupFormDialog({
  open,
  onOpenChange,
  editing,
  reload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Group | null;
  reload: () => void;
}) {
  const [form, setForm] = React.useState({ code: "", name: "", description: "" });
  const saveAction = useToastAction(() => {
    onOpenChange(false);
    reload();
  });

  React.useEffect(() => {
    if (open) {
      setForm(
        editing
          ? { code: editing.code, name: editing.name, description: editing.description ?? "" }
          : { code: "", name: "", description: "" }
      );
    }
  }, [open, editing]);

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên nhóm.");
      return;
    }
    if (form.description.length > 512) {
      toast.error("Mô tả tối đa 512 ký tự.");
      return;
    }
    saveAction.run(async () => {
      if (editing) {
        await groupApi.update(editing.id, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        toast.success(`Đã cập nhật nhóm "${form.name.trim()}".`);
      } else {
        const created = await groupApi.create({
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        });
        toast.success(`Đã tạo nhóm "${created.name}".`);
      }
    });
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={(o) => !saveAction.busy && onOpenChange(o)}
      title={editing ? `Sửa nhóm "${editing.name}"` : "Tạo nhóm mới"}
      description={editing ? `Mã nhóm: ${editing.code} (không thể đổi).` : "Nhóm gộp người dùng để gán vai trò và quyền theo lô."}
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={saveAction.busy}>
            Hủy
          </LineButton>
          <BrandButton onClick={submit} disabled={saveAction.busy}>
            {saveAction.busy ? <InlineSpinner className="size-4" /> : editing ? <Pencil className="size-4 icon" /> : <Plus className="size-4 icon" />}
            {saveAction.busy ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo nhóm"}
          </BrandButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Mã nhóm" hint={editing ? "Không thể đổi sau khi tạo." : "Chỉ a-z, 0-9 và gạch nối (3–64 ký tự), vd: nhom-frontend."}>
          <FormInput
            value={editing ? editing.code : form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="nhom-frontend"
            className="font-mono"
            disabled={Boolean(editing)}
            autoComplete="off"
          />
        </Field>
        <Field label="Tên nhóm">
          <FormInput
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nhóm Frontend"
          />
        </Field>
        <Field label="Mô tả" hint={`${form.description.length}/512 ký tự`}>
          <FormTextarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 512) }))}
            placeholder="Mô tả phạm vi của nhóm…"
            className="min-h-20"
          />
        </Field>
      </div>
    </AdminDialog>
  );
}

/* ============================ dialog thêm thành viên ============================ */

function AddMemberDialog({
  group,
  members,
  onOpenChange,
  reload,
}: {
  group: Group | null;
  members: GroupMemberRow[];
  onOpenChange: (open: boolean) => void;
  reload: () => void;
}) {
  const usersRes = useResource(
    () => (group ? adminApi.users({ page: 1, pageSize: 200 }) : Promise.resolve(null)),
    [group?.id]
  );
  const [userId, setUserId] = React.useState("");
  const addAction = useToastAction(() => {
    onOpenChange(false);
    reload();
  });

  React.useEffect(() => {
    if (group) setUserId("");
  }, [group]);

  const existing = new Set(members.map((m) => m.userId));
  const options = (usersRes.data?.data ?? [])
    .filter((u: AdminUserRow) => !existing.has(u.id))
    .map((u: AdminUserRow) => ({ value: u.id, label: `${u.displayName} (${u.email})` }));

  const submit = () => {
    if (!group || !userId) {
      toast.error("Chọn người dùng để thêm vào nhóm.");
      return;
    }
    addAction.run(async () => {
      try {
        await groupApi.addMember(group.id, userId);
        toast.success("Đã thêm thành viên vào nhóm.");
      } catch (err) {
        if (err instanceof Error && err.message.includes("đã có trong nhóm")) {
          toast.error("Thành viên đã có trong nhóm.");
          return;
        }
        throw err;
      }
    });
  };

  return (
    <AdminDialog
      open={Boolean(group)}
      onOpenChange={(o) => !addAction.busy && onOpenChange(o)}
      title={`Thêm thành viên vào "${group?.name ?? ""}"`}
      description="Chọn tài khoản trên nền tảng — quyền kế thừa theo vai trò của nhóm."
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={addAction.busy}>
            Hủy
          </LineButton>
          <BrandButton onClick={submit} disabled={addAction.busy || !userId}>
            {addAction.busy ? <InlineSpinner className="size-4" /> : <UserPlus className="size-4 icon" />}
            Thêm vào nhóm
          </BrandButton>
        </>
      }
    >
      {usersRes.loading ? (
        <LoadingBlock rows={3} />
      ) : usersRes.error ? (
        <ErrorBlock error={usersRes.error} onRetry={usersRes.reload} />
      ) : options.length === 0 ? (
        <Empty icon={<Users className="icon" />} title="Không còn người dùng để thêm" description="Tất cả tài khoản đã ở trong nhóm này." />
      ) : (
        <Field label="Người dùng">
          <FormSelect
            value={userId}
            onChange={setUserId}
            options={options}
            ariaLabel="Chọn người dùng"
          />
        </Field>
      )}
    </AdminDialog>
  );
}

/* ============================ view chính ============================ */

export function AdminGroups() {
  const groups = useResource(() => groupApi.list({ page: 1, pageSize: 100 }), []);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"members" | "roles">("members");

  const items = groups.data?.data ?? [];
  const selected = items.find((g) => g.id === selectedId) ?? null;

  React.useEffect(() => {
    if (!selectedId && items.length > 0) setSelectedId(items[0].id);
  }, [items, selectedId]);

  const members = useResource(
    () => (selected ? groupApi.members(selected.id) : Promise.resolve(null)),
    [selected?.id]
  );
  const rolesRes = useResource(() => roleApi.list({ page: 1, pageSize: 50 }), []);

  const memberRows = members.data?.data ?? [];
  const roleRows: OrgRole[] = rolesRes.data?.data ?? [];

  const groupRoles = useResource(
    () => (selected ? groupApi.roles(selected.id) : Promise.resolve(null)),
    [selected?.id]
  );
  const [selectedRoleCodes, setSelectedRoleCodes] = React.useState<string[]>([]);

  React.useEffect(() => {
    setSelectedRoleCodes((groupRoles.data?.data ?? []).map((r) => r.code));
  }, [groupRoles.data]);

  /* Quyền kế thừa: gộp permissions của các vai trò đang chọn, nhóm theo group. */
  const roleCodesKey = selectedRoleCodes.join(",");
  const inherited = useResource(
    () =>
      selectedRoleCodes.length
        ? Promise.all(selectedRoleCodes.map((code) => roleApi.permissions(code, { page: 1, pageSize: 100 })))
        : Promise.resolve(null),
    [roleCodesKey]
  );

  const inheritedByGroup = React.useMemo(() => {
    const map = new Map<string, OrgPermission[]>();
    (inherited.data ?? []).forEach((page) => {
      page.data.forEach((perm) => {
        const list = map.get(perm.group) ?? [];
        if (!list.some((p) => p.code === perm.code)) list.push(perm);
        map.set(perm.group, list);
      });
    });
    return Array.from(map.entries());
  }, [inherited.data]);

  /* ---------- actions ---------- */
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Group | null>(null);
  const [addMemberFor, setAddMemberFor] = React.useState<Group | null>(null);
  const [removing, setRemoving] = React.useState<GroupMemberRow | null>(null);
  const saveRolesAction = useToastAction(() => groupRoles.reload());
  const removeAction = useToastAction(() => {
    setRemoving(null);
    members.reload();
    groups.reload();
  });

  const toggleRole = (code: string, checked: boolean) => {
    setSelectedRoleCodes((prev) => (checked ? [...new Set([...prev, code])] : prev.filter((c) => c !== code)));
  };

  const saveRoles = () => {
    if (!selected) return;
    saveRolesAction.run(async () => {
      await groupApi.setRoles(selected.id, selectedRoleCodes);
      toast.success("Đã cập nhật vai trò của nhóm.");
    });
  };

  const confirmRemove = () => {
    if (!selected || !removing) return;
    removeAction.run(async () => {
      await groupApi.removeMember(selected.id, removing.userId);
      toast.success(`Đã gỡ ${removing.name} khỏi nhóm.`);
    });
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Nhóm người dùng"
        description="Gộp người dùng thành nhóm, gán vai trò theo nhóm và xem quyền được kế thừa."
        actions={
          <BrandButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4 icon" /> Tạo nhóm
          </BrandButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Trái: danh sách nhóm */}
        <div>
          {groups.loading ? (
            <LoadingBlock rows={4} />
          ) : groups.error ? (
            <ErrorBlock error={groups.error} onRetry={groups.reload} />
          ) : items.length === 0 ? (
            <Panel>
              <Empty
                icon={<Users className="icon" />}
                title="Chưa có nhóm nào"
                description="Tạo nhóm đầu tiên để gán vai trò theo lô."
                action={
                  <BrandButton
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="size-4 icon" /> Tạo nhóm
                  </BrandButton>
                }
              />
            </Panel>
          ) : (
            <div className="space-y-2">
              {items.map((g) => {
                const active = g.id === selectedId;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(g.id);
                      setTab("members");
                    }}
                    aria-pressed={active}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      active
                        ? "border-brand/50 bg-brand/[0.08]"
                        : "border-line bg-panel hover:border-line-strong hover:bg-panel-2"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold text-brand-bright/80">{g.code}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-dim">
                        <Users className="size-3.5 icon text-faint" /> {g.memberCount}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm font-semibold ${active ? "text-brand-bright" : "text-ink"}`}>{g.name}</p>
                    {g.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-faint">{g.description}</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Phải: chi tiết nhóm */}
        {!selected ? (
          <Panel>
            <Empty icon={<Users className="icon" />} title="Chọn một nhóm" description="Chi tiết thành viên và vai trò hiện ra ở đây." />
          </Panel>
        ) : (
          <div className="space-y-6">
            <Panel>
              <PanelHeader
                title={selected.name}
                description={selected.description}
                icon={<Users className="size-4 icon" />}
                actions={
                  <LineButton
                    size="sm"
                    onClick={() => {
                      setEditing(selected);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5 icon" /> Sửa nhóm
                  </LineButton>
                }
              />
              <div className="flex flex-wrap gap-2 px-5 py-4 text-xs text-dim">
                <span className="font-mono text-brand-bright">{selected.code}</span>
                <span className="text-faint">·</span>
                <span>{selected.memberCount} thành viên</span>
                {selected.createdAt ? (
                  <>
                    <span className="text-faint">·</span>
                    <span>tạo {formatDate(selected.createdAt)}</span>
                  </>
                ) : null}
              </div>
              <div className="flex gap-1 border-t border-line px-5 py-2.5">
                <TabButton active={tab === "members"} onClick={() => setTab("members")}>
                  Thành viên
                </TabButton>
                <TabButton active={tab === "roles"} onClick={() => setTab("roles")}>
                  Vai trò
                </TabButton>
              </div>

              {tab === "members" ? (
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3">
                    <span className="text-xs text-faint">{memberRows.length} thành viên</span>
                    <LineButton size="sm" onClick={() => setAddMemberFor(selected)}>
                      <UserPlus className="size-3.5 icon" /> Thêm thành viên
                    </LineButton>
                  </div>
                  {members.loading ? (
                    <div className="px-5 py-4">
                      <LoadingBlock rows={3} />
                    </div>
                  ) : members.error ? (
                    <div className="px-5 py-4">
                      <ErrorBlock error={members.error} onRetry={members.reload} />
                    </div>
                  ) : memberRows.length === 0 ? (
                    <Empty icon={<UserPlus className="icon" />} title="Nhóm chưa có thành viên" description="Thêm người dùng vào nhóm để kế thừa vai trò." />
                  ) : (
                    <ul className="divide-y divide-line">
                      {memberRows.map((m) => (
                        <li key={m.userId} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-panel-2/60">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">{m.name}</span>
                            <span className="block truncate font-mono text-[11px] text-dim">{m.email}</span>
                          </span>
                          <RoleBadge role={m.role} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-rose"
                            onClick={() => setRemoving(m)}
                            aria-label={`Gỡ ${m.name} khỏi nhóm`}
                          >
                            <UserMinus className="size-4 icon" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="px-5 py-4">
                  <p className="mb-3 text-xs text-faint">
                    Chọn vai trò cho cả nhóm — thành viên kế thừa toàn bộ quyền của các vai trò được chọn.
                  </p>
                  {rolesRes.loading ? (
                    <LoadingBlock rows={3} />
                  ) : rolesRes.error ? (
                    <ErrorBlock error={rolesRes.error} onRetry={rolesRes.reload} />
                  ) : (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {roleRows.map((r) => {
                          const checked = selectedRoleCodes.includes(r.code);
                          return (
                            <label
                              key={r.code}
                              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 transition-colors ${
                                checked ? "border-brand/50 bg-brand/[0.08]" : "border-line bg-deep/60 hover:border-line-strong"
                              }`}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => toggleRole(r.code, v === true)}
                                className="mt-0.5"
                                aria-label={`Vai trò ${r.name}`}
                              />
                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[13px] font-medium text-ink">{r.name}</span>
                                  <span className="font-mono text-[10px] text-faint">{r.code}</span>
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-relaxed text-faint">{r.description}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <BrandButton onClick={saveRoles} disabled={saveRolesAction.busy}>
                          {saveRolesAction.busy ? <InlineSpinner className="size-4" /> : <ShieldCheck className="size-4 icon" />}
                          Lưu vai trò nhóm
                        </BrandButton>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Panel>

            {/* Quyền kế thừa */}
            <Panel>
              <PanelHeader
                title="Quyền kế thừa"
                description="Tổng hợp quyền của các vai trò đang chọn, nhóm theo phân mục."
                icon={<ShieldCheck className="size-4 icon" />}
              />
              {selectedRoleCodes.length === 0 ? (
                <Empty icon={<ShieldCheck className="icon" />} title="Chưa chọn vai trò nào" description="Chọn vai trò ở tab Vai trò để xem quyền kế thừa." />
              ) : inherited.loading ? (
                <div className="px-5 py-4">
                  <LoadingBlock rows={3} />
                </div>
              ) : inherited.error ? (
                <div className="px-5 py-4">
                  <ErrorBlock error={inherited.error} onRetry={inherited.reload} />
                </div>
              ) : (
                <div className="space-y-4 px-5 py-5">
                  {inheritedByGroup.map(([group, perms]) => (
                    <div key={group}>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">{group}</p>
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {perms.map((perm) => (
                          <li
                            key={perm.code}
                            className="flex items-start gap-2 rounded-lg border border-line bg-deep/60 px-3 py-2"
                            title={perm.description}
                          >
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 icon text-emerald" />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-medium text-ink">{perm.name}</span>
                              <span className="block truncate font-mono text-[10px] text-faint">{perm.code}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}
      </div>

      <GroupFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} reload={groups.reload} />
      <AddMemberDialog
        group={addMemberFor}
        members={addMemberFor?.id === selected?.id ? memberRows : []}
        onOpenChange={(o) => !o && setAddMemberFor(null)}
        reload={() => {
          members.reload();
          groups.reload();
        }}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !removeAction.busy && !o && setRemoving(null)}
        title={removing ? `Gỡ ${removing.name} khỏi nhóm?` : ""}
        description="Thành viên mất các quyền kế thừa từ nhóm này. Có thể thêm lại bất cứ lúc nào."
        confirmLabel="Gỡ khỏi nhóm"
        destructive
        busy={removeAction.busy}
        onConfirm={confirmRemove}
      />
    </ViewFrame>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 rounded-lg px-3.5 text-[13px] font-medium transition-colors ${
        active ? "bg-brand/12 text-brand-bright" : "text-dim hover:bg-panel-2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
