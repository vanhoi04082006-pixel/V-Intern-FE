"use client";
import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import * as api from "@/lib/api/admin";
import { useResource } from "@/lib/api/use-resource";
import { getSessionUser } from "@/lib/auth/session";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { IconArrowUpRight, IconCircleCheck, IconClock, IconTimer } from "@/components/v-intern/icons";
import {
  Badge,
  buttonClass,
  Empty,
  inputClass,
  MetricCard,
  Modal,
  PageTitle,
  Pager,
  Panel,
  StatusDot,
} from "./primitives";
import { useAction } from "./use-action";
import { Can } from "@/components/auth/can";
import { CollectionMetrics, CollectionAside } from "./collection-insights";
import { AdminSystemStatus } from '@/components/admin/system-status';
import { linkButtonClass, TimelineItem } from '@/components/admin/ui-bits';
import { StampMoc } from "@/components/workspace/notebook";
import { CheckDoodle, Tape } from "@/components/v-intern/doodles";
function Result<T>({
  resource: r,
  children,
}: {
  resource: { data?: T; loading: boolean; error?: unknown; reload: () => void };
  children: (data: T) => ReactNode;
}) {
  return r.loading ? (
    <LoadingState />
  ) : r.error ? (
    <ErrorState error={r.error} onRetry={r.reload} />
  ) : r.data !== undefined ? (
    children(r.data)
  ) : null;
}
/** User lifecycle states are backend codes; display them in Vietnamese with
 * raw-code fallback so unknown states stay visible instead of blank. */
const userStatusLabels: Record<string, string> = {
  active: "Đang hoạt động",
  pending: "Chờ kích hoạt",
  locked: "Đã khóa",
  deleted: "Đã xóa",
};
const userStatusOptions = ["active", "pending", "locked", "deleted"] as const;

