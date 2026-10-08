import { describe, expect, it } from "vitest";
import { workspaceNav } from "../workspace-presentation";

describe("Live workspace navigation gates", () => {
  it("keeps assignment-dependent routes unavailable while Waiting", () => {
    const items = workspaceNav(false).flatMap((group) => group.items);
    for (const id of [
      "work",
      "sprint",
      "project",
      "mentor",
      "evaluations",
      "kpi",
      "certificates",
    ]) {
      const item = items.find((value) => value.id === id);
      expect(item?.unavailable).toBe(true);
      expect(item?.href).toBeUndefined();
    }
    expect(items.find((item) => item.id === "notifications")?.href).toBe(
      "/intern/notifications",
    );
  });
  it("provides real links to all development outcomes for an active Intern", () => {
    const items = workspaceNav(true).flatMap((group) => group.items);
    for (const id of [
      "work",
      "sprint",
      "project",
      "mentor",
      "evaluations",
      "performance",
      "kpi",
      "certificates",
      "recommendations",
    ]) {
      const item = items.find((value) => value.id === id);
      expect(item?.href).toBe(`/intern/${id}`);
      expect(item?.unavailable).toBe(false);
    }
  });
});
