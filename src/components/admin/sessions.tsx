"use client";
import { useState } from 'react';
import { SessionList } from '@/components/sessions/session-list';
import { AcademicDetail } from '@/components/product/academic';
export function AdminSessions() {
  const [selected, setSelected] = useState<string | null>(null), [revision, setRevision] = useState(0);
  return <><SessionList basePath="/admin" onManage={setSelected} refreshKey={revision} />{selected && <AcademicDetail key={selected} kind="sessions" id={selected} onClose={() => setSelected(null)} onChanged={() => setRevision(value => value + 1)} />}</>;
}
