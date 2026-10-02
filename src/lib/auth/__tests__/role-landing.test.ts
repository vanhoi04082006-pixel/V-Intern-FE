import { describe, expect, it } from "vitest";
import {
  DEFAULT_AFTER_LOGIN_PATH,
  PROTECTED_ROUTES,
  getWorkspacePathForRoles,
  hasAllowedRole,
} from "@/lib/auth/role-landing";
import type { SessionUser } from "@/lib/auth/session";

function userWith(roles: string[]): SessionUser {
  return {
    id: "u1",
    email: "user@vintern.local",
    displayName: "User",
    roles,
    permissions: [],
  };
}

describe("role → workspace mapping", () => {
  it("ánh xạ đúng 3 role của backend sang workspace", () => {
    expect(getWorkspacePathForRoles(["admin"])).toBe("/admin");
    expect(getWorkspacePathForRoles(["teacher"])).toBe("/instructor");
    // Intern có workspace riêng tại /intern (Intern Workspace).
    expect(getWorkspacePathForRoles(["intern"])).toBe("/intern");
  });

  it("lấy role khớp đầu tiên khi user có nhiều role", () => {
    expect(getWorkspacePathForRoles(["teacher", "admin"])).toBe("/instructor");
  });

  it("role lạ hoặc rỗng → đường dẫn mặc định", () => {
    expect(getWorkspacePathForRoles([])).toBe(DEFAULT_AFTER_LOGIN_PATH);
    expect(getWorkspacePathForRoles(["unknown-role"])).toBe(
      DEFAULT_AFTER_LOGIN_PATH
    );
  });
});

describe("route protection map", () => {
  it("/admin chỉ cho admin, /instructor chỉ cho teacher, /intern chỉ cho intern", () => {
    expect(PROTECTED_ROUTES["/admin"]).toEqual(["admin"]);
    expect(PROTECTED_ROUTES["/instructor"]).toEqual(["teacher"]);
    expect(PROTECTED_ROUTES["/intern"]).toEqual(["intern"]);
  });

  it("hasAllowedRole chỉ đúng khi có role thuộc danh sách cho phép", () => {
    expect(hasAllowedRole(userWith(["admin"]), PROTECTED_ROUTES["/admin"])).toBe(
      true
    );
    expect(
      hasAllowedRole(userWith(["teacher"]), PROTECTED_ROUTES["/admin"])
    ).toBe(false);
    expect(
      hasAllowedRole(userWith(["teacher"]), PROTECTED_ROUTES["/instructor"])
    ).toBe(true);
    expect(
      hasAllowedRole(userWith(["intern"]), PROTECTED_ROUTES["/instructor"])
    ).toBe(false);
    expect(
      hasAllowedRole(userWith(["intern"]), PROTECTED_ROUTES["/intern"])
    ).toBe(true);
    expect(
      hasAllowedRole(userWith(["admin"]), PROTECTED_ROUTES["/intern"])
    ).toBe(false);
    expect(
      hasAllowedRole(userWith(["teacher"]), PROTECTED_ROUTES["/intern"])
    ).toBe(false);
  });
});
