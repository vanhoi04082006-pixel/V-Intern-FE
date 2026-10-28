"use client";
import { CircleAlert } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/auth/api-client";
import { btn, Spinner } from "@/components/product/primitives";

/** Lỗi tải dữ liệu: thông điệp an toàn + chi tiết validation có giới hạn + retry. */
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
      className="mx-auto my-8 max-w-xl rounded-2xl border border-rose-200/80 bg-white p-6 shadow-xs"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
          <CircleAlert size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-navy">{title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">{errorMessage(error)}</p>
          {validation.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-600">
              {validation.map((detail, index) => <li key={index}>{detail}</li>)}
            </ul>
          )}
          {onRetry && (
            <button type="button" onClick={onRetry} className={`mt-4 ${btn("secondary", "sm")}`}>
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Trạng thái đang tải: spinner + nhãn, dùng được cho cả vùng nội dung lớn lẫn nhỏ. */
export function LoadingState({
  label = "Đang tải dữ liệu...",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2.5 p-8 text-sm text-slate-500"
    >
      <Spinner className="size-4 text-blue-600" />
      <span>{label}</span>
    </div>
  );
}
