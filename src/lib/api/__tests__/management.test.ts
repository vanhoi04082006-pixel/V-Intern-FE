import { describe, expect, it } from "vitest";
import {
  parseCycle,
  parseCriterion,
  parseManagedEvaluation,
  parseAiSuggestion,
  csvCell,
  managerTransitions,
} from "../management";
describe("Management truth and authority", () => {
  it("keeps an unscored evaluation null", () =>
    expect(
      parseManagedEvaluation({
        id: "e",
        cycleId: "c",
        internId: "u",
        evaluatorId: "i",
        status: "draft",
        overallScore: null,
        summary: null,
        revisionNumber: 0,
      }).overallScore,
    ).toBeNull());
  it("requires actual dates on cycles", () =>
    expect(() =>
      parseCycle({ id: "c", name: "C", code: "C", status: "draft" }),
    ).toThrow());
  it("rejects missing criterion weights", () =>
    expect(() =>
      parseCriterion({ id: "c", code: "C", name: "N", maxScore: 100 }),
    ).toThrow());
  it("parses AI advisory separately from official evaluation", () => {
    const a = parseAiSuggestion({
      suggestion: {
        summary: "Advisory",
        strengths: [],
        improvementAreas: [],
        criterionSuggestions: [
          {
            criterionCode: "c",
            suggestedScore: 95,
            comment: "Consider",
            evidence: [],
          },
        ],
      },
    });
    expect(a.criteria[0].suggestedScore).toBe(95);
    expect(a).not.toHaveProperty("overallScore");
  });
  it.each(["=1+1", "+SUM(A1)", "@cmd", "-1", "\t=1+1"])(
    "neutralizes spreadsheet formula %s",
    (value) => expect(csvCell(value)).toMatch(/^"'/),
  );
  it("escapes CSV quotes", () => expect(csvCell('A "B"')).toBe('"A ""B"""'));
  it("offers review approval and rework only to manager", () => {
    expect(managerTransitions("review")).toEqual(["done", "doing"]);
    expect(managerTransitions("done")).toEqual([]);
  });
});
