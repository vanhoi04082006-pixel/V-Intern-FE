import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { buildTestSprintPlan } from "../project-first-provider.mjs";

const context = () => ({
  session: { startDate: "2030-01-01T00:00:00Z", endDate: "2030-01-29T00:00:00Z" },
  members: [{ userId: "frontend-id", roleInProject: "frontend" }, { userId: "backend-id", roleInProject: "backend" }],
});
test("test provider derives bounded dates and role-fit assignees from actual input", () => {
  const input = context(), plan = buildTestSprintPlan(input);
  assert.equal(plan.sprints.length, 2);
  assert.deepEqual(plan.milestones, []);
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
test("workflow isolates databases and exposes every ordered business contract as a separate step", () => {
  const yaml = fs.readFileSync(new URL("../../.github/workflows/phase7-fullstack.yml", import.meta.url), "utf8");
  const names = [...yaml.matchAll(/^\s+(?:DB_NAME|E2E_DB_NAME): (.+)$/gm)].map(match => match[1].trim());
  assert.equal(names.length, 2);
  assert.equal(names[0], names[1]);
  for (const name of names) {
    assert.match(name, /^VIntern_Phase715_CI_/);
    assert.ok(name.includes("${{ github.run_id }}") && name.includes("${{ github.run_attempt }}"));
  }
  const contracts = [...yaml.matchAll(/^ {6}- name: (\d{2}) - .+\r?\n {8}working-directory: V-INTERN-FE\r?\n {8}run: node scripts\/([^\s]+\.mjs)$/gm)];
  assert.deepEqual(contracts.map(match => match[1]), Array.from({ length: 14 }, (_, i) => String(i + 1).padStart(2, '0')));
  assert.deepEqual(contracts.map(match => match[2]), [
    'phase715-dev-fixtures.mjs', 'phase715-live-browser.mjs', 'phase7-work-live.mjs',
    'phase7-outcomes-fixture.mjs', 'phase7-outcomes-live.mjs', 'project-first-live.mjs',
    'phase7-instructor-live.mjs', 'phase7-admin-live.mjs', 'phase7-navigation-live.mjs',
    'phase7-uat-auth-live.mjs', 'phase7-uat-ui-live.mjs', 'phase7-uat-negative-live.mjs',
    'phase7-uat-finance-fixture.mjs', 'phase7-uat-finance-live.mjs',
  ]);
  assert.doesNotMatch(yaml, /continue-on-error:\s*true/);
  assert.match(yaml, /^ {6}COMPATIBLE_BE_SHA: [a-f0-9]{40}\r?$/m, 'Backend SHA must stay within jobs.sql2019.env');
  assert.match(yaml, /name: Dynamic career catalog acceptance\r?\n {8}working-directory: V-INTERN-FE\r?\n {8}run: node scripts\/career-roles-live\.mjs/);
  assert.match(yaml, /name: Knowledge authoring acceptance\r?\n {8}working-directory: V-INTERN-FE\r?\n {8}run: node scripts\/knowledge-library-live\.mjs/);
});
