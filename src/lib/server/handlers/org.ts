/**
 * Admin tổ chức (Task 2-b): groups (thành viên + vai trò nhóm), roles (read-only
 * + permissions), catalogs (loại + mục cấu hình).
 */

import type { CatalogItem } from "../org-store";
import { getOrgStore } from "../org-store";
import { pushAudit } from "../store";
import { includesNoAccent, nowIso, randomId } from "../util";
import { badRequest, conflict, notFound, pageOf, requireString, route, type Ctx, type RouteDef } from "./common";

const GROUP_CODE_PATTERN = /^[a-z0-9][a-z0-9-]{2,63}$/;
const ITEM_CODE_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/* ------------------------------- Groups ------------------------------- */

function getGroup(idOrCode: string) {
  const g = getOrgStore().groups.find((x) => x.id === idOrCode || x.code === idOrCode);
  if (!g) throw notFound("Không tìm thấy nhóm.");
  return g;
}

async function listGroups(ctx: Ctx): Promise<unknown> {
  const org = getOrgStore();
  let items = [...org.groups];
  const q = ctx.query.get("q")?.trim();
  if (q) {
    items = items.filter((g) => includesNoAccent(`${g.code} ${g.name} ${g.description}`, q));
  }
  items.sort((a, b) => (a.name < b.name ? -1 : 1));
  return pageOf(
    items.map((g) => ({
      id: g.id,
      code: g.code,
      name: g.name,
      description: g.description,
      memberCount: org.groupMembers.filter((m) => m.groupId === g.id).length,
      roleCodes: org.groupRoles.filter((r) => r.groupId === g.id).map((r) => r.roleCode),
      createdAt: g.createdAt,
    })),
    ctx.query
  );
}

async function createGroup(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const code = requireString(body, "code", "Mã nhóm");
  if (!GROUP_CODE_PATTERN.test(code)) {
    throw badRequest("Mã nhóm chỉ gồm a-z, 0-9 và gạch nối (3–64 ký tự).", ["code: slug"]);
  }
  const org = getOrgStore();
  if (org.groups.some((g) => g.code === code)) {
    throw conflict(`Mã nhóm '${code}' đã tồn tại.`, "GROUP_CODE_EXISTS");
  }
  const name = requireString(body, "name", "Tên nhóm");
  const group = {
    id: randomId("grp"),
    code,
    name,
    description: typeof body.description === "string" ? body.description : "",
    createdAt: nowIso(),
  };
  org.groups.push(group);
  pushAudit(ctx.user!.displayName, "CREATE", `Group ${code}`);
  return { ...group, memberCount: 0, roleCodes: [] };
}

async function patchGroup(ctx: Ctx): Promise<unknown> {
  const group = getGroup(ctx.params.id);
  const body = ctx.body ?? {};
  if (body.name != null) group.name = requireString(body, "name", "Tên nhóm");
  if (body.description != null) {
    if (typeof body.description !== "string") throw badRequest("Mô tả phải là chuỗi.", ["description: chuỗi"]);
    group.description = body.description;
  }
  pushAudit(ctx.user!.displayName, "UPDATE", `Group ${group.code}`);
  return group;
}

