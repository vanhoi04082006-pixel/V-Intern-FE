
import {
  IconCalendarDays,
} from "@/components/v-intern/icons";
/** Calendar-day urgency; an old date on a completed task is not an open warning. */
export function describeTaskDeadline(value: string | null | undefined, status: string, now = new Date()) {
  const dayOnly = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const due = dayOnly ? new Date(Number(dayOnly[1]), Number(dayOnly[2]) - 1, Number(dayOnly[3])) : new Date(value ?? '');
  if (!Number.isFinite(due.getTime())) return { tone: 'neutral', date: 'Chưa có hạn', relative: null } as const;
  const date = due.toLocaleDateString('vi-VN');
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const distance = Math.round((day(due) - day(now)) / 86_400_000);
  if (status === 'done') return { tone: 'neutral', date, relative: null } as const;
  if (distance < 0) return { tone: 'danger', date, relative: `Quá hạn ${Math.abs(distance)} ngày` } as const;
  if (distance <= 1) return { tone: 'warning', date, relative: distance ? 'Ngày mai' : 'Hôm nay' } as const;
  return { tone: 'neutral', date, relative: null } as const;
}

export function TaskDeadline({ value, status, compact = false }: { value?: string | null; status: string; compact?: boolean }) {
  const deadline = describeTaskDeadline(value, status);
  return <span className={`workspace-deadline${compact ? ' workspace-deadline-compact' : ''}`} data-tone={deadline.tone}>
    <IconCalendarDays size={13} aria-hidden="true" />
    <time dateTime={deadline.date === 'Chưa có hạn' ? undefined : value ?? undefined} title={deadline.date}>
      {deadline.relative ?? deadline.date}
      {deadline.relative && <small>{deadline.date}</small>}
    </time>
  </span>;
}
