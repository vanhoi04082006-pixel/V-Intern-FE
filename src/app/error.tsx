"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { btn } from "@/components/product/primitives";
import { IconAlertTriangle } from "@/components/v-intern/icons";
import { CoffeeStainDoodle, StampBadge, Tape } from "@/components/v-intern/doodles";

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
    <div className="app-surface relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-6">
      {/* Nền giấy ô ly mờ qua mặt nạ mềm — trang trí, không cản tương tác */}
      <div
        aria-hidden="true"
        className="bg-grid-paper mask-fade-edges pointer-events-none absolute inset-0 opacity-80"
      />
      {/* Vệt mực loang góc màn — sự cố nhỏ như tờ giấy bị đổ mực */}
      <CoffeeStainDoodle
        className="pointer-events-none absolute -right-4 top-14 h-20 w-20 rotate-12 text-ink/[0.05]"
      />
      <div className="relative w-full max-w-lg">
        <div className="sketch-card group relative animate-paper-settle px-6 py-10 text-center sm:px-10">
          <Tape className="-top-3 left-1/2 ml-[-48px]" rotate={-3} variant="candy" />
          <span className="mx-auto grid size-12 place-items-center text-destructive">
            <IconAlertTriangle size={26} aria-hidden="true" />
          </span>
          <StampBadge className="mt-4 text-destructive" rotate={-6}>
            LỖI
          </StampBadge>
          <h1 className="mt-4 text-page font-semibold text-foreground">
            Đã xảy ra lỗi ngoài mong đợi
          </h1>
          <p className="font-hand mt-1 text-body text-ink-soft">
            giọt mực làm nhòe trang này rồi…
          </p>
          <p className="mt-3 text-body leading-6 text-muted-foreground">
            Bạn có thể thử tải lại khu vực này. Nếu lỗi vẫn tiếp diễn, hãy quay
            về trang làm việc và thử lại sau.
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
    </div>
  );
}
