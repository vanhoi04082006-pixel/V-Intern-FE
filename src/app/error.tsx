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
    <div className="app-surface flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto grid size-12 place-items-center text-destructive">
          <CircleAlert size={24} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-page font-semibold text-foreground">
          Đã xảy ra lỗi ngoài mong đợi
        </h1>
        <p className="mt-2 text-body leading-6 text-muted-foreground">
          Bạn có thể thử tải lại khu vực này. Nếu lỗi vẫn tiếp diễn, hãy quay về
          trang làm việc và thử lại sau.
        </p>
        {error.digest && (
          <p className="mt-3 text-caption text-muted-foreground">
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
