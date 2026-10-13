import { request } from "./client";
import * as p from "./parse";

export const getAdminDashboard = (signal?: AbortSignal) => request('/dashboard/admin',value => {
  const v=p.record(value),m=p.record(v.metrics);
  return { metrics: { userCount:p.number(m.userCount),instructorCount:p.number(m.instructorCount),internCount:p.number(m.internCount),activeSessions:p.number(m.activeSessions),aiRunsToday:p.number(m.aiRunsToday) },
    users:p.array(v.users,v=>{const r=p.record(v);return{id:p.string(r.id),displayName:p.string(r.displayName),email:p.string(r.email),status:p.string(r.status),lastLoginAt:p.nullable(r.lastLoginAt,p.string)};}),
    roles:p.array(v.roles,v=>{const r=p.record(v);return{id:p.string(r.id),code:p.string(r.code),name:p.string(r.name),permissionCount:p.number(r.permissionCount)};}),
    activity:p.array(v.activity,v=>{const r=p.record(v);return{id:p.string(r.id),summary:p.nullable(r.summary,p.string),action:p.string(r.action),createdAt:p.string(r.createdAt),displayName:p.nullable(r.displayName,p.string)};}),
    statuses:p.array(v.statuses,v=>{const r=p.record(v);return{status:p.string(r.status),count:p.number(r.count)};}),generatedAt:p.string(v.generatedAt) };
},{signal});

export const getInstructorDashboard = (signal?: AbortSignal) => request("/dashboard/instructor", (value) => {
  const v = p.record(value), m = p.record(v.metrics);
  return {
    metrics: { sessionCount: p.number(m.sessionCount), activeSessions: p.number(m.activeSessions), internCount: p.number(m.internCount), taskCount: p.number(m.taskCount), todoCount: p.number(m.todoCount ?? 0), doingCount: p.number(m.doingCount ?? 0), doneCount: p.number(m.doneCount), reviewCount: p.number(m.reviewCount), overdueCount: p.number(m.overdueCount), averageScore: p.nullable(m.averageScore, p.number) },
    sessions: p.array(v.sessions, (value) => { const s = p.record(value); return { id: p.string(s.id), code: p.string(s.code), name: p.string(s.name), status: p.string(s.status), startDate: p.string(s.startDate), endDate: p.string(s.endDate), projectName: p.nullable(s.projectName ?? null, p.string), memberCount: p.number(s.memberCount), taskCount: p.number(s.taskCount), doneCount: p.number(s.doneCount) }; }),
    students: p.array(v.students, (value) => { const s = p.record(value); return { id: p.string(s.id), displayName: p.string(s.displayName), email: p.string(s.email), projectName: p.string(s.projectName), taskCount: p.number(s.taskCount), doneCount: p.number(s.doneCount), averageScore: p.nullable(s.averageScore, p.number) }; }),
    activity: p.array(v.activity, (value) => { const s = p.record(value); return { id: p.string(s.id), summary: p.nullable(s.summary, p.string), action: p.string(s.action), createdAt: p.string(s.createdAt), displayName: p.nullable(s.displayName, p.string) }; }),
    sprints: p.array(v.sprints, (value) => { const s = p.record(value); return { id: p.string(s.id), name: p.string(s.name), projectName: p.string(s.projectName), status: p.string(s.status), startDate: p.string(s.startDate), endDate: p.string(s.endDate) }; }),
    reviews: p.array(v.reviews ?? [], (value) => { const r = p.record(value); return {
      id: p.string(r.id), taskId: p.string(r.taskId), internId: p.string(r.internId),
      prUrl: p.string(r.prUrl), status: p.oneOf(r.status, ["submitted", "approved", "rework"] as const),
      score: p.nullable(r.score, p.number), submittedAt: p.string(r.submittedAt),
      taskCode: p.string(r.taskCode), taskTitle: p.string(r.taskTitle), projectId: p.string(r.projectId), displayName: p.string(r.displayName),
    }; }),
    generatedAt: p.string(v.generatedAt),
  };
}, { signal });
