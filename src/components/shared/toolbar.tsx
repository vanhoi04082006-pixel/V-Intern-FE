"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 icon text-faint" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-line bg-panel pl-9 pr-8 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-line-strong"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint transition-colors hover:text-ink"
          aria-label="Xóa tìm kiếm"
        >
          <X className="size-3.5 icon" />
        </button>
      ) : null}
    </div>
  );
}

export interface FilterSelectOption {
  value: string;
  label: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  allLabel = "Tất cả",
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  allLabel?: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
      <SelectTrigger
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          "h-9 rounded-lg border-line bg-panel text-sm text-dim hover:border-line-strong",
          className
        )}
      >
        <SelectValue placeholder={placeholder ?? allLabel} />
      </SelectTrigger>
      <SelectContent className="border-line bg-panel-2 text-ink">
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Thanh lọc chuẩn: search + các select + nút reset (hiện khi có bộ lọc). */
export function FilterBar({
  children,
  onReset,
  hasActive,
  className,
}: {
  children: React.ReactNode;
  onReset?: () => void;
  hasActive?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-panel/60 p-3",
        className
      )}
    >
      {children}
      {onReset && hasActive ? (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-dim transition-colors hover:border-line-strong hover:text-ink"
        >
          <X className="size-3.5 icon" /> Xóa lọc
        </button>
      ) : null}
    </div>
  );
}
