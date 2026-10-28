"use client";
import { useCallback, useState } from "react";
import {
  getAcademic,
  listAcademic,
  type AcademicKind,
} from "@/lib/api/academic";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { inputClass, Pager } from "./primitives";
/** All options stay reachable through real search/pagination. A selected row stays visible across pages. */
export function AcademicPicker({
  kind,
  label,
  value,
  onChange,
  required = false,
  assignable = false,
  compact = false,
  projectId,
}: {
  kind: AcademicKind;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  assignable?: boolean;
  compact?: boolean;
  projectId?: string;
}) {
  const [page, setPage] = useState(1),
    [q, setQ] = useState("");
  const rows = useResource(
    useCallback(
      (s: AbortSignal) =>
        listAcademic(
          kind,
          page,
          q,
          assignable && kind === "projects" ? "active" : "",
          s,
          kind === "sessions" && projectId ? { projectId } : {},
        ),
      [kind, page, q, assignable, projectId],
    ),
  );
  const selected = useResource(
    useCallback(
      (s: AbortSignal) =>
        value ? getAcademic(kind, value, s) : Promise.resolve(null),
      [kind, value],
    ),
  );
  const options =
    rows.data?.items.filter(
      (row) =>
        !assignable ||
        kind !== "sessions" ||
        ["upcoming", "active"].includes(row.status),
    ) ?? [];
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <label className="block text-sm">
        {label}
        <input
          aria-label={`Tìm ${label.toLowerCase()}`}
          className={`${inputClass} mt-1`}
          placeholder="Tìm mã hoặc tên..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label={label}
          required={required}
          className={`${inputClass} mt-2`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Chọn {label.toLowerCase()}</option>
          {value && !options.some((row) => row.id === value) && (
            <option value={value}>
              {selected.data?.name ?? "Đang tải lựa chọn"}
            </option>
          )}
          {options.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name} · {row.code}
            </option>
          ))}
        </select>
      </label>
      {rows.loading && <LoadingState />}
      {Boolean(rows.error) && (
        <ErrorState error={rows.error} onRetry={rows.reload} />
      )}{" "}
      {rows.data && rows.data.totalPages > 1 && (
        <Pager {...rows.data} onChange={setPage} />
      )}
      {rows.data && rows.data.totalPages <= 1 && (
        <p className="text-xs text-slate-400">{rows.data.total} bản ghi</p>
      )}
    </div>
  );
}
