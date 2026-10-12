import { describe, expect, it } from "vitest";
import { hasAllPermissions, hasAnyPermission, hasPermission, hasRole } from "../permissions";
import type { SessionUser } from "../session";

const user = {
  id: "u1",
  email: "a@x.edu",
  displayName: "A",
  roles: ["Instructor"],
  permissions: ["Users.Create", "projects.view"],
} as SessionUser;

describe("permission helpers (P0 FE-020)", () => {
  it("matches permissions case-insensitively", () => {
    expect(hasPermission(user, "users.create")).toBe(true);
    expect(hasPermission(user, "USERS.CREATE")).toBe(true);
    expect(hasPermission(user, "users.delete")).toBe(false);
  });
  it("fail-closed on null user or empty permission", () => {
    expect(hasPermission(null, "users.create")).toBe(false);
    expect(hasPermission(user, "  ")).toBe(false);
    expect(hasAnyPermission(user, [])).toBe(false);
    expect(hasAllPermissions(null, ["users.create"])).toBe(false);
  });
  it("any/all semantics", () => {
    expect(hasAnyPermission(user, ["nope", "projects.view"])).toBe(true);
    expect(hasAnyPermission(user, ["nope"])).toBe(false);
    expect(hasAllPermissions(user, ["users.create", "projects.view"])).toBe(true);
    expect(hasAllPermissions(user, ["users.create", "nope"])).toBe(false);
    expect(hasAllPermissions(user, [])).toBe(true);
  });
  it("matches roles case-insensitively", () => {
    expect(hasRole(user, "instructor")).toBe(true);
    expect(hasRole(user, "admin")).toBe(false);
    expect(hasRole(null, "instructor")).toBe(false);
  });
});
