import { describe, expect, it } from "vitest";
import { parseRoleDetail, parseTemplateDetail, parseTemplateSummary } from "../templates";

const summary = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "ECOM",
  name: "E-commerce",
  category: "web",
  difficulty: "intermediate",
  status: "active",
  version: 2,
  techStack: ["React"],
  roles: ["frontend"],
  teamSize: 1,
  sprintCount: 3,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("template parsers (M2)", () => {
  it("parses list summaries fail-closed", () => {
    expect(parseTemplateSummary(summary)).toMatchObject({ code: "ECOM", teamSize: 1 });
    expect(() => parseTemplateSummary({ ...summary, teamSize: "x" })).toThrow();
    expect(() => parseTemplateSummary(null)).toThrow();
  });
  it("parses role details with skill lists", () => {
    expect(
      parseRoleDetail({ code: "frontend", title: "FE", countMin: 1, countMax: 2, requiredSkills: ["React"], recommendedSkills: [], level: null }),
    ).toMatchObject({ code: "frontend", countMax: 2 });
    expect(() => parseRoleDetail({ code: 1 })).toThrow();
  });
  it("parses detail with definition and runs", () => {
    const detail = parseTemplateDetail({ ...summary, archivedAt: null, definition: { objectives: {} }, runs: [] });
    expect(detail.definition).toEqual({ objectives: {} });
    expect(detail.runs).toEqual([]);
  });
  it("tolerates absent optional fields (stored definitions omit unset keys)", () => {
    expect(
      parseRoleDetail({ code: "backend" }),
    ).toMatchObject({ code: "backend", title: null, countMin: null, level: null, requiredSkills: [] });
    expect(
      parseTemplateSummary({ ...summary, category: undefined }),
    ).toMatchObject({ category: null });
  });
});
