"use client";
import { useCallback, useState } from "react";
import { instructorOptions } from "@/lib/api/academic";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { inputClass, Pager } from "./primitives";
export function InstructorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    rows = useResource(
      useCallback((s: AbortSignal) => instructorOptions(page, q, s), [page, q]),
    );
  return (
    <div className="space-y-2">
      <label className="block text-sm">
        {label}
        <input
          className={`${inputClass} mt-2`}
          aria-label={"Tìm " + label.toLowerCase()}
          placeholder="Tìm tên hoặc email giảng viên..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <select
        aria-label={label}
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Chưa chọn giảng viên</option>
        {value && !rows.data?.items.some((r) => r.userId === value) && (
          <option value={value}>Giảng viên đang được chọn</option>
        )}
        {rows.data?.items.map((r) => (
          <option key={r.userId} value={r.userId}>
            {r.displayName} · {r.email}
          </option>
        ))}
      </select>
      {rows.loading ? (
        <LoadingState />
      ) : rows.error ? (
        <ErrorState error={rows.error} onRetry={rows.reload} />
      ) : (
        rows.data && <Pager {...rows.data} onChange={setPage} />
      )}
    </div>
  );
}
