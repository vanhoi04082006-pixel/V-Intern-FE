import { ApiError, isRecord } from "@/lib/auth/api-client";
export function invalid(): never {
  throw new ApiError(
    0,
    "INVALID_RESPONSE",
    "Phản hồi backend không đúng contract.",
  );
}
export function record(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : invalid();
}
export function string(value: unknown): string {
  return typeof value === "string" ? value : invalid();
}
export function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : invalid();
}
export function boolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : invalid();
}
export function nullable<T>(
  value: unknown,
  parse: (v: unknown) => T,
): T | null {
  return value === null ? null : parse(value);
}
export function array<T>(value: unknown, parse: (v: unknown) => T): T[] {
  return Array.isArray(value) ? value.map(parse) : invalid();
}
export function oneOf<const T extends readonly string[]>(
  value: unknown,
  values: T,
): T[number] {
  const parsed = string(value);
  return values.find((v) => v === parsed) ?? invalid();
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
/** General Nest pagination contract. Recruitment candidates is an explicit legacy-shaped exception. */
export function parsePage<T>(
  value: unknown,
  parseItem: (v: unknown) => T,
): Page<T> {
  const body = record(value);
  const meta = record(body.meta);
  return {
    items: array(body.data, parseItem),
    total: number(meta.total),
    page: number(meta.page),
    pageSize: number(meta.pageSize),
    totalPages: number(meta.totalPages),
  };
}
