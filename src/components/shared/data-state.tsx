"use client";
import { IconCircleHelp } from "@/components/v-intern/icons";
import { ArrowLoopDoodle } from "@/components/v-intern/doodles";
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
      className="nb-error-card mx-auto my-8 max-w-xl bg-card p-6 shadow-app-xs"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-control bg-destructive-subtle text-destructive">
          <IconCircleHelp size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground">{title}</h2>
          <p className="mt-1.5 text-body leading-6 text-muted-foreground">{errorMessage(error)}</p>
          {validation.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-caption leading-5 text-muted-foreground">
              {validation.map((detail, index) => <li key={index}>{detail}</li>)}
            </ul>
          )}
          {onRetry && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={onRetry} className={btn("primary", "sm")}>
                Thử lại
              </button>
              {/* Mũi tên xoắn mực đỏ — “bút giáo viên” chỉ thẳng nút thử lại */}
              <ArrowLoopDoodle
                className="hidden h-8 w-10 shrink-0 rotate-6 text-destructive/50 sm:block"
              />
              <span className="text-caption text-muted-foreground">
                Nếu lỗi lặp lại, kiểm tra kết nối hoặc quay lại sau ít phút.
              </span>
            </div>
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
      className="flex items-center justify-center gap-3 p-8 text-body text-muted-foreground"
    >
      <Spinner className="size-4 text-primary" />
      <span>{label}</span>
    </div>
  );
}
