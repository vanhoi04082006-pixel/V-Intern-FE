"use client";

import Link from "next/link";
import { btn } from "@/components/product/primitives";
import { IconCompass } from "@/components/v-intern/icons";
import { StarDoodle, Tape } from "@/components/v-intern/doodles";

/** 404 toàn cục — không đụng tới trang chủ, chỉ thay thế Next default. */
export default function NotFound() {
  return (
    <div className="app-surface relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-6">
      {/* Nền giấy ô ly mờ qua mặt nạ mềm — trang trí, không cản tương tác */}
      <div
        aria-hidden="true"
        className="bg-grid-paper mask-fade-edges pointer-events-none absolute inset-0 opacity-80"
      />
      <div className="relative w-full max-w-lg">
        <div className="sketch-card group relative animate-paper-settle px-6 py-10 text-center sm:px-10">
          <Tape className="-top-3 left-1/2 ml-[-48px]" rotate={-3} />
          <StarDoodle className="absolute right-5 top-5 h-6 w-6 text-ink-faint" />
          <span className="mx-auto grid size-12 place-items-center text-blue">
            <IconCompass size={26} aria-hidden="true" />
          </span>
          <p className="mt-4 text-small font-semibold text-primary">V-Intern</p>
          <p className="font-hand mt-1 text-display font-semibold leading-none text-blue">
            404
          </p>
          <h1 className="mt-3 text-page font-semibold text-foreground">
            Không tìm thấy trang bạn cần
          </h1>
          <p className="font-hand mt-1 text-body text-ink-soft">
            trang này chắc bị xé mất rồi…
          </p>
          <p className="mt-3 text-body leading-6 text-muted-foreground">
            Đường dẫn có thể đã thay đổi hoặc không tồn tại. Hãy kiểm tra lại
            hoặc quay về một trong các điểm bắt đầu bên dưới.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/" className={btn("primary")}>
              Về trang chủ
            </Link>
            <Link href="/login" className={btn("secondary")}>
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