export function AdminOverview() {
  const counts = useResource(
    useCallback(async (s: AbortSignal) => {
      const results = await Promise.all([
        api.listUsers(1, "", "", s),
        api.listGroups(1, "", s),
        api.listRoles(1, s),
        api.listAudits(1, {}, s),
      ]);
      return results.map((x) => x.total);
    }, []),
  );
  return (
    <>
      <PageTitle
        title="Trang quản trị"
        subtitle="Tổng quan quản trị và hoạt động được ghi nhận trong hệ thống"
      />
      <Result resource={counts}>
        {(c) => (
          <CollectionMetrics values={[["Người dùng", c[0]], ["Nhóm", c[1]], ["Vai trò", c[2]], ["Bản ghi audit", c[3]]]} />
        )}
      </Result>
      <div className="admin-overview-grid">
        <div>
          <AdminActivity compact />
        </div>
        <section className="admin-overview-actions" aria-label="Thao tác quản trị">
          <h2 className="text-subsection font-semibold text-foreground">Thao tác quản trị</h2>
          <nav className="mt-3 divide-y divide-border">
            {[
              ["users", "Quản lý người dùng"],
              ["groups", "Nhóm và quyền kế thừa"],
              ["catalogs", "Danh mục hệ thống"],
              ["services", "Kiểm tra dịch vụ"],
              ["audit", "Tra cứu audit"],
            ].map(([href, label]) => (
              <Link
                key={href}
                className="flex min-h-11 items-center justify-between gap-3 py-3 text-body font-medium text-muted-foreground transition-colors hover:text-primary"
                href={"/admin/" + href}
              >
                {label}
                <IconArrowUpRight size={16} aria-hidden />
              </Link>
            ))}
          </nav>
          {/* Ghi chú "Vận hành an toàn" dạng giấy note menthol — giữ nguyên nội
              dung gốc của hộp vai trò, nâng bằng chất liệu sổ tay. */}
          <aside className="sticky-note-mint mt-6 p-4">
            <p className="font-hand mb-1 text-lg leading-snug">Vận hành an toàn</p>
            <p className="text-small leading-relaxed">
              Phân quyền, cấu hình và nhật ký hệ thống đều được kiểm soát tại đây.
            </p>
          </aside>
        </section>
      </div>
    </>
  );
}
export function UserPicker({
  value,
  onChange,
  label = "Người dùng",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [page, setPage] = useState(1),
    [q, setQ] = useState("");
  const rows = useResource(
    useCallback(
      (s: AbortSignal) => api.listUsers(page, q, "active", s),
      [page, q],
    ),
  );
  const selected = useResource(
    useCallback(
      (s: AbortSignal) =>
        value ? api.getUser(value, s) : Promise.resolve(null),
      [value],
    ),
  );
  return (
    <div className="space-y-2">
      <input
        className={inputClass}
        aria-label={"Tìm " + label.toLowerCase()}
        placeholder="Tìm tên hoặc email…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
      />
      <select
        className={inputClass}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Chọn người dùng</option>
        {value && !rows.data?.items.some((x) => x.id === value) && (
          <option value={value}>
            {selected.data?.displayName ?? "Đang tải lựa chọn"}
          </option>
        )}
        {rows.data?.items.map((u) => (
          <option key={u.id} value={u.id}>
            {u.displayName}, {u.email}
          </option>
        ))}
      </select>
      <Result resource={rows}>
        {(data) => <Pager {...data} onChange={setPage} />}
      </Result>
    </div>
  );
}
function RoleChoices({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [page, setPage] = useState(1),
    roles = useResource(
      useCallback((s: AbortSignal) => api.listRoles(page, s), [page]),
    );
  return (
    <Result resource={roles}>
      {(r) => (
        <fieldset className="space-y-3">
          <legend className="mb-2 text-body font-semibold">Vai trò</legend>
          {r.items.map((role) => (
            <label
              key={role.id}
              className="admin-selection-row text-body"
            >
              <input
                type="checkbox"
                checked={value.includes(role.code)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...value, role.code]
                      : value.filter((c) => c !== role.code),
                  )
                }
              />
              <span>
                {role.name}
                <small className="ml-2 text-muted-foreground">{role.code}</small>
              </span>
            </label>
          ))}
          <Pager {...r} onChange={setPage} />
        </fieldset>
      )}
    </Result>
  );
}
export function AdminUsers() {
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [roleCode, setRoleCode] = useState(""),
    [rolePage, setRolePage] = useState(1),
    [create, setCreate] = useState(false),
    [edit, setEdit] = useState<ReturnType<typeof api.parseUser>>();
  const users = useResource(
      useCallback(
        (s: AbortSignal) => api.listUsers(page, q, status, s, roleCode),
        [page, q, status, roleCode],
      ),
    ),
    action = useAction(() => { setNotice("Đã cập nhật trạng thái tài khoản."); users.reload(); });
  const roleOptions = useResource(
    useCallback(
      (signal: AbortSignal) => api.listRoles(rolePage, signal),
      [rolePage],
    ),
  );
  return (
    <>
      <PageTitle
        title="Quản lý người dùng"
        subtitle="Danh sách và trạng thái tài khoản từ cơ sở dữ liệu"
        action={
          <Can perm="users.create">
            <button className={buttonClass} onClick={() => { setNotice(""); setCreate(true); }}>
              Tạo người dùng
            </button>
          </Can>
        }
      />
      {notice && !action.busy && !action.error && <p role="status" className="mb-5 border-l border-success pl-3 text-body text-success">{notice}</p>}
      {!users.loading && !users.error && users.data && (
        <CollectionMetrics
          values={[
            ["Kết quả bộ lọc", users.data.total],
            [
              "Đang hoạt động, trang",
              users.data.items.filter((u) => u.status === "active").length,
            ],
            [
              "Chờ kích hoạt, trang",
              users.data.items.filter((u) => u.status === "pending").length,
            ],
            [
              "Bị khóa, trang",
              users.data.items.filter((u) => u.status === "locked").length,
            ],
            [
              "Đã xóa, trang",
              users.data.items.filter((u) => u.status === "deleted").length,
            ],
          ]}
          note="Tổng theo bộ lọc; thống kê trạng thái dùng trang hiện tại. Chưa có dữ liệu lịch sử tăng trưởng."
        />
      )}
      <div className="admin-collection-layout">
        <Panel title="Tài khoản">
          <div className="mb-4">
            <select
              aria-label="Lọc vai trò người dùng"
              className={inputClass}
              value={roleCode}
              onChange={(e) => {
                setRoleCode(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả vai trò</option>
              {roleOptions.data?.items.map((r) => (
                <option key={r.id} value={r.code}>
                  {r.name}
                </option>
              ))}
              {roleCode &&
                !roleOptions.data?.items.some((r) => r.code === roleCode) && (
                  <option value={roleCode}>{roleCode}</option>
                )}
            </select>
            {Boolean(roleOptions.error) && (
              <ErrorState
                error={roleOptions.error}
                onRetry={roleOptions.reload}
              />
            )}
            {roleOptions.data && roleOptions.data.totalPages > 1 && (
              <Pager {...roleOptions.data} onChange={setRolePage} />
            )}
          </div>
          {Boolean(action.error) && <ErrorState error={action.error} />}
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <input
              className={inputClass}
              aria-label="Tìm người dùng"
              placeholder="Tìm tên, email hoặc username…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <select
              className={inputClass}
              aria-label="Trạng thái người dùng"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              {userStatusOptions.map((s) => (
                <option key={s} value={s}>{userStatusLabels[s]}</option>
              ))}
            </select>
          </div>
          <Result resource={users}>
            {(data) => (
              <>
                {data.items.length ? (
                  <div className="notebook-scroll max-h-[65vh] overflow-x-auto overflow-y-auto" role="region" aria-label="Danh sách người dùng" tabIndex={0}>
                    <table className="w-full min-w-[52rem] text-left text-body">
                      <thead className="bg-muted/50">
                        <tr>
                          {[
                            "Người dùng",
                            "Username",
                            "Trạng thái",
                            "Đăng nhập gần nhất",
                            "Thao tác",
                          ].map((x) => (
                            <th key={x} className={`p-3 ${x === "Thao tác" ? "text-right" : ""}`}>
                              {x}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((u) => (
                          <tr key={u.id} className="border-b border-border">
                            <td className="p-3">
                              <strong className="block text-foreground">
                                {u.displayName}
                              </strong>
                              <span className="text-caption text-muted-foreground">
                                {u.email}
                              </span>
                            </td>
                            <td className="p-3">{u.username}</td>
                            <td className="p-3">
                              <Badge
                                tone={
                                  u.status === "locked" || u.status === "deleted"
                                    ? "red"
                                    : undefined
                                }
                              >
                                {userStatusLabels[u.status] ?? u.status}
                              </Badge>
                              {/* Trạng thái cuối vòng đời (khóa/xóa) được đóng
                                  mộc đỏ đậm — hành chính "đã chốt", không thể
                                  đảo ngược; trạng thái khác giữ badge mềm. */}
                              {(u.status === "locked" || u.status === "deleted") && (
                                <StampMoc
                                  tone="red"
                                  size="sm"
                                  rotate={-6}
                                  className="nb-moc-allowed ml-2 align-middle"
                                >
                                  {userStatusLabels[u.status] ?? u.status}
                                </StampMoc>
                              )}
                            </td>
                            <td className="p-3">
                              {u.lastLoginAt
                                ? new Date(u.lastLoginAt).toLocaleString(
                                    "vi-VN",
                                  )
                                : "Chưa đăng nhập"}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col items-end gap-2">
                                <button
                                  className={`${linkButtonClass} text-primary hover:underline underline-offset-4`}
                                  onClick={() => { setNotice(""); setEdit(u); }}
                                >
                                  Sửa tài khoản
                                </button>
                                <select
                                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                                  aria-label={"Trạng thái " + u.email}
                                value={u.status}
                                disabled={
                                  action.busy || u.id === getSessionUser()?.id
                                }
                                onChange={(e) =>
                                  void action.run(() =>
                                    api.setUserStatus(u.id, e.target.value),
                                  )
                                }
                              >
                                {userStatusOptions.map(
                                  (s) => (
                                    <option key={s} value={s}>{userStatusLabels[s]}</option>
                                  ),
                                )}
                              </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title="Không tìm thấy người dùng"
                    description="Thử đổi từ khóa hoặc bộ lọc trạng thái, vai trò ở phía trên."
                  />
                )}
                <Pager {...data} onChange={setPage} />
              </>
            )}
          </Result>
        </Panel>
        {!users.loading && !users.error && users.data && (
          <CollectionAside
            rows={users.data.items.map((u) => ({
              status: userStatusLabels[u.status] ?? u.status,
            }))}
            title="Phân bố tài khoản"
            links={[
              ["/admin/groups", "Phân nhóm người dùng"],
              ["/admin/roles", "Tra cứu quyền"],
              ["/admin/audit", "Hoạt động người dùng"],
            ]}
          />
        )}
      </div>
      {(create || edit) && (
        <Modal
          title={edit ? "Sửa người dùng" : "Tạo người dùng"}
          onClose={() => {
            setCreate(false);
            setEdit(undefined);
          }}
        >
          <UserForm
            user={edit}
            onSaved={() => {
              setNotice("Đã lưu tài khoản và cập nhật danh sách người dùng.");
              setCreate(false);
              setEdit(undefined);
              users.reload();
            }}
          />
        </Modal>
      )}
    </>
  );
}
function UserForm({
  user,
  onSaved,
}: {
  user?: ReturnType<typeof api.parseUser>;
  onSaved: () => void;
}) {
  const action = useAction(onSaved),
    [roles, setRoles] = useState<string[]>([]);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void action.run(() =>
          api.saveUser(user?.id, {
            displayName: String(f.get("name")),
            username: String(f.get("username")),
            ...(!user
              ? {
                  email: String(f.get("email")),
                  password: String(f.get("password")),
                  roleCodes: roles,
                }
              : {}),
          }),
        );
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <label className="block text-body">
        Họ tên
        <input
          name="name"
          required
          maxLength={128}
          className={inputClass}
          placeholder="VD: Nguyễn Thị B"
          defaultValue={user?.displayName}
        />
      </label>
      <label className="block text-body">
        Username
        <input
          name="username"
          required
          minLength={3}
          maxLength={64}
          pattern="[a-z0-9_.-]{3,64}"
          className={inputClass}
          placeholder="vd: nguyenthib"
          defaultValue={user?.username}
        />
      </label>
      {!user && (
        <>
          <label className="block text-body">
            Email
            <input name="email" required type="email" className={inputClass} placeholder="vd: nguyenthib@truong.edu.vn" />
          </label>
          <label className="block text-body">
            Mật khẩu khởi tạo
            <input
              name="password"
              autoComplete="new-password"
              required
              type="password"
              minLength={10}
              maxLength={72}
              className={inputClass}
              placeholder="Tối thiểu 10 ký tự"
            />
          </label>
          <RoleChoices value={roles} onChange={setRoles} />
        </>
      )}
      <div className="flex justify-end">
        <button className={buttonClass} disabled={action.busy}>
          Lưu người dùng
        </button>
      </div>
    </form>
  );
}
export function AdminRoles() {
  const [rolePage, setRolePage] = useState(1),
    [page, setPage] = useState(1),
    [role, setRole] = useState<ReturnType<typeof api.parseNamed>>();
  const roles = useResource(
      useCallback((s: AbortSignal) => api.listRoles(rolePage, s), [rolePage]),
    ),
    permissions = useResource(
      useCallback(
        (s: AbortSignal) => api.listPermissions(page, role?.id ?? "", s),
        [page, role?.id],
      ),
    );
  return (
    <>
      <PageTitle
        title="Vai trò & quyền"
        subtitle="Các quyền được cấp trong chính sách RBAC hiện hành"
      />
      {roles.data && permissions.data && (
        <CollectionMetrics
          values={[
            ["Vai trò", roles.data.total],
            ["Quyền trong lựa chọn", permissions.data.total],
            ["Quyền, trang", permissions.data.items.length],
            ["Vai trò, trang", roles.data.items.length],
            ["Nhóm quyền, trang", new Set(permissions.data.items.map((p) => p.code.split(".")[0])).size],
          ]}
          note="Quyền theo vai trò đang chọn; không suy ra số người dùng từ chính sách RBAC."
        />
      )}
      <div className="admin-role-layout">
        <Panel title="Vai trò">
          <Result resource={roles}>
            {(r) => (
              <>
                <button
                  className={`${linkButtonClass} -ml-1 text-muted-foreground hover:text-foreground`}
                  onClick={() => {
                    setRole(undefined);
                    setPage(1);
                  }}
                >
                  Tất cả quyền
                </button>
                <div className="overflow-x-auto" role="region" aria-label="Danh sách vai trò" tabIndex={0}>
                  <table className="w-full min-w-[36rem] text-left text-body">
                    <thead className="bg-muted/50"><tr>{["Vai trò", "Mã vai trò", "Mô tả"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
                    <tbody>{r.items.map(v => <tr key={v.id} className={`border-b border-border ${role?.id === v.id ? "bg-info-subtle" : ""}`}>
                      <td className="p-3"><button className="min-h-11 rounded-control px-1 text-left font-semibold text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" aria-label={`${v.name}, ${v.code}`} aria-pressed={role?.id === v.id} onClick={() => { setRole(v); setPage(1); }}>{v.name}</button></td>
                      <td className="p-3"><Badge>{v.code}</Badge></td>
                      <td className="p-3 text-muted-foreground">{v.description ?? "Chưa có mô tả"}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
                <Pager {...r} onChange={setRolePage} />
              </>
            )}
          </Result>
        </Panel>
        <Panel title={role ? "Quyền của " + role.name : "Danh sách quyền"}>
          <p className="mb-4 rounded-control bg-info-subtle p-3 text-body text-info">
            Chính sách vai trò được quản lý tại Backend. Trang này tra cứu các
            quyền đã cấp; quyền kế thừa cho người dùng được cấu hình qua nhóm.
          </p>
          <Result resource={permissions}>
            {(p) => (
              <>
                {p.items.map((v) => (
                  <article
                    key={v.id}
                    className="admin-permission-row"
                  >
                    <span
                      className="text-success"
                      role="img"
                      aria-label={role ? "Đã cấp" : "Quyền hệ thống"}
                    >
                      <IconCircleCheck size={16} aria-hidden />
                    </span>
                    <div>
                      <strong className="text-body">{v.name}</strong>
                      <p className="mt-1 break-all text-caption text-primary">
                        {v.code}
                      </p>
                      <p className="mt-1 text-caption text-muted-foreground">
                        {v.description}
                      </p>
                    </div>
                  </article>
                ))}
                <Pager {...p} onChange={setPage} />
              </>
            )}
          </Result>
        </Panel>
      </div>
    </>
  );
}
export function AdminGroups() {
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [create, setCreate] = useState(false),
    [selected, setSelected] = useState<ReturnType<typeof api.parseNamed>>();
  const rows = useResource(
    useCallback((s: AbortSignal) => api.listGroups(page, q, s), [page, q]),
  );
  return (
    <>
      <PageTitle
        title="Nhóm người dùng"
        subtitle="Quản lý thành viên và vai trò kế thừa"
        action={
          <button className={buttonClass} onClick={() => setCreate(true)}>
            Tạo nhóm
          </button>
        }
      />
      {notice && <p role="status" className="mb-5 border-l border-success pl-3 text-body text-success">{notice}</p>}
      {rows.data && (
        <CollectionMetrics
          values={[
            ["Nhóm phù hợp", rows.data.total],
            ["Nhóm, trang", rows.data.items.length],
            [
              "Có mô tả, trang",
              rows.data.items.filter((g) => Boolean(g.description)).length,
            ],
            ["Số trang", rows.data.totalPages],
          ]}
          note="Số liệu theo bộ lọc hiện tại. Thành viên và vai trò kế thừa được tra cứu trong chi tiết từng nhóm."
        />
      )}
      <Panel title="Danh sách nhóm">
        <input
          className={`${inputClass} mb-4`}
          aria-label="Tìm nhóm"
          placeholder="Tìm mã hoặc tên nhóm…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <Result resource={rows}>
          {(r) => (
            <>
              {r.items.length ? (
                <div className="overflow-x-auto" role="region" aria-label="Danh sách nhóm" tabIndex={0}>
                  <table className="w-full min-w-[32rem] text-left text-body">
                    <thead className="bg-muted/50"><tr>{["Nhóm", "Mô tả", "Quản lý"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
                    <tbody>{r.items.map(g => <tr key={g.id} className="border-b border-border">
                      <td className="p-3"><button className="min-h-11 rounded-control px-1 text-left font-semibold text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" onClick={() => setSelected(g)}><span className="block">{g.name}</span><small className="mt-1 block font-normal text-muted-foreground">{g.code}</small></button></td>
                      <td className="p-3 text-muted-foreground">{g.description ?? "Chưa có mô tả"}</td>
                      <td className="p-3 text-caption text-muted-foreground">Thành viên, Vai trò</td>
                    </tr>)}</tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="Chưa có nhóm nào"
                  description="Tạo nhóm để gán quyền kế thừa cho nhiều người dùng cùng lúc."
                />
              )}
              <Pager {...r} onChange={setPage} />
            </>
          )}
        </Result>
      </Panel>
      {create && (
        <Modal title="Tạo nhóm" onClose={() => setCreate(false)}>
          <GroupForm
            onSaved={() => {
              setNotice("Đã tạo nhóm người dùng.");
              setCreate(false);
              rows.reload();
            }}
          />
        </Modal>
      )}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(undefined)}>
          <GroupDetail group={selected} onSaved={() => { setNotice("Đã cập nhật nhóm, thành viên hoặc vai trò kế thừa."); rows.reload(); }} />
        </Modal>
      )}
    </>
  );
}
function GroupForm({
  group,
  onSaved,
}: {
  group?: ReturnType<typeof api.parseNamed>;
  onSaved: () => void;
}) {
  const action = useAction(onSaved);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void action.run(() =>
          api.saveGroup(group?.id, {
            name: String(f.get("name")),
            description: String(f.get("description")),
            ...(!group ? { code: String(f.get("code")) } : {}),
          }),
        );
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      {!group && (
        <label className="block text-body">
          Mã nhóm
          <input
            name="code"
            required
            pattern="[a-z0-9_.-]{3,64}"
            className={inputClass}
            placeholder="vd: nhom-mentor"
          />
        </label>
      )}
      <label className="block text-body">
        Tên nhóm
        <input
          name="name"
          required
          maxLength={128}
          className={inputClass}
          placeholder="VD: Mentor khoá 2026"
          defaultValue={group?.name}
        />
      </label>
      <label className="block text-body">
        Mô tả nhóm
        <textarea
          name="description"
          maxLength={512}
          className={inputClass}
          placeholder="Nhóm này dùng để làm gì, ai sẽ được thêm vào?"
          defaultValue={group?.description ?? ""}
        />
      </label>
      <div className="flex justify-end">
        <button className={buttonClass} disabled={action.busy}>
          Lưu nhóm
        </button>
      </div>
    </form>
  );
}
function GroupDetail({
  group,
  onSaved,
}: {
  group: ReturnType<typeof api.parseNamed>;
  onSaved: () => void;
}) {
  const [userId, setUserId] = useState("");
  const members = useResource(
      useCallback(
        async (s: AbortSignal) => {
          const rows = await api.getGroupMembers(group.id, s);
          return Promise.all(
            rows.map(async (m) => ({
              ...m,
              user: await api.getUser(m.userId, s),
            })),
          );
        },
        [group.id],
      ),
    ),
    roles = useResource(
      useCallback(
        (s: AbortSignal) => api.getGroupRoles(group.id, s),
        [group.id],
      ),
    ),
    action = useAction(() => {
      members.reload();
      roles.reload();
      onSaved();
    });
  return (
    <div className="space-y-5">
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <Panel title="Thông tin nhóm">
        <GroupForm group={group} onSaved={onSaved} />
      </Panel>
      <Panel title="Thành viên">
        <Result resource={members}>
          {(r) => (
            <>
              {r.length ? (
                r.map((m) => (
                  <div
                    key={m.userId}
                    className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-control bg-muted/50 p-3 text-body"
                  >
                    <div>
                      <strong>{m.user.displayName}</strong>
                      <p className="text-caption text-muted-foreground">{m.user.email}</p>
                    </div>
                    <button
                      className={`${linkButtonClass} -ml-1 text-destructive hover:underline underline-offset-4`}
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(() =>
                          api.removeGroupMember(group.id, m.userId),
                        )
                      }
                    >
                      Gỡ thành viên
                    </button>
                  </div>
                ))
              ) : (
                <Empty title="Chưa có thành viên" description="Thêm người dùng đầu tiên vào nhóm bằng ô tìm kiếm phía dưới." />
              )}
            </>
          )}
        </Result>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              await api.addGroupMember(group.id, userId);
              setUserId("");
            });
          }}
        >
          <UserPicker
            label="Thành viên nhóm"
            value={userId}
            onChange={setUserId}
          />
          <div className="flex justify-end">
            <button className={buttonClass} disabled={action.busy || !userId}>
              Thêm thành viên
            </button>
          </div>
        </form>
      </Panel>
      <Panel title="Vai trò của nhóm">
        <Result resource={roles}>
          {(r) => (
            <>
              <GroupRoleForm
                key={r.join(",")}
                id={group.id}
                roles={r}
                onSaved={() => {
                  roles.reload();
                  onSaved();
                }}
              />
              <GroupPermissionSummary roleCodes={r.join(",")} />
            </>
          )}
        </Result>
      </Panel>
    </div>
  );
}
function GroupPermissionSummary({ roleCodes }: { roleCodes: string }) {
  const summary = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        const wanted = roleCodes.split(",").filter(Boolean);
        if (!wanted.length) return [];
        const roles = [] as ReturnType<typeof api.parseNamed>[];
        let page = 1;
        while (true) {
          const data = await api.listRoles(page, signal);
          roles.push(...data.items.filter((r) => wanted.includes(r.code)));
          if (page >= data.totalPages) break;
          page++;
        }
        return Promise.all(
          roles.map(async (role) => ({
            role,
            grants: await api.listPermissions(1, role.id, signal),
          })),
        );
      },
      [roleCodes],
    ),
  );
  return (
    <div className="mt-5">
      <h3 className="mb-3 text-body font-semibold">Quyền kế thừa từ nhóm</h3>
      <Result resource={summary}>
        {(data) =>
          data.length ? (
            <div className="space-y-3">
              {data.map(({ role, grants }) => (
                <div
                  key={role.id}
                  className="rounded-control bg-muted/50 p-3 text-body"
                >
                  <strong>
                    {role.name}, {grants.total} quyền
                  </strong>
                  <p className="mt-2 break-all text-caption text-muted-foreground">
                    {grants.items.map((p) => p.code).join(", ")}
                  </p>
                  {grants.totalPages > 1 && (
                    <p className="mt-2 text-caption">
                      Danh sách rút gọn trang 1.{" "}
                      <Link className="text-primary" href="/admin/roles">
                        Tra cứu toàn bộ quyền
                      </Link>
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty title="Nhóm chưa được cấp vai trò" description="Chọn vai trò ở trên để nhóm kế thừa các quyền tương ứng." />
          )
        }
      </Result>
    </div>
  );
}
function GroupRoleForm({
  id,
  roles,
  onSaved,
}: {
  id: string;
  roles: string[];
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState(roles),
    action = useAction(onSaved);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void action.run(() => api.setGroupRoles(id, selected));
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <RoleChoices value={selected} onChange={setSelected} />
      <Can perm="groups.manage">
        <div className="flex justify-end">
          <button className={buttonClass} disabled={action.busy}>
            Lưu vai trò nhóm
          </button>
        </div>
      </Can>
    </form>
  );
}
export function AdminCatalogs() {
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1),
    [itemPage, setItemPage] = useState(1),
    [type, setType] = useState<ReturnType<typeof api.parseNamed>>(),
    [createType, setCreateType] = useState(false),
    [create, setCreate] = useState(false),
    [focusedId, setFocusedId] = useState<string>(),
    [edit, setEdit] = useState<ReturnType<typeof api.parseCatalogItem>>();
  const types = useResource(
      useCallback((s: AbortSignal) => api.listCatalogTypes(page, s), [page]),
    ),
    items = useResource(
      useCallback(
        (s: AbortSignal) => api.listCatalogItems(itemPage, type?.code ?? "", s),
        [itemPage, type?.code],
      ),
    );
  return (
    <>
      <PageTitle
        title="Danh mục dùng chung"
        subtitle="Các loại danh mục và giá trị đang lưu trong hệ thống"
        action={
          <button className={buttonClass} onClick={() => setCreateType(true)}>
            Tạo loại danh mục
          </button>
        }
      />
      {notice && <p role="status" className="mb-5 border-l border-success pl-3 text-body text-success">{notice}</p>}
      {types.data && items.data && (
        <CollectionMetrics
          values={[
            ["Loại danh mục", types.data.total],
            ["Giá trị trong lựa chọn", items.data.total],
            [
              "Đang sử dụng, trang",
              items.data.items.filter((v) => v.isActive).length,
            ],
            [
              "Tạm ngừng, trang",
              items.data.items.filter((v) => !v.isActive).length,
            ],
          ]}
          note="Tổng giá trị theo loại đang chọn; trạng thái đếm trên trang hiện tại."
        />
      )}
      <div className="admin-catalog-layout">
        <Panel title="Loại danh mục">
          <Result resource={types}>
            {(r) => (
              <>
                {r.items.map((t) => (
                  <button
                    key={t.id}
                    className={`admin-selection-row w-full text-body ${type?.id === t.id ? "text-primary" : "text-muted-foreground"}`}
                    aria-pressed={type?.id === t.id}
                    onClick={() => {
                      setType(t);
                      setItemPage(1);
                      setFocusedId(undefined);
                    }}
                  >
                    <strong>{t.name}</strong>
                    <small className="block text-muted-foreground">{t.code}</small>
                  </button>
                ))}
                <Pager {...r} onChange={setPage} />
              </>
            )}
          </Result>
        </Panel>
        <Panel
          title={type?.name ?? "Giá trị danh mục"}
          action={
            type && (
              <button className={buttonClass} onClick={() => setCreate(true)}>
                Tạo giá trị
              </button>
            )
          }
        >
          <Result resource={items}>
            {(r) => (
              <>
                {r.items.length ? (
                  r.items.map((v) => (
                    <button
                      key={v.id}
                      className="admin-selection-row w-full justify-between text-body"
                      onClick={() => {
                        setFocusedId(v.id);
                        setEdit(v);
                      }}
                    >
                      <div>
                        <strong>{v.name}</strong>
                        <p className="mt-1 text-caption text-muted-foreground">
                          {v.code}, {v.value ?? "Chưa có giá trị"}
                        </p>
                      </div>
                      <Badge>{v.isActive ? "Đang dùng" : "Đã tắt"}</Badge>
                    </button>
                  ))
                ) : (
                  <Empty
                    title={type ? "Chưa có giá trị nào" : "Chưa chọn loại danh mục"}
                    description={
                      type
                        ? "Tạo giá trị đầu tiên cho loại danh mục này."
                        : "Chọn một loại danh mục bên trái để xem các giá trị."
                    }
                  />
                )}
                <Pager {...r} onChange={setItemPage} />
              </>
            )}
          </Result>
        </Panel>
        <Panel title="Chi tiết giá trị">
          {(() => {
            const value = items.data?.items.find((v) => v.id === focusedId);
            return value ? (
              <>
                <dl className="space-y-4 text-body">
                  {[
                    ["Tên", value.name],
                    ["Mã định danh", value.code],
                    ["Giá trị", value.value ?? "Chưa có"],
                    ["Thứ tự", String(value.sortOrder)],
                    [
                      "Trạng thái",
                      value.isActive ? "Đang sử dụng" : "Tạm ngừng",
                    ],
                  ].map(([label, text]) => (
                    <div key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="mt-1 break-words font-medium">{text}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  className={`${buttonClass} mt-5`}
                  onClick={() => setEdit(value)}
                >
                  Sửa giá trị đã chọn
                </button>
              </>
            ) : (
              <Empty title="Chưa chọn giá trị" description="Chọn một giá trị trong danh sách để xem chi tiết và chỉnh sửa." />
            );
          })()}
        </Panel>
      </div>
      {createType && (
        <Modal title="Tạo loại danh mục" onClose={() => setCreateType(false)}>
          <CatalogTypeForm
            onSaved={() => {
              setNotice("Đã tạo loại danh mục.");
              setCreateType(false);
              types.reload();
            }}
          />
        </Modal>
      )}
      {(create || edit) && type && (
        <Modal
          title={edit ? "Sửa giá trị" : "Tạo giá trị"}
          onClose={() => {
            setCreate(false);
            setEdit(undefined);
          }}
        >
          <CatalogItemForm
            typeCode={type.code}
            item={edit}
            onSaved={() => {
              setNotice("Đã lưu giá trị danh mục.");
              setCreate(false);
              setEdit(undefined);
              items.reload();
            }}
          />
        </Modal>
      )}
    </>
  );
}
function CatalogTypeForm({ onSaved }: { onSaved: () => void }) {
  const action = useAction(onSaved);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void action.run(() =>
          api.createCatalogType({
            code: String(f.get("code")),
            name: String(f.get("name")),
            description: String(f.get("description")),
          }),
        );
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      {["code", "name", "description"].map((name, i) => (
        <label key={name} className="block text-body">
          {["Mã loại", "Tên loại", "Mô tả loại"][i]}
          <input
            required={i < 2}
            name={name}
            maxLength={i === 0 ? 64 : i === 1 ? 128 : 512}
            pattern={i === 0 ? "[a-z0-9_.-]{3,64}" : undefined}
            className={inputClass}
            placeholder={["vd: khoi_nganh", "VD: Khối ngành", "VD: Nhóm ngành đào tạo dùng chung"][i]}
          />
        </label>
      ))}
      <div className="flex justify-end">
        <button className={buttonClass} disabled={action.busy}>
          Lưu loại danh mục
        </button>
      </div>
    </form>
  );
}
function CatalogItemForm({
  typeCode,
  item,
  onSaved,
}: {
  typeCode: string;
  item?: ReturnType<typeof api.parseCatalogItem>;
  onSaved: () => void;
}) {
  const action = useAction(onSaved);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void action.run(() =>
          api.saveCatalogItem(item?.id, {
            name: String(f.get("name")),
            value: String(f.get("value")),
            sortOrder: Number(f.get("order")),
            ...(item
              ? { isActive: f.get("active") === "on" }
              : { typeCode, code: String(f.get("code")) }),
          }),
        );
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      {!item && (
        <label className="block text-body">
          Mã giá trị
          <input
            name="code"
            required
            pattern="[a-z0-9_.-]{1,64}"
            className={inputClass}
            placeholder="vd: cntt"
          />
        </label>
      )}
      <label className="block text-body">
        Tên giá trị
        <input
          required
          name="name"
          maxLength={128}
          className={inputClass}
          placeholder="VD: Công nghệ thông tin"
          defaultValue={item?.name}
        />
      </label>
      <label className="block text-body">
        Giá trị
        <input
          name="value"
          maxLength={1024}
          className={inputClass}
          placeholder="Nội dung lưu kèm (nếu có)"
          defaultValue={item?.value ?? ""}
        />
      </label>
      <label className="block text-body">
        Thứ tự
        <input
          required
          type="number"
          min="0"
          name="order"
          className={inputClass}
          defaultValue={item?.sortOrder ?? 0}
        />
      </label>
      {item && (
        <label className="flex gap-2 text-body">
          <input type="checkbox" name="active" defaultChecked={item.isActive} />
          Đang hoạt động
        </label>
      )}
      <div className="flex justify-end">
        <button className={buttonClass} disabled={action.busy}>
          Lưu giá trị
        </button>
      </div>
    </form>
  );
}
export function AdminSettings({ embedded = false }: { embedded?: boolean } = {}) {
  const [notice, setNotice] = useState("");
  const settings = useResource(
      useCallback((s: AbortSignal) => api.getSettings(s), []),
    ),
    [selected, setSelected] =
      useState<Awaited<ReturnType<typeof api.getSettings>>[number]>(),
    [create, setCreate] = useState(false);
  const createAction = (
    <button className={buttonClass} onClick={() => setCreate(true)}>
      Thêm cấu hình
    </button>
  );
  return (
    <>
      {!embedded && (
        <PageTitle
          title="Cài đặt hệ thống"
          subtitle="Cấu hình nghiệp vụ được lưu tại Backend"
          action={createAction}
        />
      )}
      {notice && <p role="status" className="mb-5 border-l border-success pl-3 text-body text-success">{notice}</p>}
      <Panel title="Cấu hình nghiệp vụ" action={embedded ? createAction : undefined}>
        <Result resource={settings}>
          {(r) => (
            <>
              {r.length ? (
                r.map((v) => (
                  <button
                    key={v.key}
                    className="admin-configuration-item block w-full"
                    onClick={() => setSelected(v)}
                  >
                    <strong className="text-body text-foreground">
                      {v.description ?? v.key}
                    </strong>
                    <p className="mt-1 text-caption text-muted-foreground">{v.key}</p>
                    <p className="mt-2 break-all text-body">{v.value}</p>
                    <time className="mt-2 block text-caption text-muted-foreground">
                      {new Date(v.updatedAt).toLocaleString("vi-VN")}
                    </time>
                  </button>
                ))
              ) : (
                <Empty title="Chưa có cấu hình nghiệp vụ." description="Thêm cấu hình nghiệp vụ đầu tiên; khóa kết nối dịch vụ do môi trường triển khai quản lý." />
              )}
            </>
          )}
        </Result>
        <p className="mt-4 text-body text-muted-foreground">
          Kết nối database và khóa dịch vụ do môi trường triển khai quản lý.
        </p>
      </Panel>
      {(create || selected) && (
        <Modal
          title="Lưu cấu hình"
          onClose={() => {
            setCreate(false);
            setSelected(undefined);
          }}
        >
          <SettingForm
            setting={selected}
            onSaved={() => {
              setNotice("Đã lưu cấu hình nghiệp vụ.");
              setCreate(false);
              setSelected(undefined);
              settings.reload();
            }}
          />
        </Modal>
      )}
    </>
  );
}
function SettingForm({
  setting,
  onSaved,
}: {
  setting?: Awaited<ReturnType<typeof api.getSettings>>[number];
  onSaved: () => void;
}) {
  const action = useAction(onSaved);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget),
          key = String(f.get("key"));
        void action.run(() => {
          if (!api.safeSettingKey(key))
            throw Error(
              "Khóa kết nối và dịch vụ phải được quản lý qua môi trường triển khai.",
            );
          return api.saveSetting({
            key,
            value: String(f.get("value")),
            description: String(f.get("description")),
          });
        });
      }}
    >
      {Boolean(action.error) && <ErrorState error={action.error} />}
      <label className="block text-body">
        Khóa cấu hình
        <input
          required
          name="key"
          readOnly={Boolean(setting)}
          pattern="[a-z0-9._-]{1,128}"
          className={`${inputClass} read-only:cursor-not-allowed read-only:opacity-60`}
          placeholder="vd: interview.default_duration"
          defaultValue={setting?.key}
        />
      </label>
      <label className="block text-body">
        Giá trị cấu hình
        <textarea
          required
          name="value"
          maxLength={100000}
          className={inputClass}
          defaultValue={setting?.value}
        />
      </label>
      <label className="block text-body">
        Mô tả cấu hình
        <input
          name="description"
          maxLength={512}
          className={inputClass}
          placeholder="Cấu hình này ảnh hưởng đến nghiệp vụ nào?"
          defaultValue={setting?.description ?? ""}
        />
      </label>
      <div className="flex justify-end">
        <button className={buttonClass} disabled={action.busy}>
          Lưu cấu hình
        </button>
      </div>
    </form>
  );
}
/** Hành động "hoàn tất" trong dòng hoạt động — kết thúc bằng động từ chốt
 * (completed/submitted/published/…): được đánh dấu bút mực xanh. Các động từ
 * chuyển trạng thái (created/updated/locked…) giữ dòng thời gian trơn. */
const completedAction = /\.(completed|submitted|published|finalized|approved|issued)$/;

export function AdminAudit() {
  const [page, setPage] = useState(1),
    [actorId, setActorId] = useState(""),
    [action, setAction] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [selected, setSelected] = useState<ReturnType<typeof api.parseAudit>>();
  const rows = useResource(
    useCallback(
      (s: AbortSignal) =>
        api.listAudits(
          page,
          {
            actorId,
            action,
            from: from ? new Date(from).toISOString() : "",
            to: to ? new Date(to).toISOString() : "",
          },
          s,
        ),
      [page, actorId, action, from, to],
    ),
  );
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <PageTitle
          title="Audit log"
          subtitle="Lịch sử thao tác bảo mật và thay đổi dữ liệu"
        />
        {/* Tấm polaroid quản trị viên đóng mộc — audit là trang thủ quỹ của
            cuốn sổ; dán lệch một góc, chỉ hiện từ lg để không đổi nhịp trang. */}
        <figure className="relative mb-6 hidden w-[128px] shrink-0 rotate-[2.4deg] lg:block">
          <Tape className="-top-2.5 left-7 z-10" rotate={-5} variant="slate" />
          <div className="sketch-card-sm dog-ear bg-raised p-1.5">
            <Image
              src="/images/characters/admin-stamp.png"
              alt="Minh hoạ quản trị viên đang đóng mực đỏ lên cuốn sổ nhật ký"
              width={128}
              height={128}
              sizes="128px"
              className="w-full rounded-lg border-2 border-ink/10"
            />
            <figcaption className="px-0.5 pb-0.5 pt-1 font-hand text-[14px] leading-tight text-ink-soft">
              ghi sổ xong rồi!
            </figcaption>
          </div>
        </figure>
      </div>
      {rows.data && (
        <CollectionMetrics
          values={[
            ["Audit phù hợp", rows.data.total],
            ["Bản ghi, trang", rows.data.items.length],
            [
              "Actor, trang",
              new Set(rows.data.items.map((v) => v.actorId).filter(Boolean))
                .size,
            ],
            [
              "Loại đối tượng, trang",
              new Set(rows.data.items.map((v) => v.targetType).filter(Boolean))
                .size,
            ],
          ]}
          note="Số liệu theo bộ lọc; phân bố bên phải chỉ tính các bản ghi trên trang hiện tại."
        />
      )}
      <div className="admin-collection-layout">
        <Panel title="Tra cứu">
          <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <UserPicker
              label="Người thực hiện audit"
              value={actorId}
              onChange={(v) => {
                setActorId(v);
                setPage(1);
              }}
            />
            <label className="text-body">
              Hành động
              <input
                className={inputClass}
                placeholder="Ví dụ: user.created"
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
              />
            </label>            <label className="text-body">
              Từ thời điểm
              <input
                type="datetime-local"
                className={inputClass}
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="text-body">
              Đến thời điểm
              <input
                type="datetime-local"
                className={inputClass}
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </label>
          </div>
          <Result resource={rows}>
            {(r) => (
              <>
                {r.items.length ? (
                  <div className="notebook-scroll max-h-[65vh] overflow-x-auto overflow-y-auto" role="region" aria-label="Nhật ký kiểm toán" tabIndex={0}>
                    <table className="w-full min-w-[56rem] text-left text-body">
                      <thead className="bg-muted/50">
                        <tr>
                          {[
                            "Thời điểm",
                            "Hành động",
                            "Đối tượng",
                            "Actor / IP",
                            "",
                          ].map((v) => (
                            <th key={v} className="p-3">
                              {v}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {r.items.map((v) => (
                          <tr key={v.id} className="border-b border-border">
                            <td className="p-3 whitespace-nowrap">
                              {new Date(v.createdAt).toLocaleString("vi-VN")}
                            </td>
                            <td className="p-3">
                              <Badge>{v.action}</Badge>
                            </td>
                            <td className="p-3">{v.targetType ?? "Chưa có"}</td>
                            <td className="p-3">
                              <span className="block max-w-40 truncate">
                                {v.actorId ?? "Hệ thống"}
                              </span>
                              <small className="text-muted-foreground">
                                {v.ip ?? "Chưa ghi nhận"}
                              </small>
                            </td>
                            <td className="p-3">
                              <button
                                aria-label={"Chi tiết audit " + v.id}
                                className={`${linkButtonClass} -ml-1 text-primary hover:underline underline-offset-4`}
                                onClick={() => setSelected(v)}
                              >
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title="Không có bản ghi audit phù hợp"
                    description="Thử nới khoảng thời gian hoặc bỏ bớt điều kiện lọc."
                  />
                )}
                <Pager {...r} onChange={setPage} />
              </>
            )}
          </Result>
        </Panel>
        {rows.data && (
          <CollectionAside
            rows={rows.data.items.map((v) => ({
              status: v.targetType ?? "Chưa ghi nhận",
            }))}
            title="Phân bố đối tượng"
            links={[
              ["/admin/activity", "Hoạt động gần đây"],
              ["/admin/users", "Người dùng"],
            ]}
          />
        )}
      </div>
      {selected && (
        <Modal title="Chi tiết audit" onClose={() => setSelected(undefined)}>
          <dl className="space-y-3 text-body">
            {Object.entries(selected).map(([key, value]) => (
              <div key={key}>
                <dt className="font-semibold text-muted-foreground">{key}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-all">
                  {value ?? "Chưa ghi nhận"}
                </dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </>
  );
}
export function AdminActivity({ compact = false }: { compact?: boolean }) {
  const [page, setPage] = useState(1),
    [module, setModule] = useState(""),
    [actorId, setActorId] = useState("");
  const rows = useResource(
    useCallback(
      (s: AbortSignal) => api.listActivity(page, { module, actorId }, s),
      [page, module, actorId],
    ),
  );
  return (
    <>
      {!compact && (
        <PageTitle
          title="Hoạt động gần đây"
          subtitle="Sự kiện thực tế từ các nghiệp vụ trong hệ thống"
        />
      )}
      {!compact && rows.data && (
        <CollectionMetrics
          values={[
            ["Hoạt động phù hợp", rows.data.total],
            ["Sự kiện, trang", rows.data.items.length],
            [
              "Module, trang",
              new Set(rows.data.items.map((v) => v.module)).size,
            ],
            [
              "Actor, trang",
              new Set(rows.data.items.map((v) => v.actorId).filter(Boolean))
                .size,
            ],
            [
              "Loại hành động, trang",
              new Set(rows.data.items.map((v) => v.action)).size,
            ],
          ]}
          note="Số liệu theo bộ lọc; các chỉ số phân bố chỉ tính trang hiện tại."
        />
      )}
      <div
        className={
          compact ? "" : "admin-collection-layout"
        }
      >
        <Panel title="Dòng hoạt động">
          {!compact && (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <input
                className={inputClass}
                aria-label="Module hoạt động"
                placeholder="Module: tasks, users, evaluations…"
                value={module}
                onChange={(e) => {
                  setModule(e.target.value);
                  setPage(1);
                }}
              />
              <UserPicker
                label="Người thực hiện hoạt động"
                value={actorId}
                onChange={(v) => {
                  setActorId(v);
                  setPage(1);
                }}
              />
            </div>
          )}
          <Result resource={rows}>
            {(r) => (
              <>
                {r.items.length ? (
                  <ol className="min-w-0" aria-label="Dòng hoạt động">
                    {r.items.map((v, index) => (
                      <TimelineItem key={v.id} current={index === 0}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge>{v.module}</Badge>
                          <time className="text-caption text-muted-foreground">
                            {new Date(v.createdAt).toLocaleString("vi-VN")}
                          </time>
                        </div>
                        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-body font-semibold text-foreground">
                          {completedAction.test(v.action) && (
                            /* Dòng hoàn tất được tick bút mực xanh như đầu
                               bài đã chấm xong. */
                            <CheckDoodle className="h-4.5 w-6 shrink-0 text-success" />
                          )}
                          <span>{v.summary ?? v.action}</span>
                        </p>
                        <p className="mt-1 text-caption text-muted-foreground">
                          {v.action}
                        </p>
                      </TimelineItem>
                    ))}
                  </ol>
                ) : (
                  <Empty
                    title="Chưa có hoạt động nào"
                    description="Sự kiện nghiệp vụ trong hệ thống sẽ xuất hiện tại đây khi xảy ra."
                  />
                )}
                <Pager {...r} onChange={setPage} />
              </>
            )}
          </Result>
        </Panel>
        {!compact && rows.data && (
          <CollectionAside
            rows={rows.data.items.map((v) => ({ status: v.module }))}
            title="Phân bố module"
            links={[
              ["/admin/audit", "Tra cứu audit"],
              ["/admin/services", "Trạng thái dịch vụ"],
            ]}
          />
        )}
      </div>
    </>
  );
}
function formatUptime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

function serviceTone(value: string): { tone: "green" | "amber" | "sky" | "red"; label: string } {
  if (/^ok$/i.test(value)) return { tone: "green", label: "Hoạt động" };
  if (/^configured$/i.test(value)) return { tone: "sky", label: "Đã cấu hình" };
  if (/^unconfigured$/i.test(value)) return { tone: "amber", label: "Chưa cấu hình" };
  return { tone: "red", label: value || "Không xác định" };
}

export function AdminServices() {
  const health = useResource(
    useCallback((s: AbortSignal) => api.getHealth(s), []),
  );
  return (
    <>
      <PageTitle
        title="Trạng thái dịch vụ"
        subtitle="Kết quả kiểm tra kết nối hiện tại từ Backend"
        action={
          <button
            className={buttonClass}
            onClick={health.reload}
            disabled={health.loading}
          >
            Kiểm tra lại
          </button>
        }
      />
      <Result resource={health}>
        {(h) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                icon={IconTimer}
                label="Độ trễ database"
                value={`${h.latency.toLocaleString("vi-VN")} ms`}
              />
              <MetricCard
                icon={IconClock}
                label="Backend hoạt động liên tục"
                value={formatUptime(h.uptimeSeconds)}
                sub={`${h.uptimeSeconds.toLocaleString("vi-VN")} giây kể từ lần khởi động gần nhất`}
              />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ["Nest Backend", h.backend, "Trạng thái API"],
                ["SQL Server", h.database, "Kết nối database"],
                [
                  "AI Provider",
                  h.ai,
                  h.aiProvider
                    ? `${h.aiProvider}, ${h.aiModel ?? "Chưa cấu hình model"}`
                    : "Chưa cấu hình dịch vụ AI",
                ],
              ].map(([name, status, description]) => {
                const conf = serviceTone(status);
                return (
                  <Panel key={name} title={name}>
                    <StatusDot tone={conf.tone}>{conf.label}</StatusDot>
                    <p className="mt-3 break-words text-body text-muted-foreground">
                      {description}
                    </p>
                  </Panel>
                );
              })}
            </div>
            <p className="mt-5 text-caption text-muted-foreground">
              Kiểm tra lúc {new Date(h.timestamp).toLocaleString("vi-VN")}. AI
              configured chỉ xác nhận cấu hình hiện diện, chưa phải kiểm tra
              truy vấn Gemini.
            </p>
          </>
        )}
      </Result>
      <AdminSystemStatus />
    </>
  );
}
