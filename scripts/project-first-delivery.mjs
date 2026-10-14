/** CI assertions only: no writes, provider override, or production imports. */
import assert from "node:assert/strict";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function uuid(value, label) {
  assert.equal(typeof value, "string", `${label}: UUID required`);
  assert.match(value, UUID, `${label}: invalid UUID`);
  return value.toLowerCase();
}
function ids(values, label) {
  assert.ok(Array.isArray(values), `${label}: ID array required`);
  const normalized = values.map(value => uuid(value, label));
  assert.equal(new Set(normalized).size, normalized.length, `${label}: duplicate IDs`);
  return normalized.sort();
}
function iso(value) {
  const date = new Date(value);
  assert.ok(value !== null && value !== undefined && Number.isFinite(date.getTime()), "Valid persisted/draft date required");
  return date.toISOString();
}
export async function readDelivery(ds, scope) {
  const params = [scope.sessionId, scope.projectId];
  // Each template run creates its own project. Include that whole project as
  // well as the exact session to expose misplaced/orphan/soft-deleted rows.
  const [sprints, tasks] = await Promise.all([
    ds.query("SELECT id,code,name,goal,projectId,sessionId,status,startDate,endDate FROM sprints WHERE sessionId=@0 OR projectId=@1", params),
    ds.query(`SELECT t.id,t.code,t.title,t.description,t.projectId,t.sprintId,t.assigneeId,
      t.priority,t.storyPoints,t.status,t.dueDate,t.deletedAt,s.sessionId,sp.specJson
      FROM tasks t LEFT JOIN sprints s ON s.id=t.sprintId LEFT JOIN task_specs sp ON sp.taskId=t.id
      WHERE s.sessionId=@0 OR t.projectId=@1`, params),
  ]);
  return { sprints, tasks };
}
export function assertUnpublished(scope, rows, phase) {
  const evidence = { phase, sessionId: uuid(scope.sessionId, "session"), projectId: uuid(scope.projectId, "project"), sprintCount: rows.sprints.length, taskCount: rows.tasks.length, sprintIds: ids(rows.sprints.map(s => s.id), "DB sprints"), taskIds: ids(rows.tasks.map(t => t.id), "DB tasks") };
  assert.equal(evidence.sprintCount, 0, `${phase}: PRODUCT REGRESSION SUSPECTED: Sprint before Confirm ${JSON.stringify(evidence)}`);
  assert.equal(evidence.taskCount, 0, `${phase}: PRODUCT REGRESSION SUSPECTED: Task before Confirm ${JSON.stringify(evidence)}`);
  return evidence;
}
export function assertPublishedDelivery(scope, draft, summary, rows) {
  const sessionId = uuid(scope.sessionId, "session"), projectId = uuid(scope.projectId, "project");
  const sprintCount = draft.sprints.length, taskCount = draft.sprints.reduce((n, s) => n + s.tasks.length, 0);
  assert.ok(sprintCount > 0 && taskCount > 0, "Reviewed draft must contain delivery");
  assert.equal(summary.sprintCount, sprintCount, "Confirm sprint count vs reviewed draft");
  assert.equal(summary.taskCount, taskCount, "Confirm task count vs reviewed draft");
  assert.equal(typeof summary.deduped, "boolean", "Confirm deduped flag required");
  const sprintIds = ids(summary.sprintIds, "Confirm sprints"), taskIds = ids(summary.taskIds, "Confirm tasks");
  assert.equal(sprintIds.length, sprintCount, "Confirm sprint ID count");
  assert.equal(taskIds.length, taskCount, "Confirm task ID count");
  assert.equal(rows.sprints.length, sprintCount, `${sessionId}: DB sprint count vs reviewed draft`);
  assert.equal(rows.tasks.length, taskCount, `${sessionId}: DB task count vs reviewed draft`);
  assert.deepEqual(ids(rows.sprints.map(s => s.id), "DB sprints"), sprintIds, "DB/Confirm sprint ID sets");
  assert.deepEqual(ids(rows.tasks.map(t => t.id), "DB tasks"), taskIds, "DB/Confirm task ID sets");
  const sprintById = new Map(rows.sprints.map(s => [uuid(s.id, "sprint"), s]));
  const taskById = new Map(rows.tasks.map(t => [uuid(t.id, "task"), t]));
  const mapping = [];
  let taskOrdinal = 0;
  // Pinned BE confirm() pushes sprint IDs in draft order and task IDs in the
  // nested sprint/task traversal order. Drafts have no persisted/temp IDs.
  draft.sprints.forEach((expected, si) => {
    const sprintId = uuid(summary.sprintIds[si], "ordered sprint"), actual = sprintById.get(sprintId);
    assert.equal(uuid(actual.projectId, "sprint project"), projectId, "Sprint project scope");
    assert.equal(uuid(actual.sessionId, "sprint session"), sessionId, "Sprint session scope");
    assert.equal(actual.status, "planned", "Published sprint state");
    assert.equal(actual.name, expected.name, `Sprint ${si + 1} name`);
    assert.equal(actual.goal, expected.goal ?? null, `Sprint ${si + 1} goal`);
    assert.equal(iso(actual.startDate), iso(expected.startDate), `Sprint ${si + 1} start`);
    assert.equal(iso(actual.endDate), iso(expected.endDate), `Sprint ${si + 1} end`);
    const mapped = { sprintOrdinal: si + 1, sprintId, taskIds: [] };
    expected.tasks.forEach((task, ti) => {
      const taskId = uuid(summary.taskIds[taskOrdinal++], "ordered task"), row = taskById.get(taskId), label = `Task ${si + 1}.${ti + 1}`;
      assert.equal(uuid(row.sprintId, "task parent"), sprintId, `${label} parent`);
      assert.equal(uuid(row.sessionId, "task session"), sessionId, `${label} session scope`);
      assert.equal(uuid(row.projectId, "task project"), projectId, `${label} project scope`);
      assert.equal(row.deletedAt, null, `${label} must not be soft-deleted`);
      assert.equal(row.status, "todo", `${label} published state`);
      assert.equal(row.title, task.title, `${label} title`);
      assert.equal(row.description, task.description ?? null, `${label} description`);
      assert.equal(uuid(row.assigneeId, "persisted assignee"), uuid(task.assigneeId, "reviewed assignee"), `${label} assignee`);
      assert.equal(iso(row.dueDate), iso(task.dueDate ?? expected.endDate), `${label} deadline`);
      assert.equal(row.priority, task.priority, `${label} priority`);
      assert.equal(row.storyPoints, task.storyPoints ?? null, `${label} points`);
      const spec = JSON.parse(row.specJson);
      assert.deepEqual(spec.dod, task.acceptanceCriteria, `${label} acceptance criteria`);
      assert.equal(spec.requirements, task.description ?? task.title, `${label} requirements`);
      if (task.suggestedRole) assert.equal(spec.role, task.suggestedRole, `${label} role`);
      mapped.taskIds.push(taskId);
    });
    mapping.push(mapped);
  });
  return { sessionId, projectId, sprintCount, taskCount, sprintIds, taskIds, mapping };
}
export function assertReplayDelivery(scope, draft, summary, rows, baseline) {
  assert.equal(summary.deduped, true, "Confirm replay must be deduped");
  const replay = assertPublishedDelivery(scope, draft, summary, rows);
  assert.deepEqual(replay, baseline, "Replay changed exact published identities or hierarchy");
  return replay;
}
