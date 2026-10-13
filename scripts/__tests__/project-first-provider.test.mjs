import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTestSprintPlan } from "../project-first-provider.mjs";

const context = () => ({
  session: { startDate: "2030-01-01T00:00:00Z", endDate: "2030-01-29T00:00:00Z" },
  members: [{ userId: "frontend-id", roleInProject: "frontend" }, { userId: "backend-id", roleInProject: "backend" }],
});
test("test provider derives bounded dates and role-fit assignees from actual input", () => {
  const input = context(), plan = buildTestSprintPlan(input);
  assert.equal(plan.sprints.length, 2);
  for (const sprint of plan.sprints) {
    assert.ok(Date.parse(sprint.startDate) >= Date.parse(input.session.startDate));
    assert.ok(Date.parse(sprint.endDate) <= Date.parse(input.session.endDate));
    assert.ok(Date.parse(sprint.endDate) > Date.parse(sprint.startDate));
    for (const task of sprint.tasks) {
      assert.equal(input.members.find(m => m.userId === task.assigneeId)?.roleInProject, task.suggestedRole);
      assert.ok(task.description && task.acceptanceCriteria.length && task.dueDate);
      assert.ok(Date.parse(task.dueDate) <= Date.parse(sprint.endDate));
    }
  }
  assert.deepEqual(buildTestSprintPlan(input), plan);
});
test("different session dates and member IDs cannot reuse another fixture's plan", () => {
  const a = context(), b = context();
  b.session = { startDate: "2031-04-01", endDate: "2031-04-29" };
  b.members = b.members.map(m => ({ ...m, userId: `other-${m.userId}` }));
  const plan = buildTestSprintPlan(b);
  assert.notDeepEqual(plan, buildTestSprintPlan(a));
  assert.ok(plan.sprints.flatMap(s => s.tasks).every(t => t.assigneeId.startsWith("other-")));
});
test("missing or invalid real context fails instead of producing fake success", () => {
  for (const input of [{}, { ...context(), members: [] }, { ...context(), session: { startDate: "invalid", endDate: "2030-01-29" } }]) {
    assert.throws(() => buildTestSprintPlan(input));
  }
});
