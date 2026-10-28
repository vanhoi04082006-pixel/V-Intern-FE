"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { btn } from "@/components/product/primitives";

/** 404 toàn cục — không đụng tới trang chủ, chỉ thay thế Next default. */
export default function NotFound() {
  return (
    <div className="app-surface flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto grid size-12 place-items-center text-primary">
          <Compass size={24} aria-hidden="true" />
        </span>
        <p className="mt-4 text-small font-semibold text-primary">
          V-Intern
        </p>
        <p className="mt-1 text-display font-semibold text-foreground">404</p>
        <h1 className="mt-3 text-page font-semibold text-foreground">
          Không tìm thấy trang bạn cần
        </h1>
        <p className="mt-2 text-body leading-6 text-muted-foreground">
          Đường dẫn có thể đã thay đổi hoặc không tồn tại. Hãy kiểm tra lại hoặc
          quay về một trong các điểm bắt đầu bên dưới.
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
  );
}
