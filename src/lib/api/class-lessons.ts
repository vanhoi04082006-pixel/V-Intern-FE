import { request } from './client';
import { array, nullable, number, oneOf, record, string } from './parse';
export const attendanceStatuses = ['present', 'late', 'absent', 'excused'] as const;
export type AttendanceStatus = typeof attendanceStatuses[number];
export const attendanceLabels: Record<AttendanceStatus, string> = { present: 'Có mặt', late: 'Đi muộn', absent: 'Vắng mặt', excused: 'Có phép' };
export function parseLesson(value: unknown) {
  const v = record(value);
  return { id: string(v.id), classId: string(v.classId), title: string(v.title), startsAt: string(v.startsAt), endsAt: string(v.endsAt), mode: oneOf(v.mode, ['online', 'on_site']), location: string(v.location), status: oneOf(v.status, ['scheduled', 'completed', 'cancelled']), version: number(v.version),
    markedCount: v.markedCount == null ? 0 : number(v.markedCount), attendedCount: v.attendedCount == null ? 0 : number(v.attendedCount), absentCount: v.absentCount == null ? 0 : number(v.absentCount), lateCount: v.lateCount == null ? 0 : number(v.lateCount), excusedCount: v.excusedCount == null ? 0 : number(v.excusedCount) };
}
export type ClassLesson = ReturnType<typeof parseLesson>;
export const getClassLessons = (classId: string, signal?: AbortSignal) => request(`/classes/${encodeURIComponent(classId)}/lessons`, x => {
  const v = record(x);
  return { lessons: array(v.lessons, parseLesson), announcements: array(v.announcements, x => { const a = record(x); return { id: string(a.id), title: string(a.title), body: string(a.body), actorName: string(a.actorName), createdAt: string(a.createdAt) }; }) };
}, { signal });
export const getClassAttendance = (classId: string, lessonId: string, signal?: AbortSignal) => request(`/classes/${encodeURIComponent(classId)}/lessons/${encodeURIComponent(lessonId)}/attendance`, x => {
  const v = record(x);
  return { lesson: parseLesson(v.lesson), members: array(v.members, x => { const m = record(x); return { userId: string(m.userId), displayName: string(m.displayName), email: string(m.email), status: nullable(m.status, x => oneOf(x, attendanceStatuses)), note: nullable(m.note, string), currentMember: number(m.currentMember) === 1 }; }) };
}, { signal });
export interface LessonInput { title: string; startsAt: string; endsAt: string; mode: 'online' | 'on_site'; location: string }
export const createClassLesson = (classId: string, body: LessonInput) => request(`/classes/${encodeURIComponent(classId)}/lessons`, parseLesson, { method: 'POST', body });
export const updateClassLesson = (classId: string, lessonId: string, body: LessonInput & { version: number; status: ClassLesson['status'] }) => request(`/classes/${encodeURIComponent(classId)}/lessons/${encodeURIComponent(lessonId)}`, parseLesson, { method: 'PATCH', body });
export const saveClassAttendance = (classId: string, lessonId: string, version: number, marks: { userId: string; status: AttendanceStatus; note?: string }[]) => request(`/classes/${encodeURIComponent(classId)}/lessons/${encodeURIComponent(lessonId)}/attendance`, x => number(record(x).version), { method: 'PUT', body: { version, marks } });
export const announceClass = (classId: string, title: string, body: string) => request(`/classes/${encodeURIComponent(classId)}/announcements`, x => number(record(x).sentCount), { method: 'POST', body: { title, body } });
