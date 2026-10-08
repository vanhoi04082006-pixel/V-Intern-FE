import { describe, expect, it } from "vitest";
import {
  parseAcademic,
  parseCandidates,
  academicBody,
  sessionTransitions,
} from "../academic";
describe("Academic Nest boundaries", () => {
  const entity = {
    id: "id",
    code: "C",
    name: "Class",
    status: "active",
    description: null,
    startDate: null,
    endDate: null,
  };
  it("preserves null dates instead of inventing a calendar", () =>
    expect(parseAcademic(entity).startDate).toBeNull());
  it("rejects missing identity", () =>
    expect(() => parseAcademic({ ...entity, id: undefined })).toThrow());
  it("keeps failed candidates selectable only with their authoritative status", () =>
    expect(
      parseCandidates(
        {
          items: [
            { userId: "u", displayName: null, email: null, status: "failed" },
          ],
          total: 1,
        },
        1,
      ).items[0].status,
    ).toBe("failed"));
  it("does not send immutable code on update", () =>
    expect(
      academicBody(
        "classes",
        { code: "C", name: "New", description: "", status: "active" },
        true,
      ),
    ).not.toHaveProperty("code"));
  it("maps technologies and capacity to the real DTO", () =>
    expect(
      academicBody(
        "projects",
        {
          code: "C",
          name: "Project",
          description: "D",
          status: "active",
          technologies: "NestJS, SQL Server",
          capacity: "2",
        },
        false,
      ),
    ).toMatchObject({ technologies: ["NestJS", "SQL Server"], capacity: 2 }));
  it("only offers legal session transitions", () => {
    expect(sessionTransitions("active")).toEqual(["ending", "cancelled"]);
    expect(sessionTransitions("completed")).toEqual([]);
  });
});
