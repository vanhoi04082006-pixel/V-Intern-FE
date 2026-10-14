/** Test-only payload for the existing AI_PROVIDER_TOKEN harness override. */
import assert from "node:assert/strict";

export function buildTestSprintPlan(input) {
  const start = Date.parse(input.session?.startDate), end = Date.parse(input.session?.endDate);
  assert.ok(Number.isFinite(start) && Number.isFinite(end) && end - start >= 4 * 86400000, "Valid session window required");
  assert.ok(input.members?.length > 0, "Actual session roster required");
  const middle = start + Math.floor((end - start) / 86400000 / 2) * 86400000;
  return { sprints: [[start, middle], [middle, end]].map(([from, to], index) => ({
    name: `Contract Sprint ${index + 1}`, goal: "Implement and verify the pinned project requirements",
    startDate: new Date(from).toISOString(), endDate: new Date(to).toISOString(),
    tasks: [...input.members].sort((a, b) => b.roleInProject.localeCompare(a.roleInProject) || a.userId.localeCompare(b.userId)).map(member => ({
      title: `${member.roleInProject} delivery ${index + 1}`,
      description: `Implement the ${member.roleInProject} requirements and document the verified result.`,
      acceptanceCriteria: ["Requirements are demonstrated", "Regression checks pass"],
      suggestedRole: member.roleInProject, assigneeId: member.userId,
      priority: "high", storyPoints: 3, dueDate: new Date(to).toISOString(),
    })),
  })) };
}
