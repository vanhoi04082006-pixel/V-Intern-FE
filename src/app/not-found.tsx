import Link from "next/link";
import { Compass } from "lucide-react";

const primaryClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
const secondaryClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

/** 404 toàn cục — không đụng tới trang chủ, chỉ thay thế Next default. */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-xs">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Compass size={24} aria-hidden="true" />
        </span>
        <p className="mt-4 text-[13px] font-semibold uppercase tracking-widest text-blue-700">
          V-Intern
        </p>
        <p className="mt-1 text-5xl font-bold tracking-tight text-navy">404</p>
        <h1 className="mt-3 text-lg font-bold text-navy">
          Không tìm thấy trang bạn cần
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Đường dẫn có thể đã thay đổi hoặc không tồn tại. Hãy kiểm tra lại hoặc
          quay về một trong các điểm bắt đầu bên dưới.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className={primaryClass}>
            Về trang chủ
          </Link>
          <Link href="/login" className={secondaryClass}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
