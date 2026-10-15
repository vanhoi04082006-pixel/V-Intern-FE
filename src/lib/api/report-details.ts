import { array, boolean, nullable, number, oneOf, record, string } from './parse';
export function parseReportDetails(value: unknown) {
  const v = record(value), summary = record(v.summary);
  return {
    summary: { total: number(summary.total), completed: number(summary.completed), overdue: number(summary.overdue), blocked: number(summary.blocked), unassigned: number(summary.unassigned), risk: oneOf(summary.risk, ['low', 'medium', 'high']), reasons: array(summary.reasons, string) },
    tasks: array(v.tasks, raw => { const t = record(raw); return { id: string(t.id), code: string(t.code), title: string(t.title), status: string(t.status), assigneeId: nullable(t.assigneeId, string), assigneeName: nullable(t.assigneeName, string), sprintName: nullable(t.sprintName, string), dueDate: nullable(t.dueDate, string), blocked: boolean(t.blocked), submissionStatus: nullable(t.submissionStatus, string), aiStatus: nullable(t.aiStatus, string), aiScore: nullable(t.aiScore, number), instructorScore: nullable(t.instructorScore, number) }; }),
    sprints: array(v.sprints, raw => { const s = record(raw); return { id: string(s.id), name: string(s.name), status: string(s.status), total: number(s.total), completed: number(s.completed), overdue: number(s.overdue), blocked: number(s.blocked) }; }),
    timeline: array(v.timeline, raw => { const t = record(raw); return { taskId: string(t.taskId), taskCode: string(t.taskCode), toStatus: string(t.toStatus), createdAt: string(t.createdAt) }; }),
  };
}