async function groupMembers(ctx: Ctx): Promise<unknown> {
  const group = getGroup(ctx.params.id);
  const members = getOrgStore()
    .groupMembers.filter((m) => m.groupId === group.id)
    .map((m) => {
      const u = ctx.store.users.find((x) => x.id === m.userId);
      return {
        userId: m.userId,
        name: u?.displayName ?? m.userId,
        email: u?.email ?? "",
        role: u?.role ?? "intern",
        addedAt: m.addedAt,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return { data: members };
}

async function addGroupMember(ctx: Ctx): Promise<unknown> {
  const group = getGroup(ctx.params.id);
  const userId = requireString(ctx.body, "userId", "Thành viên");
  const user = ctx.store.users.find((u) => u.id === userId);
  if (!user) throw badRequest("Người dùng không tồn tại.", ["userId: không hợp lệ"]);
  const org = getOrgStore();
  if (org.groupMembers.some((m) => m.groupId === group.id && m.userId === userId)) {
    throw conflict("Thành viên đã có trong nhóm.", "GROUP_MEMBER_EXISTS");
  }
  org.groupMembers.push({ groupId: group.id, userId, addedAt: nowIso() });
  pushAudit(ctx.user!.displayName, "UPDATE", `Group ${group.code} +${user.displayName}`);
  return { userId, name: user.displayName, email: user.email, role: user.role, addedAt: nowIso() };
}

async function removeGroupMember(ctx: Ctx): Promise<unknown> {
  const group = getGroup(ctx.params.id);
  const org = getOrgStore();
  const idx = org.groupMembers.findIndex((m) => m.groupId === group.id && m.userId === ctx.params.userId);
  if (idx < 0) throw notFound("Thành viên không có trong nhóm này.");
  org.groupMembers.splice(idx, 1);
  return { removed: true, userId: ctx.params.userId };
}

async function groupRoles(ctx: Ctx): Promise<unknown> {
  const group = getGroup(ctx.params.id);
  const org = getOrgStore();
  const roles = org.groupRoles
    .filter((r) => r.groupId === group.id)
    .map((r) => org.roles.find((x) => x.code === r.roleCode))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => ({ code: r.code, name: r.name }));
  return { data: roles };
}

async function setGroupRoles(ctx: Ctx): Promise<unknown> {
  const group = getGroup(ctx.params.id);
  const roleCodes = ctx.body?.roleCodes;
  if (!Array.isArray(roleCodes) || roleCodes.some((c) => typeof c !== "string")) {
    throw badRequest("Cần truyền mảng roleCodes.", ["roleCodes: string[]"]);
  }
  const org = getOrgStore();
  const unknown = (roleCodes as string[]).filter((c) => !org.roles.some((r) => r.code === c));
  if (unknown.length) {
    throw badRequest(`Vai trò không tồn tại: ${unknown.join(", ")}.`, unknown.map((c) => `roleCodes: ${c}`));
  }
  org.groupRoles = org.groupRoles.filter((r) => r.groupId !== group.id);
  for (const code of roleCodes as string[]) {
    org.groupRoles.push({ groupId: group.id, roleCode: code });
  }
  pushAudit(ctx.user!.displayName, "UPDATE", `Group ${group.code} roles`);
  return {
    roles: (roleCodes as string[]).map((code) => {
      const r = org.roles.find((x) => x.code === code)!;
      return { code: r.code, name: r.name };
    }),
  };
}

/* ------------------------------- Roles ------------------------------- */

function getRole(idOrCode: string) {
  const r = getOrgStore().roles.find((x) => x.id === idOrCode || x.code === idOrCode);
  if (!r) throw notFound("Không tìm thấy vai trò.");
  return r;
}

async function listRoles(ctx: Ctx): Promise<unknown> {
  const org = getOrgStore();
  return pageOf(
    org.roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      permissionCount: org.rolePermissions.filter((p) => p.roleCode === r.code).length,
    })),
    ctx.query
  );
}

async function rolePermissions(ctx: Ctx): Promise<unknown> {
  const role = getRole(ctx.params.id);
  const org = getOrgStore();
  const codes = new Set(org.rolePermissions.filter((p) => p.roleCode === role.code).map((p) => p.permissionCode));
  const perms = org.permissions
    .filter((p) => codes.has(p.code))
    .map((p) => ({ id: p.id, code: p.code, name: p.name, description: p.description, group: p.group }));
  return pageOf(perms, ctx.query);
}

/* ------------------------------- Catalogs ------------------------------- */

function getCatalogType(code: string) {
  const t = getOrgStore().catalogTypes.find((x) => x.code === code);
  if (!t) throw notFound("Không tìm thấy loại danh mục.");
  return t;
}

async function listCatalogTypes(ctx: Ctx): Promise<unknown> {
  const org = getOrgStore();
  return pageOf(
    org.catalogTypes.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      itemCount: org.catalogItems.filter((i) => i.typeCode === t.code).length,
      createdAt: t.createdAt,
    })),
    ctx.query
  );
}

async function createCatalogType(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const code = requireString(body, "code", "Mã loại danh mục");
  if (!GROUP_CODE_PATTERN.test(code)) {
    throw badRequest("Mã loại chỉ gồm a-z, 0-9 và gạch nối (3–64 ký tự).", ["code: slug"]);
  }
  const org = getOrgStore();
  if (org.catalogTypes.some((t) => t.code === code)) {
    throw conflict(`Loại danh mục '${code}' đã tồn tại.`, "CATALOG_TYPE_EXISTS");
  }
  const type = { id: randomId("cat"), code, name: requireString(body, "name", "Tên loại"), createdAt: nowIso() };
  org.catalogTypes.push(type);
  pushAudit(ctx.user!.displayName, "CREATE", `Catalog type ${code}`);
  return { ...type, itemCount: 0 };
}

