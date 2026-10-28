"use client";

import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

/** Expanding content does not acknowledge or mutate the notification. */
export function NotificationText({ body, className }: { body: string | null; className?: string }) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  if (!body) return null;
  const expandable = body.length > 180;
  return <div>
    <p id={id} className={cn(className, 'notebook-notification-copy')} data-collapsed={expandable && !expanded ? 'true' : undefined}>{body}</p>
    {expandable && <button
      type="button"
      aria-expanded={expanded}
      aria-controls={id}
      onClick={() => setExpanded(value => !value)}
      className="notebook-notification-expand"
    >{expanded ? 'Thu gọn' : 'Đọc đầy đủ'}</button>}
  </div>;
}
