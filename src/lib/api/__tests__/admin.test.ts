import { describe, it, expect } from "vitest";
import { parseUser, parseAudit, parseSettings, safeSettingKey } from "../admin";
describe("Admin response boundaries", () => {
  it("maps user presentation fields without passwordHash", () => {
    const u = parseUser({
      id: "u",
      email: "e",
      username: "user",
      displayName: "U",
      status: "active",
      lastLoginAt: null,
      createdAt: "2026-01-01",
      passwordHash: "never exposed",
    });
    expect(u).not.toHaveProperty("passwordHash");
  });
  it("rejects unsupported user status", () =>
    expect(() => parseUser({ status: "enabled" })).toThrow());
  it("keeps nullable audit facts rather than inventing actor/IP", () =>
    expect(
      parseAudit({
        id: "a",
        actorId: null,
        action: "event",
        targetId: null,
        targetType: null,
        detail: null,
        ip: null,
        userAgent: null,
        createdAt: "now",
      }).ip,
    ).toBeNull());
  it.each([
    "jwt_secret",
    "DB_PASSWORD",
    "gemini.api_key",
    "refresh-token",
    "connection_string",
  ])("hides credential key %s", (key) =>
    expect(safeSettingKey(key)).toBe(false),
  );
  it("retains actual business setting and discards credential entry", () =>
    expect(
      parseSettings({
        settings: [
          {
            key: "program.name",
            value: "VIN",
            description: null,
            updatedAt: "now",
          },
          {
            key: "api_key",
            value: "redacted",
            description: null,
            updatedAt: "now",
          },
        ],
      }).map((x) => x.key),
    ).toEqual(["program.name"]));
});
