import {
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Plus,
  Search,
  SquarePen,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  ADMIN_USERS,
  USER_TABLE_SUMMARY,
  type AdminUserRow,
  type AdminUserStatus,
  type AdminUserRole,
} from "./data/admin-mock-data";

/**
 * Card "Quản lý người dùng" — bảng, filter/search UI và pagination là
 * PRESENTATION ONLY (dữ liệu mock): các nút hành động không gọi API nào
 * và không giả lập kết quả CRUD. Backend admin API sẽ nối ở task riêng.
 */

const ROLE_BADGE_CLASSES: Record<AdminUserRole, string> = {
  Admin: "bg-red-50 text-red-600",
  "Giảng viên": "bg-blue-50 text-blue-700",
  "Sinh viên": "bg-purple-50 text-purple-700",
};

const STATUS_CONFIG: Record<
  AdminUserStatus,
  { label: string; badge: string; dot: string }
> = {
  active: {
    label: "Đang hoạt động",
    badge: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  locked: {
    label: "Tạm khóa",
    badge: "bg-slate-100 text-slate-500",
    dot: "bg-slate-400",
  },
};

const roleOptions: AdminUserRole[] = ["Admin", "Giảng viên", "Sinh viên"];
const statusOptions: AdminUserStatus[] = ["active", "locked"];

const pageNumbers = [1, 2, 3, 4, 5];

export function UserManagementTable() {
  return (
    <section
      aria-labelledby="admin-users-heading"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 pb-4 sm:p-5">
        <h2
          id="admin-users-heading"
          className="flex items-center gap-3 text-base font-bold text-navy"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg bg-blue-50"
          >
            <Users className="size-5 text-blue-600" />
          </span>
          Quản lý người dùng
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Thêm người dùng
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
          >
            <Upload className="size-4" aria-hidden="true" />
            Import
          </button>
          <button
            type="button"
            aria-label="Tùy chọn khác cho danh sách người dùng"
            className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
          >
            <Ellipsis className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-4 sm:flex-row sm:px-5">
        <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 transition-shadow focus-within:ring-2 focus-within:ring-brand/30">
          <Search className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            aria-label="Tìm kiếm người dùng"
            placeholder="Tìm kiếm theo tên, email, vai trò..."
            className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <select
            aria-label="Lọc theo vai trò"
            defaultValue=""
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            <option value="">Tất cả vai trò</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc theo trạng thái"
            defaultValue=""
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          aria-label="Danh sách người dùng hệ thống"
          className="w-full min-w-[760px] border-collapse text-sm"
        >
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/80 text-left text-xs font-semibold text-slate-500">
              <th scope="col" className="px-5 py-3 font-semibold">Họ tên</th>
              <th scope="col" className="px-5 py-3 font-semibold">Email</th>
              <th scope="col" className="px-5 py-3 font-semibold">Vai trò</th>
              <th scope="col" className="px-5 py-3 font-semibold">Trạng thái</th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Lần đăng nhập cuối
              </th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_USERS.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 sm:flex-row sm:px-5">
        <p className="text-[13px] text-slate-500">{USER_TABLE_SUMMARY}</p>
        <nav aria-label="Phân trang danh sách người dùng">
          <ul className="flex items-center gap-1">
            <li>
              <button
                type="button"
                aria-label="Trang trước"
                className="grid size-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
            </li>
            {pageNumbers.map((page) => (
              <li key={page}>
                <button
                  type="button"
                  aria-label={`Trang ${page}`}
                  aria-current={page === 1 ? "page" : undefined}
                  className={cn(
                    "grid size-8 place-items-center rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                    page === 1
                      ? "bg-brand font-semibold text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {page}
                </button>
              </li>
            ))}
            <li aria-hidden="true" className="px-1 text-[13px] text-slate-400">
              ...
            </li>
            <li>
              <button
                type="button"
                aria-label="Trang 257"
                className="grid size-8 place-items-center rounded-md text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                257
              </button>
            </li>
            <li>
              <button
                type="button"
                aria-label="Trang sau"
                className="grid size-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </section>
  );
}

function UserRow({ user }: { user: AdminUserRow }) {
  const status = STATUS_CONFIG[user.status];

  return (
    <tr className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/60">
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold",
              ROLE_BADGE_CLASSES[user.role]
            )}
          >
            {user.initials}
          </span>
          <span className="whitespace-nowrap font-semibold text-navy">
            {user.name}
          </span>
        </span>
      </td>
      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{user.email}</td>
      <td className="px-5 py-3.5">
        <span
          className={cn(
            "inline-flex rounded-md px-2 py-1 text-xs font-medium",
            ROLE_BADGE_CLASSES[user.role]
          )}
        >
          {user.role}
        </span>
      </td>
      <td className="whitespace-nowrap px-5 py-3.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
            status.badge
          )}
        >
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
      </td>
      <td className="whitespace-nowrap px-5 py-3.5 text-[13px] text-slate-600">
        {user.lastLogin}
      </td>
      <td className="px-5 py-3.5">
        <span className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Sửa người dùng ${user.name}`}
            className="grid size-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <SquarePen className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Tùy chọn khác cho người dùng ${user.name}`}
            className="grid size-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Ellipsis className="size-4" aria-hidden="true" />
          </button>
        </span>
      </td>
    </tr>
  );
}
