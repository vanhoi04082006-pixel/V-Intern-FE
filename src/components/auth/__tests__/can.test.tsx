import { describe, expect, it, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Can } from "../can";
import { clearSession, setSession } from "@/lib/auth/session";

const user = {
  id: "u1",
  email: "a@x.edu",
  displayName: "A",
  roles: ["admin"],
  permissions: ["users.create"],
};

afterEach(() => clearSession());

describe("<Can> permission gate (P0 FE-020)", () => {
  it("renders children when the permission is held", () => {
    setSession("tok", user);
    render(<Can perm="users.create"><span>CREATE-OK</span></Can>);
    expect(screen.getByText("CREATE-OK")).toBeInTheDocument();
  });
  it("hides children and renders fallback when the permission is missing", () => {
    setSession("tok", user);
    render(<Can perm="groups.manage" fallback={<span>NOPE</span>}><span>CREATE-OK</span></Can>);
    expect(screen.queryByText("CREATE-OK")).toBeNull();
    expect(screen.getByText("NOPE")).toBeInTheDocument();
  });
  it("hides children when logged out", () => {
    render(<Can perm="users.create"><span>CREATE-OK</span></Can>);
    expect(screen.queryByText("CREATE-OK")).toBeNull();
  });
  it("requires all permissions when given an array", () => {
    setSession("tok", user);
    render(<Can perm={["users.create", "groups.manage"]}><span>CREATE-OK</span></Can>);
    expect(screen.queryByText("CREATE-OK")).toBeNull();
  });
});
