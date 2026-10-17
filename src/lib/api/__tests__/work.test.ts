import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  parseTask,
  parseBoard,
  nextOwnStatus,
  addTaskComment,
  updateOwnTask,
} from "../work";
import { request } from "../client";
import { listSubmissions } from '../submissions';
vi.mock("../client", () => ({ request: vi.fn() }));
const task = {
  id: "t",
  code: "VIN-1",
  title: "Nhiệm vụ",
  description: null,
  projectId: "p",
  sprintId: null,
  assigneeId: "u",
  status: "todo",
  priority: "medium",
  progress: 0,
  dueDate: null,
  storyPoints: null,
  version: 1,
};
describe("Nest work boundary", () => {
  it('validates the stored submission source ref without inventing one for legacy rows', () => {
    listSubmissions('t');
    const parse = vi.mocked(request).mock.calls[0][1];
    const sub = { id: 'sub1', taskId: 't', internId: 'u', prUrl: 'https://github.com/owner/repo/pull/1', summary: 'Ready', status: 'submitted', score: null, feedback: null, headSha: null, submittedAt: '2026-10-16' };
    expect(parse([{ ...sub, sourceKind: 'branch', sourceRef: 'feature/notes' }])).toMatchObject([{ sourceKind: 'branch', sourceRef: 'feature/notes' }]);
    expect(parse([sub])).toEqual([expect.not.objectContaining({ sourceRef: expect.anything() })]);
    expect(() => parse([{ ...sub, sourceRef: 123 }])).toThrow();
    expect(() => parse([{ ...sub, sourceKind: 'pretend_branch' }])).toThrow();
  });
  it('preserves the server-wide overdue count and Sprint context beyond preview pages', () => {
    const board = { sprint: { id: 'sp1', code: 'SP-1', name: 'Build', status: 'active', projectId: 'p1', sessionId: 's1', goal: 'Ship', description: null, startDate: '2026-10-01', endDate: '2026-10-10' }, total: 102, columns: [], overdueOpenTaskCount: 1 };
    expect(parseBoard(board)).toMatchObject({ overdueOpenTaskCount: 1, sprint: { sessionId: 's1', goal: 'Ship' } });
    expect(() => parseBoard({ ...board, overdueOpenTaskCount: 'many' })).toThrow();
  });
  it("accepts the real critical priority and rejects legacy urgent", () => {
    expect(parseTask({ ...task, priority: "critical" }).priority).toBe(
      "critical",
    );
    expect(() => parseTask({ ...task, priority: "urgent" })).toThrow();
  });
  beforeEach(() => vi.clearAllMocks());
  it("parses nullable actual task fields", () =>
    expect(parseTask(task)).toEqual(task));
  it('preserves scoped sprint display data instead of forcing the UI to show its UUID', () => {
    const sprint = { id: 's', code: 'SP-1', name: 'Nền tảng ghi chú', status: 'active' };
    expect(parseTask({ ...task, sprintId: 's', sprint }).sprint).toEqual(sprint);
    expect(() => parseTask({ ...task, sprint: { ...sprint, name: 123 } })).toThrow();
  });
  it("rejects legacy/invalid task status", () =>
    expect(() => parseTask({ ...task, status: "in_progress" })).toThrow());
  it('preserves repository state on task cards and rejects unknown provider states', () => {
    const repository = { status: 'ready', fullName: 'teacher/vintern-project' };
    expect(parseTask({ ...task, repository }).repository).toEqual(repository);
    expect(() => parseTask({ ...task, repository: { ...repository, status: 'pretend_ready' } })).toThrow();
  });
  it("rejects invented progress", () =>
    expect(() => parseTask({ ...task, progress: "70" })).toThrow());
  it("never offers intern approval or rework", () => {
    expect(nextOwnStatus("todo")).toBe("doing");
    expect(nextOwnStatus("doing")).toBe("review");
    expect(nextOwnStatus("review")).toBeNull();
    expect(nextOwnStatus("done")).toBeNull();
  });
  it("uses content, not legacy body", async () => {
    await addTaskComment("t", "Bình luận");
    expect(request).toHaveBeenCalledWith(
      "/tasks/t/comments",
      expect.any(Function),
      { method: "POST", body: { content: "Bình luận" } },
    );
  });
  it("only sends own-task contract fields", async () => {
    await updateOwnTask("t", { status: "doing", progress: 30 });
    expect(request).toHaveBeenCalledWith("/tasks/t/my", expect.any(Function), {
      method: "PATCH",
      body: { status: "doing", progress: 30 },
    });
  });
  it("uses server column counts and total, even with paged tasks", () => {
    const board = parseBoard({
      sprint: {
        id: "s",
        name: "Sprint",
        code: "S1",
        status: "active",
        projectId: "p",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      },
      total: 22,
      columns: [
        {
          status: "todo",
          count: 22,
          tasks: [
            {
              id: "t",
              code: "VIN-1",
              title: "Task",
              status: "todo",
              priority: "low",
              progress: 0,
              dueDate: null,
              assigneeId: null,
            },
          ],
        },
      ],
    });
    expect(board.total).toBe(22);
    expect(board.columns[0].count).toBe(22);
  });
});