async function listCatalogItems(ctx: Ctx): Promise<unknown> {
  const type = getCatalogType(ctx.params.code);
  const items = getOrgStore()
    .catalogItems.filter((i) => i.typeCode === type.code)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(itemPublic);
  return pageOf(items, ctx.query);
}

function itemPublic(i: CatalogItem): Record<string, unknown> {
  return {
    id: i.id,
    typeCode: i.typeCode,
    name: i.name,
    code: i.code,
    value: i.value,
    isActive: i.isActive,
    sortOrder: i.sortOrder,
  };
}

async function createCatalogItem(ctx: Ctx): Promise<unknown> {
  const type = getCatalogType(ctx.params.code);
  const body = ctx.body ?? {};
  const org = getOrgStore();
  const name = requireString(body, "name", "Tên mục");
  let code = typeof body.code === "string" && body.code ? body.code.trim().toLowerCase() : slugify(name);
  if (!ITEM_CODE_PATTERN.test(code)) code = `${slugify(name) || "item"}-${org.catalogItems.length + 1}`;
  if (org.catalogItems.some((i) => i.typeCode === type.code && i.code === code)) {
    throw conflict(`Mục '${code}' đã tồn tại trong loại này.`, "CATALOG_ITEM_EXISTS");
  }
  const maxOrder = org.catalogItems
    .filter((i) => i.typeCode === type.code)
    .reduce((max, i) => Math.max(max, i.sortOrder), 0);
  const item: CatalogItem = {
    id: randomId("itm"),
    typeCode: type.code,
    name,
    code,
    value: typeof body.value === "string" ? body.value : "",
    isActive: body.isActive == null ? true : body.isActive === true,
    sortOrder: typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder) ? body.sortOrder : maxOrder + 1,
  };
  org.catalogItems.push(item);
  pushAudit(ctx.user!.displayName, "CREATE", `Catalog item ${type.code}/${item.code}`);
  return itemPublic(item);
}

async function patchCatalogItem(ctx: Ctx): Promise<unknown> {
  const type = getCatalogType(ctx.params.code);
  const item = getOrgStore().catalogItems.find((i) => i.typeCode === type.code && (i.id === ctx.params.id || i.code === ctx.params.id));
  if (!item) throw notFound("Không tìm thấy mục trong loại danh mục này.");
  const body = ctx.body ?? {};
  if (body.name != null) item.name = requireString(body, "name", "Tên mục");
  if (body.value != null) {
    if (typeof body.value !== "string") throw badRequest("Giá trị phải là chuỗi.", ["value: chuỗi"]);
    item.value = body.value;
  }
  if (body.isActive != null) item.isActive = body.isActive === true;
  if (body.sortOrder != null) {
    if (typeof body.sortOrder !== "number" || !Number.isFinite(body.sortOrder)) {
      throw badRequest("Thứ tự phải là số.", ["sortOrder: số"]);
    }
    item.sortOrder = body.sortOrder;
  }
  return itemPublic(item);
}

/* ------------------------------- routes ------------------------------- */

export const orgRoutes: RouteDef[] = [
  route("GET", "/groups", "admin", listGroups),
  route("POST", "/groups", "admin", createGroup),
  route("PATCH", "/groups/:id", "admin", patchGroup),
  route("GET", "/groups/:id/members", "admin", groupMembers),
  route("POST", "/groups/:id/members", "admin", addGroupMember),
  route("DELETE", "/groups/:id/members/:userId", "admin", removeGroupMember),
  route("GET", "/groups/:id/roles", "admin", groupRoles),
  route("PUT", "/groups/:id/roles", "admin", setGroupRoles),
  route("GET", "/roles", "admin", listRoles),
  route("GET", "/roles/:id/permissions", "admin", rolePermissions),
  route("GET", "/catalogs/types", "admin", listCatalogTypes),
  route("POST", "/catalogs/types", "admin", createCatalogType),
  route("GET", "/catalogs/types/:code/items", "admin", listCatalogItems),
  route("POST", "/catalogs/types/:code/items", "admin", createCatalogItem),
  route("PATCH", "/catalogs/types/:code/items/:id", "admin", patchCatalogItem),
];
