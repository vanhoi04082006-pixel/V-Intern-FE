"use client";
import { ApiError, errorMessage } from "@/lib/auth/api-client";
export function ErrorState({
  error,
  onRetry,
  title = 'Không thể tải dữ liệu',
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const validation = error instanceof ApiError && error.code === 'VALIDATION_ERROR' && [400, 422].includes(error.statusCode) && Array.isArray(error.details)
    ? error.details.filter((detail): detail is string => typeof detail === 'string').slice(0, 8).map(detail => detail.slice(0, 240)) : [];
  return (
    <div
      role="alert"
      className="mx-auto my-8 max-w-xl rounded-xl border border-red-200 bg-white p-6 text-slate-700"
    >
      <h2 className="font-bold text-navy">{title}</h2>
      <p className="mt-2 text-sm">{errorMessage(error)}</p>
      {validation.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs">{validation.map((detail, index) => <li key={index}>{detail}</li>)}</ul>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
export function LoadingState({
  label = "Đang tải dữ liệu...",
}: {
  label?: string;
}) {
  return (
    <p role="status" className="p-8 text-center text-sm text-slate-500">
      {label}
    </p>
  );
}
