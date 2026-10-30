/** Loading toàn cục (Lớp 6) — trang sổ tay đang mở: spinner vẽ tay + các dòng
 *  chì phác trong khung đường cắt giấy. Server component thuần (animation CSS). */
export default function Loading() {
  return (
    <div className="app-surface flex min-h-dvh items-center justify-center bg-background p-6">
      <div
        role="status"
        aria-label="Đang mở trang sổ tay"
        className="dashed-cut w-full max-w-md rounded-xl bg-paper-raised p-6 sm:p-8"
      >
        <div className="flex items-center justify-center gap-3 text-ink-soft">
          <span className="spinner-hand size-5 text-blue" aria-hidden="true" />
          <span className="font-hand text-body">Đang mở trang sổ tay…</span>
        </div>
        <div className="mt-6 space-y-3" aria-hidden="true">
          <div className="skeleton-pencil h-4 w-11/12" />
          <div className="skeleton-pencil h-4 w-9/12" />
          <div className="skeleton-pencil h-4 w-10/12" />
        </div>
      </div>
    </div>
  );
}
