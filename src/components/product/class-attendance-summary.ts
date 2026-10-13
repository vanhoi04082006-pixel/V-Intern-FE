import type { ClassLesson } from '@/lib/api/class-lessons';
/** Ratios use recorded marks; excused and unmarked students are not counted as absences. */
export function attendanceSummary(lessons: ClassLesson[]) {
  const rows = lessons.filter(l => l.status !== 'cancelled');
  const attended = rows.reduce((n, l) => n + l.attendedCount, 0), absent = rows.reduce((n, l) => n + l.absentCount, 0), late = rows.reduce((n, l) => n + l.lateCount, 0);
  const total = attended + absent;
  return { attended, absent, late, total, rate: total ? Math.round(attended / total * 100) : null };
}
