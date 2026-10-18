import { request } from './client';
import { array, nullable, number, record, string } from './parse';
import { parsePerformance } from './outcomes';
export function parseStudentDetail(value: unknown) {
  const v = record(value), profile = record(v.profile), tasks = record(v.tasks);
  return {
    profile: { id: string(profile.id), displayName: nullable(profile.displayName, string), email: string(profile.email), selectedRole: nullable(profile.selectedRole, string) },
    interview: nullable(v.interview, record), metrics: parsePerformance({ metrics: v.metrics }),
    assignments: array(v.assignments, raw => { const a = record(raw); return { id: string(a.id), projectId: string(a.projectId), projectName: string(a.projectName), sessionId: string(a.sessionId), sessionName: string(a.sessionName), role: nullable(a.roleInProject, string), status: string(a.status) }; }),
    tasks: { total: number(tasks.total), page: number(tasks.page), pageSize: number(tasks.pageSize), items: array(tasks.items, raw => {
      const t = record(raw);
      return { id: string(t.id), code: string(t.code), title: string(t.title), status: string(t.status), dueDate: nullable(t.dueDate, string), sprintName: nullable(t.sprintName, string), sessionId: nullable(t.sessionId, string),
        submissionId: nullable(t.submissionId, string), submissionStatus: nullable(t.submissionStatus, string), headSha: nullable(t.headSha, string), instructorScore: nullable(t.instructorScore, number), instructorFeedback: nullable(t.instructorFeedback, string),
        aiReviewStatus: nullable(t.aiReviewStatus, string), aiScore: nullable(t.aiScore, number), aiSummary: nullable(t.aiSummary, string) };
    }) },
    trend: array(v.trend, raw => { const t = record(raw); return { month: string(t.month), created: number(t.created), completed: number(t.completed) }; }),
  };
}
export const getStudentDetail = (id: string, page: number, scope: string, signal?: AbortSignal) => {
  const params = new URLSearchParams(scope); params.set('page', String(page)); params.set('pageSize', '10');
  return request(`/performance/interns/${encodeURIComponent(id)}/detail?${params}`, parseStudentDetail, { signal });
};
