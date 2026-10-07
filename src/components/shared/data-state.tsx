"use client";
import { errorMessage } from "@/lib/auth/api-client";
export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto my-8 max-w-xl rounded-xl border border-red-200 bg-white p-6 text-slate-700"
    >
      <h2 className="font-bold text-navy">Không thể tải dữ liệu</h2>
      <p className="mt-2 text-sm">{errorMessage(error)}</p>
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
