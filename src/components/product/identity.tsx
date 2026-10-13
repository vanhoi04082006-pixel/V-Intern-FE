import { csvCell } from '@/lib/api/management';

// Portraits supplied in the user's sample design. Unknown people keep initials.
const samplePortraits: Record<string, { x: number; y: number }> = {
  "Nguyễn Minh Anh": { x: 324, y: 412 },
  "Trần Thị Bảo Ngọc": { x: 324, y: 461 },
  "Phạm Quang Duy": { x: 324, y: 558 },
  "Nguyễn Thị Mai": { x: 324, y: 607 },
  "Đặng Thùy Linh": { x: 324, y: 706 },
  "Trần Quốc Huy": { x: 324, y: 758 },
};
export function Person({ name, secondary }: { name: string; secondary?: string }) {
  return <span className="flex min-w-0 items-center gap-2.5">
    <PersonAvatar name={name} />
    <span className="min-w-0"><strong title={name} className="block truncate text-[12px] font-semibold leading-5 text-[#10164b]">{name}</strong>{secondary && <span className="block text-[10px] leading-4 text-slate-500">{secondary}</span>}</span>
  </span>;
}
export function PersonAvatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('');
  const portrait = samplePortraits[name];
  return <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 text-[11px] font-semibold text-blue-700">
      {portrait ? <svg viewBox={`${portrait.x - 15} ${portrait.y - 15} 30 30`} className="h-full w-full"><image href="/images/users-reference.png" width="1672" height="941" /></svg> : initials}
  </span>;
}
/** Export the displayed, authenticated data; formula-like cells remain text in spreadsheets. */
export function exportCsv(filename: string, columns: string[], rows: string[][]) {
  const csv = [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a'); link.href=url; link.download=filename; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
