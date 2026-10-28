/** Tiện ích dùng chung cho backend mock (không phụ thuộc Next). */

export function nowIso(): string {
  return new Date().toISOString();
}

export function daysAgo(days: number, hours = 0): string {
  return new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();
}

export function daysFromNow(days: number, hours = 0): string {
  return new Date(Date.now() + days * 86400000 + hours * 3600000).toISOString();
}

export function addDaysIso(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86400000).toISOString();
}

export function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function randomToken(): string {
  return `tok_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

export function randomHex(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)];
  return s;
}

export function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return round1((part / total) * 100);
}

export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PageResult<T> {
  data: T[];
  meta: PageMeta;
}

/** Phân trang theo query `page` / `pageSize` (sau khi đã lọc + sắp xếp). */
export function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const p = Math.max(1, page || 1);
  const ps = clamp(pageSize || 10, 1, 100);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / ps));
  const start = (p - 1) * ps;
  return { data: items.slice(start, start + ps), meta: { total, page: p, pageSize: ps, totalPages } };
}

export function queryParams(q: URLSearchParams): { page: number; pageSize: number } {
  return {
    page: Number(q.get("page") ?? 1) || 1,
    pageSize: Number(q.get("pageSize") ?? 10) || 10,
  };
}

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export function includesNoAccent(haystack: string, needle: string): boolean {
  return normalizeText(haystack).includes(normalizeText(needle));
}
