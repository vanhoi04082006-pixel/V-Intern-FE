import assert from "node:assert/strict";
import { test } from "node:test";
import { assertUnpublished, assertPublishedDelivery, assertReplayDelivery } from "../project-first-delivery.mjs";

const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function fixture() {
  const scope = { projectId: id(1), sessionId: id(2) };
  const task = { title: "Repeated title", description: "Reviewed description", acceptanceCriteria: ["Reviewed criterion"], assigneeId: id(3), dueDate: "2030-01-05", priority: "high", storyPoints: 3, suggestedRole: "frontend" };
  const draft = { sprints: [0, 1].map(i => ({ code: null, name: "Repeated sprint name", goal: "Reviewed goal", startDate: "2030-01-01", endDate: "2030-01-10", tasks: Array.from({ length: i + 1 }, () => structuredClone(task)) })) };
  const summary = { sprintIds: [id(10), id(11)], taskIds: [id(20), id(21), id(22)], sprintCount: 2, taskCount: 3, deduped: false };
  const rows = { sprints: [], tasks: [] };
  let ordinal = 0;
  draft.sprints.forEach((s, si) => {
    rows.sprints.push({ ...scope, id: summary.sprintIds[si].toUpperCase(), name: s.name, goal: s.goal, startDate: new Date(s.startDate), endDate: new Date(s.endDate), status: "planned" });
    s.tasks.forEach(t => rows.tasks.push({ ...scope, ...t, id: summary.taskIds[ordinal++].toUpperCase(), sprintId: summary.sprintIds[si].toUpperCase(), dueDate: new Date(t.dueDate), status: "todo", deletedAt: null, specJson: JSON.stringify({ requirements: t.description, dod: t.acceptanceCriteria, role: t.suggestedRole }) }));
  });
  // DB row order is deliberately unrelated to draft order; titles are not unique.
  rows.sprints.reverse(); rows.tasks.reverse();
  return { scope, draft, summary, rows };
}
const verify = f => assertPublishedDelivery(f.scope, f.draft, f.summary, f.rows);

test("matches draft ordinals through Confirm IDs, independent of duplicate titles, SQL order and UUID casing", () => {
  const f = fixture(), result = verify(f);
  assert.equal(result.sprintCount, 2); assert.equal(result.taskCount, 3);
  assert.deepEqual(result.mapping[0].taskIds, [id(20)]);
  assert.deepEqual(result.mapping[1].taskIds, [id(21), id(22)]);
});
test("Ready/pre-Confirm rejects any premature sprint or task, including an orphan or soft-deleted task", () => {
  const f = fixture();
  assert.doesNotThrow(() => assertUnpublished(f.scope, { sprints: [], tasks: [] }, "draft-ready"));
  for (const rows of [{ sprints: [f.rows.sprints[0]], tasks: [] }, { sprints: [], tasks: [{ ...f.rows.tasks[0], sprintId: null }] }, { sprints: [], tasks: [{ ...f.rows.tasks[0], deletedAt: new Date() }] }]) {
    assert.throws(() => assertUnpublished(f.scope, rows, "pre-confirm"), /pre-confirm/);
  }
});
test("rejects extra published rows rather than accepting positive totals", () => {
  for (const collection of ["sprints", "tasks"]) {
    const f = fixture(); f.rows[collection].push({ ...f.rows[collection][0], id: id(99) });
    assert.throws(() => verify(f));
  }
});
test("rejects malformed counts, missing/duplicate/invalid Confirm UUIDs and wrong ID sets at equal counts", () => {
  const mutations = [
    f => { f.summary.taskCount = 4; },
    f => { f.summary.sprintIds.pop(); },
    f => { f.summary.taskIds[1] = f.summary.taskIds[0]; },
    f => { f.summary.taskIds[0] = "not-a-uuid"; },
    f => { f.rows.tasks[0].id = id(99); },
    f => { f.rows.sprints[0].id = id(99); },
  ];
  for (const mutate of mutations) { const f = fixture(); mutate(f); assert.throws(() => verify(f)); }
});
test("rejects wrong task parent even when titles, fields, counts and ID sets match", () => {
  const f = fixture(); f.rows.tasks.find(t => t.id.toLowerCase() === id(20)).sprintId = id(11);
  assert.throws(() => verify(f), /parent/);
});
test("rejects foreign Session/Project rows and orphan tasks", () => {
  for (const mutate of [
    f => { f.rows.sprints[0].sessionId = id(90); },
    f => { f.rows.sprints[0].projectId = id(90); },
    f => { f.rows.tasks[0].projectId = id(90); },
    f => { f.rows.tasks[0].sessionId = id(90); },
    f => { f.rows.tasks[0].sprintId = null; },
  ]) { const f = fixture(); mutate(f); assert.throws(() => verify(f)); }
});
test("checks every task's description, criteria, assignee and exact deadline", () => {
  for (const mutate of [
    t => { t.description = "Unreviewed"; },
    t => { t.specJson = JSON.stringify({ dod: ["Wrong"], requirements: t.description, role: t.suggestedRole }); },
    t => { t.assigneeId = id(90); },
    t => { t.dueDate = new Date("2030-01-06"); },
  ]) { const f = fixture(); mutate(f.rows.tasks[0]); assert.throws(() => verify(f)); }
});
test("replay must preserve exact IDs/hierarchy and fields, not just counts", () => {
  const f = fixture(), baseline = verify(f);
  assert.deepEqual(assertReplayDelivery(f.scope, f.draft, { ...f.summary, deduped: true }, f.rows, baseline), baseline);
  const changed = fixture();
  changed.summary.taskIds[0] = id(99);
  changed.rows.tasks.find(t => t.id.toLowerCase() === id(20)).id = id(99);
  // Internally consistent new IDs still violate replay identity.
  assert.doesNotThrow(() => verify(changed));
  assert.throws(() => assertReplayDelivery(changed.scope, changed.draft, { ...changed.summary, deduped: true }, changed.rows, baseline));
  assert.throws(() => assertReplayDelivery(f.scope, f.draft, f.summary, f.rows, baseline));
});
