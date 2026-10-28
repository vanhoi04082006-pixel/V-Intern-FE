"use client";

import * as React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { roleApi, type OrgPermission, type OrgRole } from "@/lib/client/api-org";
import { useResource } from "@/lib/client/use-resource";
import {
  Empty,
  PageHeader,
  Panel,
  PanelHeader,
  ToneBadge,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { ViewFrame } from "@/components/shared/view";

export function AdminRoles() {
  const roles = useResource(() => roleApi.list({ page: 1, pageSize: 50 }), []);
  const [selected, setSelected] = React.useState<OrgRole | null>(null);

  const items = roles.data?.data ?? [];

  const permissions = useResource(
    () =>
      selected
        ? roleApi.permissions(selected.code, { page: 1, pageSize: 100 })
        : Promise.resolve(null),
    [selected?.code]
  );
  const perms: OrgPermission[] = permissions.data?.data ?? [];

  /* Nhóm quyền theo phân mục. */
  const byGroup = React.useMemo(() => {
    const map = new Map<string, OrgPermission[]>();
    perms.forEach((p) => {
      const list = map.get(p.group) ?? [];
      list.push(p);
      map.set(p.group, list);
    });
    return Array.from(map.entries());
  }, [perms]);

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Vai trò & quyền"
        description="Danh mục vai trò của hệ thống và quyền tương ứng — chỉ đọc, phân quyền qua nhóm người dùng."
      />

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* Trái: danh sách vai trò */}
        <div>
          {roles.loading ? (
            <LoadingBlock rows={5} />
          ) : roles.error ? (
            <ErrorBlock error={roles.error} onRetry={roles.reload} />
          ) : items.length === 0 ? (
            <Panel>
              <Empty icon={<ShieldCheck className="icon" />} title="Chưa có vai trò nào" />
            </Panel>
          ) : (
            <Panel className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" style={{ minWidth: 380 }}>
                  <thead className="bg-deep/50">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                        Mã vai trò
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                        Tên vai trò
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-faint">
                        Quyền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => {
                      const active = selected?.code === r.code;
                      return (
                        <tr
                          key={r.code}
                          onClick={() => setSelected(r)}
                          className={`cursor-pointer border-t border-line transition-colors ${
                            active ? "bg-brand/[0.08]" : "hover:bg-panel-2/60"
                          }`}
                          aria-pressed={active}
                        >
                          <td className="px-4 py-3 align-middle">
                            <span className={`font-mono text-xs ${active ? "text-brand-bright" : "text-dim"}`}>
                              {r.code}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <p className={`text-sm font-medium ${active ? "text-brand-bright" : "text-ink"}`}>
                              {r.name}
                            </p>
                            <p className="line-clamp-1 text-[11px] text-faint">{r.description}</p>
                          </td>
                          <td className="px-4 py-3 text-right align-middle">
                            <ToneBadge tone={active ? "brand" : "zinc"}>{r.permissionCount ?? 0}</ToneBadge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>

        {/* Phải: quyền của vai trò đang chọn */}
        {!selected ? (
          <Panel>
            <Empty
              icon={<ShieldCheck className="icon" />}
              title="Chọn một vai trò để xem quyền"
              description="Danh sách quyền của vai trò sẽ hiện ở đây, nhóm theo phân mục."
            />
          </Panel>
        ) : (
          <Panel>
            <PanelHeader
              title={`Quyền của vai trò — ${selected.name}`}
              description={selected.description}
              icon={<ShieldCheck className="size-4 icon" />}
              actions={
                <ToneBadge tone="brand" dot>
                  {perms.length} quyền
                </ToneBadge>
              }
            />
            {permissions.loading ? (
              <div className="px-5 py-4">
                <LoadingBlock rows={4} />
              </div>
            ) : permissions.error ? (
              <div className="px-5 py-4">
                <ErrorBlock error={permissions.error} onRetry={permissions.reload} />
              </div>
            ) : byGroup.length === 0 ? (
              <Empty icon={<ShieldCheck className="icon" />} title="Vai trò chưa có quyền nào" />
            ) : (
              <div className="space-y-5 px-5 py-5">
                {byGroup.map(([group, groupPerms]) => (
                  <section key={group}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">{group}</p>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                      {groupPerms.map((perm) => (
                        <li
                          key={perm.code}
                          className="flex items-start gap-2.5 rounded-xl border border-line bg-deep/60 px-3.5 py-2.5"
                          title={perm.description}
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 icon text-emerald" />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-ink">{perm.name}</span>
                            <span className="block truncate font-mono text-[10px] text-faint">{perm.code}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                <p className="text-xs text-faint">
                  Chỉ đọc — quyền được định nghĩa sẵn theo vai trò; gán vai trò cho người dùng qua Nhóm.
                </p>
              </div>
            )}
          </Panel>
        )}
      </div>
    </ViewFrame>
  );
}
