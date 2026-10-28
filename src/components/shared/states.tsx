"use client";

import * as React from "react";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingBlock({
  rows = 4,
  className,
  variant = "list",
}: {
  rows?: number;
  className?: string;
  variant?: "list" | "cards" | "detail";
}) {
  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="card-surface space-y-3 p-5">
            <Skeleton className="h-4 w-2/3 rounded-md skeleton-shimmer" />
            <Skeleton className="h-8 w-1/3 rounded-md skeleton-shimmer" />
            <Skeleton className="h-3 w-full rounded-md skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "detail") {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-1/3 rounded-md skeleton-shimmer" />
        <div className="card-surface space-y-3 p-5">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded-md skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("card-surface divide-y divide-line", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-9 rounded-full skeleton-shimmer" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2 rounded-md skeleton-shimmer" />
            <Skeleton className="h-3 w-1/4 rounded-md skeleton-shimmer" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function ErrorBlock({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message =
    error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tải dữ liệu.";
  return (
    <div className={cn("card-surface px-6 py-10 text-center", className)} role="alert">
      <div className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-rose/10 text-rose">
        <AlertTriangle className="size-5 icon" />
      </div>
      <p className="text-sm font-semibold text-ink">Không tải được dữ liệu</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-dim">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCcw className="size-3.5 icon" /> Thử lại
        </Button>
      ) : null}
    </div>
  );
}

export function InlineSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin icon", className)} aria-label="Đang tải" />;
}
