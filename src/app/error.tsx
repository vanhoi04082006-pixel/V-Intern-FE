"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { btn } from "@/components/product/primitives";

/**
 * Error boundary cấp app (Next 16 `retry` prop). Hiển thị thông điệp an toàn,
 * mã lỗi (digest) khi có, nút thử lại và đường về trang làm việc theo vai trò.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const path = usePathname();
  useEffect(() => {
    console.error(error);
  }, [error]);
  const workspace = path?.startsWith("/admin")
    ? "/admin"
    : path?.startsWith("/instructor")
      ? "/instructor"
      : path?.startsWith("/intern")
        ? "/intern"
        : "/";
  const backLabel = workspace === "/" ? "Về trang chủ" : "Về trang làm việc";
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-xs">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <CircleAlert size={24} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-navy">
          Đã xảy ra lỗi ngoài mong đợi
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Bạn có thể thử tải lại khu vực này. Nếu lỗi vẫn tiếp diễn, hãy quay về
          trang làm việc và thử lại sau.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-slate-400">
            Mã lỗi: <span className="font-mono">{error.digest}</span>
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => retry()} className={btn("primary")}>
            Thử lại
          </button>
          <Link href={workspace} className={btn("secondary")}>
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
